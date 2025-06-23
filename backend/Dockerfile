# Builder stage
FROM rust:1.76-slim AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

# Final stage
FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libssl3 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/auth_api .
ENV RUST_LOG=info
EXPOSE 8000
CMD ["./auth_api"] 