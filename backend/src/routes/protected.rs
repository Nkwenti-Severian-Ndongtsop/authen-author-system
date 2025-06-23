use axum::{
    extract::Extension,
    http::StatusCode,
    Json,
};
use serde_json::json;
use crate::models::user::User;

/// Admin protected route
/// 
/// This endpoint is only accessible to users with the Admin role.
/// Requires a valid JWT token with Admin privileges in the Authorization header.
#[utoipa::path(
    get,
    path = "/admin",
    responses(
        (status = 200, description = "Successfully accessed admin route"),
        (status = 401, description = "No token provided or invalid token"),
        (status = 403, description = "Valid token but insufficient privileges - Requires Admin role")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Protected Routes"
)]
pub async fn admin_route(
    Extension(user): Extension<User>,
) -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::OK,
        Json(json!({
            "message": "Welcome to admin route",
            "user": {
                "firstname": user.firstname,
                "lastname": user.lastname,
                "email": user.email,
                "role": user.role
            }
        })),
    )
}

/// User protected route
/// 
/// This endpoint is accessible to all authenticated users (both User and Admin roles).
/// Requires a valid JWT token in the Authorization header.
#[utoipa::path(
    get,
    path = "/user",
    responses(
        (status = 200, description = "Successfully accessed user route"),
        (status = 401, description = "No token provided or invalid token"),
        (status = 403, description = "Token validation failed")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Protected Routes"
)]
pub async fn user_route(
    Extension(user): Extension<User>,
) -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::OK,
        Json(json!({
            "message": "Welcome to user route",
            "user": {
                "firstname": user.firstname,
                "lastname": user.lastname,
                "email": user.email,
                "role": user.role
            }
        })),
    )
}
