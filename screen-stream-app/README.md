# RetroStream - High-Performance Screen Streaming App

A modern, high-performance screen streaming application with a retro cyberpunk aesthetic. Built with Rust backend and TypeScript frontend.

## Features

### Backend (Rust)
- **High-Performance Screen Capture**: Using `xcap` for efficient screen capturing
- **Real-time Compression**: Zstd compression for optimal bandwidth usage
- **WebSocket Streaming**: Low-latency frame delivery
- **Modular Architecture**: Clean separation of concerns
- **Comprehensive Metrics**: Performance monitoring and statistics
- **Configurable**: TOML-based configuration with CLI overrides
- **Error Handling**: Robust error handling and recovery
- **Graceful Shutdown**: Proper resource cleanup

### Frontend (TypeScript)
- **Retro Cyberpunk UI**: Beautiful terminal-inspired interface
- **Real-time Rendering**: Canvas-based frame rendering
- **Adaptive Quality**: Multiple quality settings
- **Frame Buffering**: Smart buffering for smooth playback
- **Performance Metrics**: Live FPS and latency monitoring
- **Responsive Design**: Works on desktop and mobile
- **Keyboard Shortcuts**: F11 for fullscreen, Ctrl+S for screenshot
- **Auto-reconnection**: Automatic reconnection with exponential backoff

## Project Structure

```
screen-stream-app/
├── backend/                 # Rust server
│   ├── src/
│   │   ├── main.rs         # Application entry point
│   │   ├── config.rs       # Configuration management
│   │   ├── capture.rs      # Screen capture logic
│   │   ├── compression.rs  # Frame compression
│   │   ├── websocket.rs    # WebSocket handling
│   │   ├── metrics.rs      # Performance metrics
│   │   └── error.rs        # Error definitions
│   ├── Cargo.toml          # Rust dependencies
│   └── config.toml         # Runtime configuration
├── frontend/               # TypeScript client
│   ├── src/
│   │   ├── main.ts         # Application entry point
│   │   ├── config/         # Configuration management
│   │   ├── stream/         # Streaming logic
│   │   ├── ui/             # UI components
│   │   ├── utils/          # Utilities
│   │   └── styles/         # CSS styles
│   ├── package.json        # Node.js dependencies
│   ├── vite.config.ts      # Vite configuration
│   └── tsconfig.json       # TypeScript configuration
└── README.md               # This file
```

## Quick Start

### 🐳 Docker (Recommended)
The easiest way to run RetroStream is using Docker:

```bash
# Build and run (one command)
./docker-run.sh

# Or step by step:
./docker-run.sh build
./docker-run.sh run
```

**Access the application:**
- 🌐 **Frontend**: http://localhost:3000
- 🖥️ **Backend**: http://localhost:8080
- 📊 **Metrics**: http://localhost:8080/metrics

### 🔧 Development with Docker
```bash
# Run in development mode with debug logging
./docker-run.sh dev
```

Access at:
- 🌐 **Frontend**: http://localhost:3001  
- 🖥️ **Backend**: http://localhost:8081

### 📋 Docker Commands
```bash
./docker-run.sh build    # Build the image
./docker-run.sh run      # Run production mode
./docker-run.sh dev      # Run development mode
./docker-run.sh logs     # View logs
./docker-run.sh stop     # Stop containers
./docker-run.sh clean    # Remove everything
./docker-run.sh shell    # Open container shell
```

### 🛠️ Native Installation (Alternative)

**Prerequisites:**
- Rust 1.70+ 
- Node.js 18+
- Modern web browser

**Backend Setup:**
```bash
cd backend
cargo run
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

**Production Build:**
```bash
# Backend
cd backend
cargo build --release

# Frontend
cd frontend
npm run build
npm run serve
```

## Configuration

### Backend Configuration (`backend/config.toml`)
```toml
[server]
host = "0.0.0.0"
port = 8080
max_connections = 10

[capture]
fps = 30
quality = 0.8

[compression]
level = 3
enabled = true

buffer_size = 10
```

### Command Line Options
```bash
# Custom port
cargo run -- --port 9090

# Custom FPS
cargo run -- --fps 60

# Custom compression level
cargo run -- --compression 6

# Custom config file
cargo run -- --config custom.toml
```

## API Endpoints

- `GET /stream` - WebSocket endpoint for frame streaming
- `GET /health` - Health check endpoint
- `GET /metrics` - Metrics endpoint (Prometheus format)

## Performance Tuning

### Backend Optimization
- Adjust `fps` for frame rate vs CPU usage balance
- Tune `compression.level` (0-22, higher = better compression, more CPU)
- Increase `buffer_size` for better buffering (more memory usage)
- Set `compression.enabled = false` for lowest latency

### Frontend Optimization
- Use "low" quality setting for better performance
- Reduce scale for better performance on slower devices
- Close other browser tabs to free up resources

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Common Issues

**Backend won't start**
- Check if port 8080 is available
- Verify screen capture permissions on macOS/Linux
- Run with `RUST_LOG=debug cargo run` for detailed logs

**Frontend connection issues**
- Verify backend is running on correct port
- Check browser console for WebSocket errors
- Ensure firewall allows connections

**Poor performance**
- Reduce FPS in backend configuration
- Lower quality setting in frontend
- Check CPU/memory usage
- Disable compression for testing

**Frame drops/stuttering**
- Increase buffer size in backend
- Check network latency
- Verify adequate bandwidth
- Monitor system resources

### Debug Logging

Backend:
```bash
RUST_LOG=debug cargo run
```

Frontend:
- Open browser developer tools
- Check console for detailed logs
- Monitor network tab for WebSocket traffic

## Development

### Backend Development
```bash
# Run with auto-reload
cargo watch -x run

# Run tests
cargo test

# Format code
cargo fmt

# Lint code
cargo clippy
```

### Frontend Development
```bash
# Development server with hot reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build
```

## Architecture

### Backend Architecture
- **Modular Design**: Each component has a single responsibility
- **Event-Driven**: Uses Tokio for async operations
- **Error Handling**: Comprehensive error types and recovery
- **Metrics**: Built-in performance monitoring
- **Configuration**: Flexible TOML-based configuration

### Frontend Architecture
- **Component-Based**: Modular UI components
- **Event-Driven**: EventEmitter pattern for communication
- **TypeScript**: Full type safety
- **Performance-Focused**: Efficient rendering and buffering
- **Responsive**: Mobile-friendly design

## Security Considerations

- WebSocket connections are not encrypted by default
- No authentication/authorization implemented
- Screen capture has full desktop access
- Consider running behind a reverse proxy with TLS
- Implement rate limiting for production use

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Roadmap

- [ ] WebRTC support for P2P streaming
- [ ] Audio capture and streaming
- [ ] Multi-monitor support
- [ ] Recording functionality
- [ ] User authentication
- [ ] Mobile app clients
- [ ] Hardware acceleration
- [ ] Adaptive bitrate streaming
