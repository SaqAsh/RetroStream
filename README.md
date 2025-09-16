# RetroStream - Real-Time Screen Streaming

A high-performance screen streaming application with a retro cyberpunk aesthetic, built with Rust backend and TypeScript frontend.

![RetroStream Screenshot](https://github.com/user-attachments/assets/7a57b672-85ce-4241-a311-f55d2f04a3c0)

## 🚀 Features

- **Real-time Screen Capture**: Live desktop streaming with 30+ FPS
- **Low Latency**: Sub-100ms latency with WebSocket connections
- **Retro UI**: Cyberpunk terminal-inspired interface
- **Adaptive Quality**: High/Medium/Low quality settings
- **Dynamic Scaling**: 25%-200% zoom with smooth controls
- **Cross-platform**: Windows, Linux, macOS support
- **Auto-reconnection**: Robust connection handling with exponential backoff

## 🛠️ Tech Stack

**Backend (Rust)**
- Tokio async runtime
- Axum web framework with WebSocket support
- xcap for screen capture
- Zstd compression for bandwidth optimization

**Frontend (TypeScript)**
- Vite build tool
- Canvas API for real-time rendering
- Custom retro CSS styling
- Responsive design

## 🏃‍♂️ Quick Start

```bash
# Clone and run
git clone <repository>
cd screen-stream-app
./run.sh

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

## 📋 Requirements

- Rust 1.70+
- Node.js 18+
- Modern web browser

## 🎮 Controls

- **F11**: Toggle fullscreen
- **Ctrl+S**: Take screenshot
- **Quality Selector**: Adjust streaming quality
- **Scale Slider**: Zoom in/out (25%-200%)

## 🐳 Docker Support

```bash
# Run with Docker
./docker-run.sh
```

Perfect for demos, development, and cloud deployments with virtual desktop support.

---

*Built with ❤️ using Rust and TypeScript*
