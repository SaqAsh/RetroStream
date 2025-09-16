# Multi-stage Docker build for RetroStream

# Stage 1: Build the Rust backend
FROM ubuntu:22.04 as backend-builder

# Install Rust
RUN apt-get update && apt-get install -y curl build-essential && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    . "$HOME/.cargo/env"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libxcb1-dev \
    libxrandr-dev \
    libxss-dev \
    libglib2.0-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend
COPY backend/Cargo.toml ./
COPY backend/src ./src

# Build the backend
RUN cargo build --release

# Stage 2: Build the frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 3: Runtime container with both services
FROM ubuntu:22.04

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libxcb1 \
    libxrandr2 \
    libxss1 \
    libglib2.0-0 \
    libgtk-3-0 \
    curl \
    xvfb \
    x11vnc \
    fluxbox \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for serving frontend
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g serve

# Create app user
RUN useradd -m -s /bin/bash appuser

# Copy built backend
COPY --from=backend-builder /app/backend/target/release/screen-stream-backend /usr/local/bin/
COPY backend/config.toml /app/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist /app/frontend

# Create startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set up display for virtual screen
ENV DISPLAY=:99
ENV RESOLUTION=1280x720

# Expose ports
EXPOSE 8080 3000

# Switch to app user
USER appuser
WORKDIR /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
