use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres};
use validator::Validate;

use crate::{
    db::queries::{create_user, get_user_by_email, update_login_activity, verify_password},
    middleware::auth::create_token,
    models::user::User,
};

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(length(min = 1, max = 50))]
    pub firstname: String,
    #[validate(length(min = 1, max = 50))]
    pub lastname: String,
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 6))]
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: User,
}

/// Register a new user
/// 
/// Register a new user with the provided details and return a JWT token.
#[utoipa::path(
    post,
    path = "/auth/register",
    request_body = RegisterRequest,
    responses(
        (status = 201, description = "User registered successfully", body = AuthResponse),
        (status = 400, description = "Invalid input"),
        (status = 409, description = "User already exists")
    ),
    tag = "Authentication"
)]
pub async fn register(
    State(pool): State<Pool<Postgres>>,
    Json(payload): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<AuthResponse>), (StatusCode, Json<String>)> {
    println!("📝 Processing registration request for email: {}", payload.email);

    // Validate request
    if let Err(e) = payload.validate() {
        println!("❌ Registration validation failed: {}", e);
        return Err((
            StatusCode::BAD_REQUEST,
            Json(format!("Validation error: {}", e)),
        ));
    }

    // Check if user already exists
    if let Ok(_) = get_user_by_email(&pool, &payload.email).await {
        println!("❌ Registration failed: User already exists with email: {}", payload.email);
        return Err((
            StatusCode::CONFLICT,
            Json("User with this email already exists".to_string()),
        ));
    }

    // Create user
    let user = create_user(
        &pool,
        &payload.firstname,
        &payload.lastname,
        &payload.email,
        &payload.password,
    )
    .await
    .map_err(|e| {
        println!("❌ Failed to create user in database: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json("Failed to create user".to_string()),
        )
    })?;

    // Create token
    let token = create_token(&user.email, &user.role).map_err(|e| {
        println!("❌ Failed to create token: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json("Failed to create token".to_string()),
        )
    })?;

    println!("✅ Registration successful for user: {} {}", user.firstname, user.lastname);
    Ok((StatusCode::CREATED, Json(AuthResponse { token, user })))
}

/// Login user
/// 
/// Login with email and password to receive a JWT token.
#[utoipa::path(
    post,
    path = "/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = AuthResponse),
        (status = 401, description = "Invalid credentials")
    ),
    tag = "Authentication"
)]
pub async fn login(
    State(pool): State<Pool<Postgres>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<String>)> {
    println!("🔐 Processing login request for email: {}", payload.email);

    // Get user
    let user = get_user_by_email(&pool, &payload.email)
        .await
        .map_err(|_| {
            println!("❌ Login failed: User not found with email: {}", payload.email);
            (
                StatusCode::UNAUTHORIZED,
                Json("Invalid credentials".to_string()),
            )
        })?;

    // Verify password
    if !verify_password(&payload.password, &user.password) {
        println!("❌ Login failed: Invalid password for user: {}", payload.email);
        return Err((
            StatusCode::UNAUTHORIZED,
            Json("Invalid credentials".to_string()),
        ));
    }

    // Update login activity
    if let Err(e) = update_login_activity(&pool, user.id).await {
        println!("⚠️ Failed to update login activity: {}", e);
        // Don't return error to user, just log it
    }

    // Create token
    let token = create_token(&user.email, &user.role).map_err(|e| {
        println!("❌ Failed to create token: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json("Failed to create token".to_string()),
        )
    })?;

    println!("✅ Login successful for user: {} {}", user.firstname, user.lastname);
    Ok(Json(AuthResponse { token, user }))
}
