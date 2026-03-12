#!/bin/bash
# =========================
# INITIAL SETUP SCRIPT
# =========================

set -e

echo "Bardiq Journal - Initial Setup"
echo "==============================="
echo ""

# Create environment files
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please edit .env with your configuration values."
else
    echo ".env already exists, skipping..."
fi

if [ ! -f frontend/.env.local ]; then
    echo "Creating frontend/.env.local from template..."
    cp frontend/.env.local.example frontend/.env.local
else
    echo "frontend/.env.local already exists, skipping..."
fi

echo ""
echo "Building Docker images..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml build

echo ""
echo "Starting database and Redis..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db redis

echo ""
echo "Waiting for database to be ready..."
sleep 10

echo ""
echo "Starting all services..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

echo ""
echo "Running database migrations..."
docker compose exec backend python manage.py migrate

echo ""
echo "==============================="
echo "Setup Complete!"
echo "==============================="
echo ""
echo "Services running at:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend:  http://localhost:8000"
echo "  - API Docs: http://localhost:8000/api/docs/"
echo ""
echo "Useful commands:"
echo "  make dev       - Start development mode"
echo "  make logs      - View logs"
echo "  make stop      - Stop all services"
echo "  make shell     - Open Django shell"
echo ""
echo "To create an admin user, run:"
echo "  make createsuperuser"
