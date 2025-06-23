# Build stage
FROM node:20-slim as builder

# Set working directory
WORKDIR /app

# First, build the ts-client
WORKDIR /app/ts-client
# Copy ts-client files
COPY ts-client/ .
# Install ts-client dependencies and build
RUN npm ci && npm run build

# Now build the frontend
WORKDIR /app/frontend
# Copy frontend files
COPY frontend/ .
# Install frontend dependencies
RUN npm install
# Link the local ts-client
RUN npm link ../ts-client

# Build the frontend application
ARG VITE_BACKEND_API
ENV VITE_BACKEND_API=$VITE_BACKEND_API
RUN npm run build || (echo "Build failed. Showing TypeScript errors:" && npx tsc --noEmit && exit 1)

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