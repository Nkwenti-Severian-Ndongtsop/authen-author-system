# Build stage
FROM node:20-slim as builder

# Set working directory
WORKDIR /app

# First, build the ts-client
WORKDIR /app/ts-client
# Copy ts-client package files
COPY ts-client/package*.json ./
# Install ts-client dependencies
RUN npm ci
# Copy ts-client source code
COPY ts-client/ .
# Build ts-client
RUN npm run build

# Now build the frontend
WORKDIR /app/frontend
# Copy frontend package files
COPY frontend/package*.json ./
# Install frontend dependencies
RUN npm ci
# Copy frontend source code
COPY frontend/ .
# Link the local ts-client
RUN npm link ../ts-client

# Build the frontend application
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 