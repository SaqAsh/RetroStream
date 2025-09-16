# 🐳 Docker Setup Guide for RetroStream

## Overview

RetroStream now includes a complete Docker setup that creates a virtual desktop environment for screen streaming demonstration. This is perfect for:

- **Development environments** without complex dependencies
- **Cloud deployments** with consistent environments  
- **Demo purposes** with a virtual screen to capture
- **CI/CD pipelines** for automated testing

## What's Included

### 🏗️ Docker Infrastructure
- **Multi-stage Dockerfile** with optimized builds
- **Docker Compose** for easy orchestration
- **Virtual X11 display** with Xvfb for screen capture
- **Automated setup script** (`docker-run.sh`)

### 🖥️ Virtual Desktop Environment
- **Xvfb** (Virtual Framebuffer) for headless display
- **Fluxbox** lightweight desktop environment
- **Demo terminal** showing live updates
- **Configurable resolution** (default: 1280x720)

### 🚀 Easy Commands
```bash
./docker-run.sh           # Build and run everything
./docker-run.sh build     # Build the image
./docker-run.sh run       # Run production mode
./docker-run.sh dev       # Run development mode  
./docker-run.sh logs      # View logs
./docker-run.sh stop      # Stop all containers
./docker-run.sh clean     # Clean up everything
```

## How It Works

1. **Build Stage**: Compiles Rust backend and builds TypeScript frontend
2. **Runtime Stage**: Sets up Ubuntu with X11 virtual display
3. **Virtual Display**: Creates a demo desktop with terminal output
4. **Screen Capture**: Backend captures the virtual display
5. **Live Stream**: Frontend shows the captured screen with retro styling

## Docker Features

### 🔧 Development Mode
- Debug logging enabled
- Separate ports (8081/3001) to avoid conflicts
- Volume mounts for live code changes

### 📊 Health Monitoring
- Built-in health checks
- Automatic restart policies
- Container status monitoring

### 🌐 Port Mapping
- **Production**: 8080 (backend), 3000 (frontend)
- **Development**: 8081 (backend), 3001 (frontend)

## Installation Requirements

### For Docker Setup:
1. **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
2. **Docker Compose** (usually included with Docker Desktop)

### For Native Setup:
1. **Rust 1.70+** (install from https://rustup.rs/)
2. **Node.js 18+** (install from https://nodejs.org/)

## Quick Start

### 🐳 With Docker (Recommended):
```bash
git clone <your-repo>
cd screen-stream-app
./docker-run.sh
```

Then open: http://localhost:3000

### 🛠️ Without Docker:
```bash
git clone <your-repo>
cd screen-stream-app
./run.sh
```

## Architecture Benefits

### 🏗️ Production Ready
- **Multi-stage builds** for smaller images
- **Security hardening** with non-root user
- **Resource optimization** with proper caching
- **Health checks** and monitoring

### 🔄 Development Friendly  
- **Hot reload** in development mode
- **Debug logging** for troubleshooting
- **Volume mounts** for live code changes
- **Separate environments** for testing

### 🌍 Cloud Ready
- **Containerized deployment** for any platform
- **Environment variables** for configuration
- **Horizontal scaling** support
- **CI/CD integration** ready

## Troubleshooting

### Docker Issues:
```bash
# Check Docker status
docker --version
docker-compose --version

# View container logs
./docker-run.sh logs -f

# Open container shell for debugging
./docker-run.sh shell
```

### Permission Issues:
```bash
# Make scripts executable
chmod +x docker-run.sh run.sh docker-entrypoint.sh
```

### Port Conflicts:
```bash
# Use development mode with different ports
./docker-run.sh dev

# Or stop conflicting services
./docker-run.sh stop
```

## What You Get

When you run the Docker setup, you'll see:

1. **🎨 Beautiful Retro Interface** - Cyberpunk terminal styling
2. **📺 Live Screen Stream** - Real-time virtual desktop capture  
3. **📊 Performance Metrics** - FPS, latency, connection status
4. **🎮 Interactive Controls** - Quality settings, scaling, fullscreen
5. **📝 System Logs** - Real-time logging with color coding

The virtual desktop shows a live terminal with timestamps, demonstrating the screen capture functionality in a contained environment.

## Next Steps

- **Deploy to cloud** using the Docker image
- **Scale horizontally** with Docker Swarm or Kubernetes
- **Add authentication** for production use
- **Integrate with CI/CD** for automated testing
- **Monitor with Prometheus** using the metrics endpoint

This Docker setup makes RetroStream incredibly easy to deploy and demonstrate anywhere! 🚀
