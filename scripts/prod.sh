#!/bin/bash
# =========================
# PRODUCTION STARTUP SCRIPT
# =========================

set -e

echo "Starting Bardiq Journal - Production Mode"
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please create .env from .env.example and configure production values."
    exit 1
fi

# Validate required environment variables
required_vars=("DJANGO_SECRET_KEY" "POSTGRES_PASSWORD")
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        echo "ERROR: ${var} is not set in .env"
        exit 1
    fi
done

# Start production environment
echo ""
echo "Starting Docker containers..."
docker compose up "$@"
