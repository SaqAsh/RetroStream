#!/bin/bash

# RetroStream Docker Runner Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_banner() {
    echo -e "${GREEN}"
    echo "🐳 RetroStream Docker Runner"
    echo "============================"
    echo -e "${NC}"
}

print_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     - Build the Docker image"
    echo "  run       - Run the application (production mode)"
    echo "  dev       - Run in development mode"
    echo "  stop      - Stop all running containers"
    echo "  clean     - Remove containers and images"
    echo "  logs      - Show container logs"
    echo "  shell     - Open shell in running container"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build && $0 run    # Build and run"
    echo "  $0 dev                # Development mode"
    echo "  $0 logs -f            # Follow logs"
}

build_image() {
    echo -e "${BLUE}🔨 Building RetroStream Docker image...${NC}"
    docker build -t retrostream:latest .
    echo -e "${GREEN}✅ Build complete!${NC}"
}

run_production() {
    echo -e "${BLUE}🚀 Starting RetroStream (Production Mode)...${NC}"
    docker-compose up -d retrostream
    
    echo -e "${GREEN}"
    echo "🎉 RetroStream is now running!"
    echo "=============================="
    echo "🌐 Frontend: http://localhost:3000"
    echo "🖥️  Backend:  http://localhost:8080"
    echo "📊 Metrics:  http://localhost:8080/metrics"
    echo "❤️  Health:   http://localhost:8080/health"
    echo ""
    echo "View logs: $0 logs"
    echo "Stop:      $0 stop"
    echo -e "${NC}"
}

run_development() {
    echo -e "${BLUE}🔧 Starting RetroStream (Development Mode)...${NC}"
    docker-compose --profile dev up -d retrostream-dev
    
    echo -e "${GREEN}"
    echo "🔥 RetroStream DEV is now running!"
    echo "=================================="
    echo "🌐 Frontend: http://localhost:3001"
    echo "🖥️  Backend:  http://localhost:8081"
    echo "📊 Metrics:  http://localhost:8081/metrics"
    echo ""
    echo "Debug logs enabled"
    echo "View logs: $0 logs dev"
    echo "Stop:      $0 stop"
    echo -e "${NC}"
}

stop_containers() {
    echo -e "${YELLOW}🛑 Stopping RetroStream containers...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ All containers stopped${NC}"
}

clean_up() {
    echo -e "${YELLOW}🧹 Cleaning up containers and images...${NC}"
    docker-compose down --rmi all --volumes --remove-orphans
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

show_logs() {
    if [ "$2" = "dev" ]; then
        echo -e "${BLUE}📋 Showing development logs...${NC}"
        docker-compose logs "${@:3}" retrostream-dev
    else
        echo -e "${BLUE}📋 Showing production logs...${NC}"
        docker-compose logs "${@:2}" retrostream
    fi
}

open_shell() {
    local container_name="retrostream-app"
    if [ "$2" = "dev" ]; then
        container_name="retrostream-dev"
    fi
    
    echo -e "${BLUE}🐚 Opening shell in $container_name...${NC}"
    docker exec -it "$container_name" /bin/bash
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
        exit 1
    fi
}

main() {
    print_banner
    check_docker
    
    case "${1:-}" in
        "build"|"b")
            build_image
            ;;
        "run"|"r")
            run_production
            ;;
        "dev"|"d")
            run_development
            ;;
        "stop"|"s")
            stop_containers
            ;;
        "clean"|"c")
            clean_up
            ;;
        "logs"|"l")
            show_logs "$@"
            ;;
        "shell"|"sh")
            open_shell "$@"
            ;;
        "help"|"h"|"--help"|"-h")
            print_help
            ;;
        "")
            echo -e "${YELLOW}No command specified. Building and running...${NC}"
            build_image
            run_production
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $1${NC}"
            print_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
