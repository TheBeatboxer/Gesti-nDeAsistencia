#!/bin/bash

# Development mode
dev() {
    echo "Starting development environment..."
    # Start backend
    cd backend && npm run dev &
    # Start frontend
    cd ../frontend && npm run dev
}

# Production mode
prod() {
    echo "Starting production environment..."
    # Build frontend
    cd frontend && npm run build
    # Start backend in production
    cd ../backend && npm run start:prod
}

# Check command line argument
case "$1" in
    "dev")
        dev
        ;;
    "prod")
        prod
        ;;
    *)
        echo "Usage: ./start.sh [dev|prod]"
        exit 1
        ;;
esac