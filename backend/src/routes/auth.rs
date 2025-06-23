use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use sqlx::{Pool, Postgres};
use validator::Validate;

use crate::{
    db::queries::{create_user, get_user_by_email, verify_password},
    middleware::auth::create_token,
    models::user::{LoginRequest, RegisterRequest, TokenResponse},
};

/// Register a new user
/// 
/// Register a new user with their personal information.
/// All new registrations are assigned the "User" role by default.
#[utoipa::path(
    post,
    path = "/register",
    request_body = RegisterRequest,
    responses(
        (status = 201, description = "User successfully registered", body = TokenResponse, example = json!({"token": "eyJ0eXAi..."})),
        (status = 400, description = "Invalid input - Validation failed for firstname, lastname, email or password"),
        (status = 409, description = "Email already registered")
    ),
    tag = "Authentication"
)]
pub async fn register(
    State(pool): State<Pool<Postgres>>,
    Json(payload): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<TokenResponse>), (StatusCode, Json<String>)> {
    // Validate request
    if let Err(e) = payload.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(format!("Validation error: {}", e)),
        ));
    }

    // Create user
    match create_user(&pool, &payload.firstname, &payload.lastname, &payload.email, &payload.password).await {
        Ok(user) => {
            let token = create_token(&user.email, &user.role);
            Ok((StatusCode::CREATED, Json(TokenResponse { token })))
        }
        Err(_) => Err((
            StatusCode::CONFLICT,
            Json("Email already exists".to_string()),
        )),
    }
}

/// Login user
/// 
/// Authenticate a user with their email and password.
/// Returns a JWT token that should be included in subsequent requests.
#[utoipa::path(
    post,
    path = "/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful - Returns JWT token", body = TokenResponse, example = json!({"token": "eyJ0eXAi..."})),
        (status = 401, description = "Invalid credentials - Email or password is incorrect")
    ),
    tag = "Authentication"
)]
pub async fn login(
    State(pool): State<Pool<Postgres>>,
    Json(payload): Json<LoginRequest>,
) -> Result<(StatusCode, Json<TokenResponse>), (StatusCode, Json<String>)> {
    // Get user
    let user = get_user_by_email(&pool, &payload.email)
        .await
        .map_err(|_| {
            (
                StatusCode::UNAUTHORIZED,
                Json("Invalid email or password".to_string()),
            )
        })?;

    // Verify password
    if !verify_password(&payload.password, &user.password) {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json("Invalid email or password".to_string()),
        ));
    }

    // Create token
    let token = create_token(&user.email, &user.role);
    Ok((StatusCode::OK, Json(TokenResponse { token })))
}
