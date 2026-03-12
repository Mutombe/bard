@echo off
REM =========================
REM PRODUCTION STARTUP SCRIPT (Windows)
REM =========================

echo Starting Bardiq Journal - Production Mode
echo ==========================================

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env from .env.example and configure production values.
    exit /b 1
)

echo.
echo Starting Docker containers...
docker compose up %*
