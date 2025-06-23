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
use tower_http::cors::CorsLayer;
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
    init();

    // CORS configuration
    let cors = CorsLayer::new()
        // Allow methods needed for Swagger UI
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::OPTIONS,
            axum::http::Method::HEAD,
        ])
        // Allow requests from any origin
        .allow_origin(get_frontend_url().parse::<axum::http::HeaderValue>().unwrap())
        // Allow sending any headers in the request
        .allow_headers([
            axum::http::header::AUTHORIZATION,
            axum::http::header::ACCEPT,
            axum::http::header::CONTENT_TYPE,
            axum::http::header::ORIGIN,
        ])
        // Allow credentials (cookies, authorization headers)
        .allow_credentials(true);

    // Create router with all routes
    let app = Router::new()
        .route("/register", post(auth::register))   
        .route("/login", post(auth::login))
        .route("/api/profile", get(routes::profile::get_profile))
        .route(
            "/admin",
            get(protected::admin_route)
                .route_layer(from_fn_with_state(Role::Admin, auth_middleware)),
        )
        .route(
            "/user",
            get(protected::user_route)
                .route_layer(from_fn_with_state(Role::User, auth_middleware)),
        )
        // Serve Swagger UI and OpenAPI docs
        .merge(SwaggerUi::new("/swagger-ui")
            .url("/api-docs/openapi.json", ApiDoc::openapi())
        )
        .with_state(init_db(get_database_url().as_str()).await)
        .layer(cors);

    println!("🚀 Server running on http://localhost:{}", get_port());
    println!("📚 Swagger UI available at http://localhost:{}/swagger-ui/", get_port());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", get_port()))
        .await
        .unwrap();
    axum::serve(listener, app).await.unwrap();
}
