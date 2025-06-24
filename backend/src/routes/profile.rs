use axum::{
    extract::{State, Multipart, FromRequest},
    http::StatusCode,
    Json, body::Bytes,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use sqlx::{Pool, Postgres};
use validator::Validate;
use std::str::FromStr;
use std::default::Default;
use uuid::Uuid;
use std::path::Path;
use tokio::fs;

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
    content_type: axum::http::HeaderMap,
    mut request: axum::extract::Request<axum::body::Body>,
) -> Result<Json<User>, (StatusCode, Json<String>)> {
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

    // Parse the request based on content type
    let payload = if content_type
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .map(|v| v.starts_with("multipart/form-data"))
        .unwrap_or(false)
    {
        // Handle multipart form data
        let mut multipart = Multipart::from_request(request, &content_type)
            .await
            .map_err(|e| (
                StatusCode::BAD_REQUEST,
                Json(format!("Invalid multipart form data: {}", e)),
            ))?;

        let mut profile_update = ProfileUpdateRequest::default();

        while let Some(field) = multipart.next_field().await.map_err(|e| (
            StatusCode::BAD_REQUEST,
            Json(format!("Error processing form data: {}", e)),
        ))? {
            let name = field.name().unwrap_or("").to_string();
            let value = field.text().await.map_err(|e| (
                StatusCode::BAD_REQUEST,
                Json(format!("Error reading field {}: {}", name, e)),
            ))?;

            match name.as_str() {
                "firstname" => profile_update.firstname = Some(value),
                "lastname" => profile_update.lastname = Some(value),
                "email" => profile_update.email = Some(value),
                "password" => profile_update.password = Some(value),
                "profile_picture" => profile_update.profile_picture = Some(value),
                _ => {}
            }
        }
        profile_update
    } else {
        // Handle JSON request
        let body = Bytes::from_request(request, &content_type)
            .await
            .map_err(|e| (
                StatusCode::BAD_REQUEST,
                Json(format!("Failed to read request body: {}", e)),
            ))?;

        serde_json::from_slice(&body).map_err(|e| (
            StatusCode::BAD_REQUEST,
            Json(format!("Invalid JSON payload: {}", e)),
        ))?
    };

    // Validate request
    if let Err(e) = payload.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(format!("Validation error: {}", e)),
        ));
    }

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

/// Upload profile photo
/// 
/// Upload a new profile photo for the authenticated user.
#[utoipa::path(
    post,
    path = "/profile/photo",
    responses(
        (status = 200, description = "Photo uploaded successfully"),
        (status = 400, description = "Invalid file format"),
        (status = 401, description = "Unauthorized - Invalid or missing token")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Profile"
)]
pub async fn upload_photo(
    State(pool): State<Pool<Postgres>>,
    TypedHeader(auth): TypedHeader<Authorization<Bearer>>,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<String>)> {
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

    // Process the uploaded file
    while let Some(field) = multipart.next_field().await.map_err(|e| (
        StatusCode::BAD_REQUEST,
        Json(format!("Error processing form data: {}", e)),
    ))? {
        if field.name() == Some("photo") {
            let file_name = field.file_name()
                .ok_or((StatusCode::BAD_REQUEST, Json("No filename provided".to_string())))?
                .to_string();

            // Validate file type
            let extension = Path::new(&file_name)
                .extension()
                .and_then(|ext| ext.to_str())
                .ok_or((StatusCode::BAD_REQUEST, Json("Invalid file format".to_string())))?
                .to_lowercase();

            if !["jpg", "jpeg", "png", "gif"].contains(&extension.as_str()) {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json("Invalid file format. Allowed formats: jpg, jpeg, png, gif".to_string()),
                ));
            }

            // Read file data
            let data = field.bytes().await.map_err(|e| (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(format!("Failed to read file data: {}", e)),
            ))?;

            // Generate unique filename
            let unique_filename = format!("{}.{}", Uuid::new_v4(), extension);
            let upload_path = Path::new("uploads").join(&unique_filename);

            // Create uploads directory if it doesn't exist
            fs::create_dir_all("uploads").await.map_err(|e| (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(format!("Failed to create upload directory: {}", e)),
            ))?;

            // Save file
            fs::write(&upload_path, data).await.map_err(|e| (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(format!("Failed to save file: {}", e)),
            ))?;

            // Update user's profile_picture in database
            let file_url = format!("/uploads/{}", unique_filename);
            update_user_profile(
                &pool,
                current_user.id,
                None,
                None,
                None,
                None,
                Some(&file_url),
            )
            .await
            .map_err(|_| (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Failed to update profile picture".to_string()),
            ))?;

            return Ok(Json(serde_json::json!({
                "url": file_url
            })));
        }
    }

    Err((StatusCode::BAD_REQUEST, Json("No photo file found in request".to_string())))
} 