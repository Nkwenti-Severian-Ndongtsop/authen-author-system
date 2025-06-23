use axum::{
    extract::State,
    http::Request,
    middleware::Next,
    response::Response,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres};
use crate::db::queries::get_user_by_email;

const JWT_SECRET: &[u8] = b"your-secret-key";

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,  // email
    pub role: String, // user role
    pub exp: usize,   // expiration time
}

pub fn create_token(email: &str, role: &str) -> String {
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: email.to_string(),
        role: role.to_string(),
        exp: expiration,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET),
    )
    .unwrap()
}

pub fn decode_token(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(JWT_SECRET),
        &Validation::default(),
    )?;
    Ok(token_data.claims)
}

pub async fn auth_middleware<R>(
    State(pool): State<Pool<Postgres>>,
    TypedHeader(auth): TypedHeader<Authorization<Bearer>>,
    mut request: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, (axum::http::StatusCode, String)>
where
    R: std::str::FromStr + PartialEq + ToString,
{
    let claims = decode_token(auth.token())
        .map_err(|_| (axum::http::StatusCode::UNAUTHORIZED, "Invalid token".to_string()))?;

    let user = get_user_by_email(&pool, &claims.sub)
        .await
        .map_err(|_| {
            (
                axum::http::StatusCode::UNAUTHORIZED,
                "User not found".to_string(),
            )
        })?;

    request.extensions_mut().insert(user);
    Ok(next.run(request).await)
}
