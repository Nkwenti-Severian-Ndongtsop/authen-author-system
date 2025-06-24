use bcrypt::{hash, verify, DEFAULT_COST};
use sqlx::{Pool, Postgres};

use crate::models::user::User;
use std::env;
pub async fn init_db(database_url: &str) -> Pool<Postgres> {
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await
        .expect("Failed to connect to database");

    // Run migrations
    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    
    create_admin_if_not_exists(&pool).await;

    pool
}

async fn create_admin_if_not_exists(pool: &Pool<Postgres>) {
    let (firstname, lastname, email, password) = (
        env::var("ADMIN_FIRSTNAME").expect("ADMIN_FIRSTNAME must be set"),
        env::var("ADMIN_LASTNAME").expect("ADMIN_LASTNAME must be set"),
        env::var("ADMIN_EMAIL").expect("ADMIN_EMAIL must be set"),
        env::var("ADMIN_PASSWORD").expect("ADMIN_PASSWORD must be set"),
    );

    let admin_exists = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists",
        email
    )
    .fetch_one(pool)
    .await
    .map(|row| row.exists.unwrap_or(false))
    .unwrap_or(false);

    if !admin_exists {
        let hashed_password = hash(password.as_bytes(), DEFAULT_COST).unwrap();
        
        sqlx::query!(
            r#"
            INSERT INTO users (firstname, lastname, email, password, role)
            VALUES ($1, $2, $3, $4, $5)
            "#,
            firstname,
            lastname,
            email,
            hashed_password,
            "Admin"
        )
        .execute(pool)
        .await
        .map(|_| println!("Default admin user created with email: {}", email))
        .unwrap_or_else(|e| eprintln!("Failed to create admin user: {}", e));
    }
}

pub async fn create_user(
    pool: &Pool<Postgres>,
    firstname: &str,
    lastname: &str,
    email: &str,
    password: &str,
) -> Result<User, sqlx::Error> {
    let hashed_password = hash(password.as_bytes(), DEFAULT_COST).unwrap();

    sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (firstname, lastname, email, password, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, firstname, lastname, email, password, role
        "#,
        firstname,
        lastname,
        email,
        hashed_password,
        "User"
    )
    .fetch_one(pool)
    .await
}

pub async fn get_user_by_email(
    pool: &Pool<Postgres>,
    email: &str,
) -> Result<User, sqlx::Error> {
    sqlx::query_as!(
        User,
        r#"
        SELECT id, firstname, lastname, email, password, role, created_at, last_login, login_count, profile_picture
        FROM users
        WHERE email = $1
        "#,
        email
    )
    .fetch_one(pool)
    .await
}

pub async fn update_user_profile(
    pool: &Pool<Postgres>,
    user_id: i32,
    firstname: Option<&str>,
    lastname: Option<&str>,
    email: Option<&str>,
    password: Option<&str>,
    profile_picture: Option<&str>,
) -> Result<User, sqlx::Error> {
    let mut query = String::from(
        "UPDATE users SET 
        firstname = COALESCE($1, firstname),
        lastname = COALESCE($2, lastname),
        email = COALESCE($3, email),
        profile_picture = COALESCE($4, profile_picture)"
    );

    let hashed_password = if let Some(pass) = password {
        Some(hash(pass.as_bytes(), DEFAULT_COST).unwrap())
    } else {
        None
    };

    if hashed_password.is_some() {
        query.push_str(", password = COALESCE($5, password)");
    }

    query.push_str(" WHERE id = $6 RETURNING id, firstname, lastname, email, password, role, created_at, last_login, login_count, profile_picture");

    sqlx::query_as::<_, User>(&query)
        .bind(firstname)
        .bind(lastname)
        .bind(email)
        .bind(profile_picture)
        .bind(hashed_password.as_deref())
        .bind(user_id)
        .fetch_one(pool)
        .await
}

pub async fn update_login_activity(
    pool: &Pool<Postgres>,
    user_id: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP,
            login_count = COALESCE(login_count, 0) + 1
        WHERE id = $1
        "#,
        user_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    verify(password.as_bytes(), hash).unwrap_or(false)
}