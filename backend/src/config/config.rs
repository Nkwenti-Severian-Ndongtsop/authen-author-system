use std::env;

pub fn init() {
    dotenv::dotenv().ok();
}

pub fn get_database_url() -> String {
    env::var("DATABASE_URL").expect("DATABASE_URL must be set")
}

pub fn get_frontend_url() -> String {
    env::var("FRONTEND_URL").expect("FRONTEND_URL must be set")
}

pub fn get_jwt_secret() -> String {
    env::var("JWT_SECRET").expect("JWT_SECRET must be set")
}

pub fn get_port() -> u16 {
    env::var("PORT")
        .expect("PORT must be set")
        .parse()
        .expect("PORT must be a number")
} 