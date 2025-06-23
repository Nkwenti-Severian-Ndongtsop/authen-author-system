use axum::{
    extract::{State, TypedHeader},
    headers::{authorization::Bearer, Authorization},
    http::StatusCode,
    Json,
};
use sqlx::{Pool, Postgres};

use crate::{
    db::queries::get_user_by_email,
    middleware::auth::verify_token,
    models::user::User,
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
    let claims = verify_token(auth.token())
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