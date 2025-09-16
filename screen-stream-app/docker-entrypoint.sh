#!/bin/bash

# RetroStream Docker Entrypoint Script

set -e

echo "🐳 Starting RetroStream in Docker Container"
echo "==========================================="

# Set up virtual display for screen capture demo
setup_virtual_display() {
    echo "🖥️  Setting up virtual display..."
    
    # Start Xvfb (Virtual Framebuffer)
    Xvfb :99 -screen 0 ${RESOLUTION}x24 &
    XVFB_PID=$!
    
    # Wait for X server to start
    sleep 2
    
    # Start a simple desktop environment
    DISPLAY=:99 fluxbox &
    FLUXBOX_PID=$!
    
    # Create some demo content on the virtual screen
    DISPLAY=:99 xterm -geometry 80x24+100+100 -e "while true; do echo 'RetroStream Demo - $(date)'; sleep 1; done" &
    XTERM_PID=$!
    
    echo "✅ Virtual display ready at ${RESOLUTION}"
    
    # Store PIDs for cleanup
    echo $XVFB_PID > /tmp/xvfb.pid
    echo $FLUXBOX_PID > /tmp/fluxbox.pid  
    echo $XTERM_PID > /tmp/xterm.pid
}

# Start the backend service
start_backend() {
    echo "🦀 Starting Rust backend..."
    cd /app
    screen-stream-backend --config config.toml &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/backend.pid
    
    # Wait for backend to be ready
    echo "⏳ Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8080/health > /dev/null 2>&1; then
            echo "✅ Backend is ready!"
            break
        fi
        echo "   Attempt $i/30..."
        sleep 1
    done
}

# Start the frontend service
start_frontend() {
    echo "🌐 Starting frontend server..."
    cd /app/frontend
    serve -s . -l 3000 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/frontend.pid
    
    # Wait for frontend to be ready
    echo "⏳ Waiting for frontend to start..."
    for i in {1..15}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Frontend is ready!"
            break
        fi
        echo "   Attempt $i/15..."
        sleep 1
    done
}

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    # Kill all services
    [ -f /tmp/backend.pid ] && kill $(cat /tmp/backend.pid) 2>/dev/null || true
    [ -f /tmp/frontend.pid ] && kill $(cat /tmp/frontend.pid) 2>/dev/null || true
    [ -f /tmp/xterm.pid ] && kill $(cat /tmp/xterm.pid) 2>/dev/null || true
    [ -f /tmp/fluxbox.pid ] && kill $(cat /tmp/fluxbox.pid) 2>/dev/null || true
    [ -f /tmp/xvfb.pid ] && kill $(cat /tmp/xvfb.pid) 2>/dev/null || true
    
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Main execution
main() {
    # Setup virtual display for demo
    setup_virtual_display
    
    # Start services
    start_backend
    start_frontend
    
    echo ""
    echo "🎉 RetroStream is running in Docker!"
    echo "===================================="
    echo "🖥️  Backend:  http://localhost:8080"
    echo "🌐 Frontend: http://localhost:3000"  
    echo "📊 Metrics:  http://localhost:8080/metrics"
    echo "❤️  Health:   http://localhost:8080/health"
    echo ""
    echo "🐳 Container ready! The virtual display shows a demo terminal."
    echo "📺 Connect to see the live screen stream with retro styling!"
    echo ""
    echo "Press Ctrl+C to stop the container"
    
    # Keep the container running
    wait
}

# Check if we're running in development mode
if [ "$1" = "dev" ]; then
    echo "🔧 Development mode enabled"
    export RUST_LOG=debug
fi

# Run main function
main
