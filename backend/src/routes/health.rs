use axum::{response::Json};
use serde_json::json;

/// Health check endpoint
/// 
/// Returns a simple status check to verify the API is running.
#[utoipa::path(
    get,
    path = "/health",
    responses(
        (status = 200, description = "API is healthy", body = String, example = json!({"status": "healthy"}))
    ),
    tag = "Health"
)]
pub async fn health_check() -> Json<serde_json::Value> {
    Json(json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
} 