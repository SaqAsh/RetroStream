#!/bin/bash

# RetroStream - Quick Start Script

set -e

echo "🚀 Starting RetroStream Application"
echo "=================================="

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v cargo &> /dev/null; then
        echo "❌ Rust/Cargo not found. Please install Rust from https://rustup.rs/"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm not found. Please install npm"
        exit 1
    fi
    
    echo "✅ All requirements satisfied"
}

# Build backend
build_backend() {
    echo "🦀 Building Rust backend..."
    cd backend
    cargo build --release
    cd ..
    echo "✅ Backend built successfully"
}

# Setup frontend
setup_frontend() {
    echo "📦 Setting up frontend dependencies..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run build
    cd ..
    echo "✅ Frontend setup complete"
}

# Start services
start_services() {
    echo "🌟 Starting services..."
    
    # Start backend in background
    echo "🚀 Starting backend server..."
    cd backend
    cargo run --release &
    BACKEND_PID=$!
    cd ..
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    echo "🌐 Starting frontend server..."
    cd frontend
    npm run serve &
    FRONTEND_PID=$!
    cd ..
    
    echo ""
    echo "🎉 RetroStream is now running!"
    echo "================================"
    echo "🖥️  Backend:  http://localhost:8080"
    echo "🌐 Frontend: http://localhost:3000"
    echo "📊 Metrics:  http://localhost:8080/metrics"
    echo "❤️  Health:   http://localhost:8080/health"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for interrupt
    trap cleanup INT
    wait
}

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "✅ Backend stopped"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "✅ Frontend stopped"
    fi
    
    echo "👋 RetroStream stopped. Thanks for using!"
    exit 0
}

# Development mode
dev_mode() {
    echo "🔧 Starting in development mode..."
    
    # Start backend in debug mode
    echo "🦀 Starting backend (debug mode)..."
    cd backend
    RUST_LOG=debug cargo run &
    BACKEND_PID=$!
    cd ..
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend in dev mode
    echo "🌐 Starting frontend (dev mode)..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo ""
    echo "🔥 RetroStream DEV MODE is now running!"
    echo "======================================"
    echo "🖥️  Backend:  http://localhost:8080 (debug logs enabled)"
    echo "🌐 Frontend: http://localhost:3000 (hot reload enabled)"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for interrupt
    trap cleanup INT
    wait
}

# Main script logic
main() {
    case "${1:-}" in
        "dev"|"--dev"|"-d")
            check_requirements
            dev_mode
            ;;
        "build"|"--build"|"-b")
            check_requirements
            build_backend
            setup_frontend
            echo "✅ Build complete! Run './run.sh' to start the application."
            ;;
        "help"|"--help"|"-h")
            echo "RetroStream Quick Start Script"
            echo ""
            echo "Usage:"
            echo "  ./run.sh         - Build and run in production mode"
            echo "  ./run.sh dev     - Run in development mode"
            echo "  ./run.sh build   - Build only (no run)"
            echo "  ./run.sh help    - Show this help"
            echo ""
            echo "Environment Variables:"
            echo "  RUST_LOG=debug   - Enable debug logging for backend"
            echo "  PORT=8080        - Backend port (default: 8080)"
            echo ""
            ;;
        *)
            check_requirements
            build_backend
            setup_frontend
            start_services
            ;;
    esac
}

# Make sure we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the screen-stream-app directory"
    exit 1
fi

# Run main function with all arguments
main "$@"
