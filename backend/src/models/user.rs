use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;
use sqlx::FromRow;
use std::str::FromStr;

/// Represents a user in the system
#[derive(Debug, Serialize, Deserialize, FromRow, ToSchema, Clone)]
pub struct User {
    /// Unique identifier for the user
    pub id: i32,
    /// User's first name (2-50 characters)
    pub firstname: String,
    /// User's last name (2-50 characters)
    pub lastname: String,
    /// User's email address (unique)
    pub email: String,
    /// Hashed password (not returned in responses)
    #[schema(write_only)]
    pub password: String,
    /// User's role ("Admin" or "User")
    pub role: String,
}

impl User {
    #[allow(dead_code)]
    pub fn get_role(&self) -> Role {
        match self.role.as_str() {
            "Admin" => Role::Admin,
            _ => Role::User,
        }
    }
}

/// User roles in the system
#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq)]
pub enum Role {
    /// Administrator with full access
    Admin,
    /// Regular user with limited access
    User,
}

impl FromStr for Role {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Admin" => Ok(Role::Admin),
            "User" => Ok(Role::User),
            _ => Err(format!("Invalid role: {}", s)),
        }
    }
}

impl ToString for Role {
    fn to_string(&self) -> String {
        match self {
            Role::Admin => "Admin".to_string(),
            Role::User => "User".to_string(),
        }
    }
}

/// Request payload for user registration
#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct RegisterRequest {
    /// First name (2-50 characters)
    #[validate(length(min = 2, max = 50))]
    pub firstname: String,
    /// Last name (2-50 characters)
    #[validate(length(min = 2, max = 50))]
    pub lastname: String,
    /// Email address (must be valid format)
    #[validate(email)]
    pub email: String,
    /// Password (minimum 6 characters)
    #[validate(length(min = 6))]
    pub password: String,
}

/// Request payload for user login
#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct LoginRequest {
    /// Email address
    #[validate(email)]
    pub email: String,
    /// Password
    pub password: String,
}

/// Response containing JWT token
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct TokenResponse {
    /// JWT token for authentication
    pub token: String,
}
