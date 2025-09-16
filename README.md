# RetroStream - Real-Time Screen Streaming

A high-performance screen streaming application with a retro cyberpunk aesthetic, built with Rust backend and TypeScript frontend.

![RetroStream Screenshot](https://github.com/user-attachments/assets/7a57b672-85ce-4241-a311-f55d2f04a3c0)

## How to Use

1. **Start the backend**
   ```bash
   nix-shell
   cargo run
   ```

2. **Start the frontend**
   ```bash
   nix-shell --run "cd frontend && bun install && bun run dev"
   ```

3. **Open in browser**
   - Go to http://localhost:3000
   - Your screen will be streamed live
   - Share the URL with others to let them view your screen

## Development

### Prerequisites
- Nix package manager (handles all dependencies automatically)
- Modern web browser

### Backend Development
```bash
nix-shell
cargo run                    # Run once
cargo watch -x run          # Auto-reload on changes
cargo build --release       # Optimized build
```

### Frontend Development
```bash
nix-shell
cd frontend
bun install                  # Install dependencies
bun run dev                  # Development server
```

### Tech Stack
- **Backend**: Rust, Tokio, Axum, WebSockets, xcap screen capture
- **Frontend**: TypeScript, Vite, Canvas API, WebSockets
