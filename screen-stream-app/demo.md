# RetroStream Demo Guide

## Quick Demo

1. **Start the application:**
   ```bash
   ./run.sh
   ```

2. **Open your browser to:**
   - Frontend: http://localhost:3000
   - Backend health: http://localhost:8080/health

3. **You should see:**
   - Retro cyberpunk interface with green/cyan terminal styling
   - Live screen stream in the main canvas area
   - Connection status showing "CONNECTED" in green
   - Real-time FPS and latency counters
   - Control panel with quality and scale settings
   - System log at the bottom showing connection events

## Features to Test

### Basic Functionality
- ✅ Screen capture and streaming
- ✅ Real-time frame rendering
- ✅ WebSocket connection with auto-reconnect
- ✅ Performance metrics (FPS, latency)

### UI Features
- ✅ Quality settings (High/Medium/Low)
- ✅ Scale slider (25% to 200%)
- ✅ Fullscreen mode (F11 or button)
- ✅ Screenshot capture (Ctrl+S or button)
- ✅ Real-time system logs

### Responsive Design
- ✅ Desktop optimized layout
- ✅ Mobile-friendly responsive design
- ✅ Retro terminal aesthetic with animations

### Performance Features
- ✅ Frame buffering for smooth playback
- ✅ Compression for bandwidth efficiency
- ✅ Adaptive quality settings
- ✅ Connection health monitoring

## Keyboard Shortcuts

- **F11**: Toggle fullscreen
- **Ctrl+S**: Take screenshot
- **Esc**: Exit fullscreen (when in fullscreen)

## Troubleshooting

If you encounter issues:

1. **Backend not starting**: Check if port 8080 is available
2. **Permission errors**: On Linux/macOS, screen capture may require permissions
3. **Connection failed**: Verify firewall settings allow local connections
4. **Poor performance**: Try lowering quality setting or FPS in config

## Development Mode

For development with hot reload:
```bash
./run.sh dev
```

This enables:
- Debug logging in backend
- Hot reload in frontend
- Detailed error messages
- Performance profiling

## Architecture Highlights

### Backend (Rust)
- Modular design with clean separation
- High-performance screen capture
- Real-time compression with zstd
- Comprehensive error handling
- Metrics and monitoring

### Frontend (TypeScript)
- Modern TypeScript with strict typing
- Event-driven architecture
- Canvas-based rendering
- Smart frame buffering
- Retro cyberpunk UI design

The application demonstrates production-ready code quality with proper error handling, performance optimization, and beautiful user experience.
