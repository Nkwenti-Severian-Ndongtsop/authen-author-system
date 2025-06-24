use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use sqlx::{Pool, Postgres};
use validator::Validate;

use crate::{
    db::queries::{get_user_by_email, update_user_profile},
    middleware::auth::decode_token,
    models::user::{User, ProfileUpdateRequest},
};

/// Get user profile
/// 
/// Returns the profile information for the authenticated user.
#[utoipa::path(
    get,
    path = "/profile",
    responses(
        (status = 200, description = "Profile retrieved successfully", body = User),
        (status = 401, description = "Unauthorized - Invalid or missing token")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Profile"
)]
pub async fn get_profile(
    State(pool): State<Pool<Postgres>>,
    TypedHeader(auth): TypedHeader<Authorization<Bearer>>,
) -> Result<Json<User>, (StatusCode, Json<String>)> {
    // Verify token and get claims
    let claims = decode_token(auth.token())
        .map_err(|_| (StatusCode::UNAUTHORIZED, Json("Invalid token".to_string())))?;

    // Get user from database
    let user = get_user_by_email(&pool, &claims.sub)
        .await
        .map_err(|_| (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json("Failed to fetch user profile".to_string()),
        ))?;

    Ok(Json(user))
}

/// Update user profile
/// 
/// Update the authenticated user's profile information.
#[utoipa::path(
    put,
    path = "/profile/update",
    request_body = ProfileUpdateRequest,
    responses(
        (status = 200, description = "Profile updated successfully", body = User),
        (status = 400, description = "Invalid input"),
        (status = 401, description = "Unauthorized - Invalid or missing token")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Profile"
)]
pub async fn update_profile(
    State(pool): State<Pool<Postgres>>,
    TypedHeader(auth): TypedHeader<Authorization<Bearer>>,
    Json(payload): Json<ProfileUpdateRequest>,
) -> Result<Json<User>, (StatusCode, Json<String>)> {
    // Validate request
    if let Err(e) = payload.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(format!("Validation error: {}", e)),
        ));
    }

    // Verify token and get claims
    let claims = decode_token(auth.token())
        .map_err(|_| (StatusCode::UNAUTHORIZED, Json("Invalid token".to_string())))?;

    // Get current user
    let current_user = get_user_by_email(&pool, &claims.sub)
        .await
        .map_err(|_| (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json("Failed to fetch user profile".to_string()),
        ))?;

    // Update user profile
    let updated_user = update_user_profile(
        &pool,
        current_user.id,
        payload.firstname.as_deref(),
        payload.lastname.as_deref(),
        payload.email.as_deref(),
        payload.password.as_deref(),
        payload.profile_picture.as_deref(),
    )
    .await
    .map_err(|_| (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json("Failed to update profile".to_string()),
    ))?;

    Ok(Json(updated_user))
} 