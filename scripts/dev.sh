#!/bin/bash
# =========================
# DEVELOPMENT STARTUP SCRIPT
# =========================

set -e

echo "Starting Bardiq Journal - Development Mode"
echo "==========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# Check if frontend/.env.local exists
if [ ! -f frontend/.env.local ]; then
    echo "Creating frontend/.env.local from template..."
    cp frontend/.env.local.example frontend/.env.local
fi

# Start development environment
echo ""
echo "Starting Docker containers..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up "$@"
