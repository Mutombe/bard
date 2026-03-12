# =========================
# BARDIQ JOURNAL - MAKEFILE
# =========================
# Easy commands for development and production

.PHONY: help dev prod stop logs shell migrate seed test lint clean

# Default target
help:
	@echo "Bardiq Journal - Available Commands"
	@echo "===================================="
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-build    - Rebuild and start development"
	@echo "  make stop         - Stop all containers"
	@echo "  make logs         - View container logs"
	@echo "  make shell        - Open Django shell"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Rebuild and start production"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run Django migrations"
	@echo "  make seed         - Seed database with sample data"
	@echo "  make dbshell      - Open database shell"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run all tests"
	@echo "  make test-backend - Run backend tests only"
	@echo "  make lint         - Run linters"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean        - Remove containers and volumes"
	@echo "  make setup        - Initial project setup"

# =========================
# Development Commands
# =========================

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

dev-build:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-detached:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# =========================
# Production Commands
# =========================

prod:
	docker compose up

prod-build:
	docker compose up --build

prod-detached:
	docker compose up -d

# =========================
# Stop and Cleanup
# =========================

stop:
	docker compose down

clean:
	docker compose down -v --remove-orphans
	docker system prune -f

# =========================
# Logs
# =========================

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-celery:
	docker compose logs -f celery_worker celery_beat

# =========================
# Shell Access
# =========================

shell:
	docker compose exec backend python manage.py shell_plus

shell-backend:
	docker compose exec backend /bin/sh

shell-frontend:
	docker compose exec frontend /bin/sh

dbshell:
	docker compose exec backend python manage.py dbshell

# =========================
# Database Commands
# =========================

migrate:
	docker compose exec backend python manage.py migrate

makemigrations:
	docker compose exec backend python manage.py makemigrations

seed:
	docker compose exec backend python manage.py seed_market_data --full
	docker compose exec backend python manage.py seed_sample_news

createsuperuser:
	docker compose exec backend python manage.py createsuperuser

# =========================
# Testing
# =========================

test:
	docker compose exec backend python manage.py test
	docker compose exec frontend npm test

test-backend:
	docker compose exec backend python manage.py test

test-frontend:
	docker compose exec frontend npm test

# =========================
# Linting
# =========================

lint:
	docker compose exec backend python -m flake8 .
	docker compose exec frontend npm run lint

lint-fix:
	docker compose exec backend python -m black .
	docker compose exec frontend npm run lint -- --fix

# =========================
# Initial Setup
# =========================

setup:
	@echo "Setting up Bardiq Journal..."
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env file"; fi
	@if [ ! -f frontend/.env.local ]; then cp frontend/.env.local.example frontend/.env.local && echo "Created frontend/.env.local"; fi
	docker compose -f docker-compose.yml -f docker-compose.dev.yml build
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db redis
	@echo "Waiting for database..."
	sleep 5
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	docker compose exec backend python manage.py migrate
	@echo ""
	@echo "Setup complete! Run 'make dev' to start development."
