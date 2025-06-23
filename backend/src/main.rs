mod db;
mod middleware;
mod models;
mod routes;
mod config;

use axum::{
    middleware::from_fn_with_state,
    routing::{get, post},
    Router,
};
use tower_http::cors::{CorsLayer, Any};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use crate::{
    db::queries::init_db,
    config::config::{get_port, init, get_frontend_url, get_database_url},
    middleware::auth::auth_middleware,
    models::user::Role,
    routes::{auth, protected},
};

#[derive(OpenApi)]
#[openapi(
    paths(
        routes::auth::login,
        routes::auth::register,
        routes::protected::admin_route,
        routes::protected::user_route,
        routes::profile::get_profile
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
        (name = "profile", description = "User profile endpoints")
    )
)]
struct ApiDoc;

#[tokio::main]
async fn main() {
    // Initialize environment
    init();

    // Get configuration
    let port = get_port();
    let frontend_url = get_frontend_url();
    let database_url = get_database_url();

    // Initialize database connection
    let pool = init_db(&database_url).await;

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([axum::http::Method::GET, axum::http::Method::POST])
        .allow_headers([axum::http::header::AUTHORIZATION, axum::http::header::CONTENT_TYPE]);

    // Build router
    let app = Router::new()
        .route("/auth/login", post(auth::login))
        .route("/auth/register", post(auth::register))
        .route("/api/profile", get(routes::profile::get_profile))
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
        .with_state(pool)
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .layer(cors);

    // Start server
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], port));
    println!("Server running on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
