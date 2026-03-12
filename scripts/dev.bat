@echo off
REM =========================
REM DEVELOPMENT STARTUP SCRIPT (Windows)
REM =========================

echo Starting Bardiq Journal - Development Mode
echo ===========================================

REM Check if .env exists
if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
)

REM Check if frontend\.env.local exists
if not exist frontend\.env.local (
    echo Creating frontend\.env.local from template...
    copy frontend\.env.local.example frontend\.env.local
)

echo.
echo Starting Docker containers...
docker compose -f docker-compose.yml -f docker-compose.dev.yml up %*
