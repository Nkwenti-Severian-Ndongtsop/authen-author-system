### Builder stage
FROM rust:slim AS builder

# Set the working directory
WORKDIR /usr/src/backend

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    curl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Define build arguments
ARG DATABASE_URL
ARG FRONTEND_URL
ARG PORT
ARG JWT_SECRET
ARG ADMIN_FIRSTNAME
ARG ADMIN_LASTNAME
ARG ADMIN_EMAIL
ARG ADMIN_PASSWORD

# Copy backend files
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations

# Build the application
RUN cargo build --release

### Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /usr/src/backend/target/release/auth_api /app/auth_api

# Copy migrations directory for runtime
COPY --from=builder /usr/src/backend/migrations /app/migrations

# Define runtime arguments
ARG DATABASE_URL
ARG FRONTEND_URL
ARG PORT
ARG JWT_SECRET
ARG ADMIN_FIRSTNAME
ARG ADMIN_LASTNAME
ARG ADMIN_EMAIL
ARG ADMIN_PASSWORD

# Set runtime environment variables
ENV DATABASE_URL=${DATABASE_URL}
ENV FRONTEND_URL=${FRONTEND_URL}
ENV PORT=${PORT}
ENV JWT_SECRET=${JWT_SECRET}
ENV ADMIN_FIRSTNAME=${ADMIN_FIRSTNAME}
ENV ADMIN_LASTNAME=${ADMIN_LASTNAME}
ENV ADMIN_EMAIL=${ADMIN_EMAIL}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD}

# Expose the port
EXPOSE ${PORT}

# Run the app
CMD ["./auth_api"] 