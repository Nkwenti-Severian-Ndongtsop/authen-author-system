mod config;
mod db;
mod middleware;
mod models;
mod routes;

use crate::{
    config::config::{get_database_url, get_frontend_url, get_port, init},
    db::queries::init_db,
    middleware::auth::auth_middleware,
    models::user::Role,
    routes::{auth, protected},
};
use axum::{
    http::HeaderValue,
    middleware::from_fn_with_state,
    routing::{get, post, put},
    Router,
};
use tower_http::{cors::CorsLayer, services::ServeDir};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use std::path::PathBuf;

#[derive(OpenApi)]
#[openapi(
    paths(
        routes::auth::login,
        routes::auth::register,
        routes::protected::admin_route,
        routes::protected::user_route,
        routes::profile::get_profile,
        routes::profile::update_profile,
        routes::profile::upload_photo,
        routes::health::health_check,
    ),
    components(
        schemas(
            models::user::User,
            models::user::Role,
            models::user::LoginRequest,
            models::user::RegisterRequest,
            models::user::TokenResponse
        )
    ),
    tags(
        (name = "auth", description = "Authentication endpoints"),
        (name = "protected", description = "Protected endpoints"),
        (name = "profile", description = "User profile endpoints"),
        (name = "health", description = "Health check endpoint")
    )
)]
struct ApiDoc;

#[tokio::main]
async fn main() {
    // Initialize environment
    init();

    // Get configuration
    let frontend_url = get_frontend_url();
    let database_url = get_database_url();

    // Initialize database connection
    let pool = init_db(&database_url).await;

    // Configure CORS
    let cors = CorsLayer::new()
        // Allow methods needed for Swagger UI
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::PUT,
            axum::http::Method::OPTIONS,
            axum::http::Method::HEAD,
        ])
        // Allow specific origins during development
        .allow_origin(frontend_url.parse::<HeaderValue>().unwrap())
        .allow_headers([
            axum::http::header::AUTHORIZATION,
            axum::http::header::CONTENT_TYPE,
            axum::http::header::ACCEPT,
        ]);

    // Create uploads directory if it doesn't exist
    tokio::fs::create_dir_all("backend/uploads").await.unwrap_or_default();

    // Build router
    let app = Router::new()
        .route("/health", get(routes::health::health_check))
        .route("/auth/login", post(auth::login))
        .route("/auth/register", post(auth::register))
        .route("/api/profile", get(routes::profile::get_profile))
        .route("/api/profile/update", put(routes::profile::update_profile))
        .route("/api/profile/photo", post(routes::profile::upload_photo))
        .route(
            "/api/admin",
            get(protected::admin_route)
                .layer(from_fn_with_state(pool.clone(), auth_middleware::<Role>)),
        )
        .route(
            "/api/user",
            get(protected::user_route)
                .layer(from_fn_with_state(pool.clone(), auth_middleware::<Role>)),
        )
        .nest_service("/uploads", ServeDir::new(PathBuf::from("backend/uploads")))
        .with_state(pool)
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .layer(cors);

    println!("🚀 Server running on https://backend-auth-system.onrender.com");
    println!("📚 Swagger UI available at https://backend-auth-system.onrender.com/swagger-ui/");
    println!("💚 Health check available at https://backend-auth-system.onrender.com/health");

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", get_port()))
        .await
        .unwrap();
    axum::serve(listener, app).await.unwrap();
}
