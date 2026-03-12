@echo off
REM =========================
REM LOCAL DEVELOPMENT (No Docker)
REM =========================
REM Run backend and frontend without Docker
REM Prerequisites: Python 3.12+, Node.js 20+, PostgreSQL, Redis

echo Bardiq Journal - Local Development
echo ===================================
echo.

REM Check prerequisites
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    exit /b 1
)

echo Starting services...
echo Note: Make sure PostgreSQL and Redis are running
echo.

REM Start backend in new window
echo Starting Django backend...
start "Bardiq Backend" cmd /k "cd backend && python manage.py runserver 8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo Starting Next.js frontend...
start "Bardiq Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================
echo Services started in separate windows:
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8000/api/docs/
echo ===================================
echo.
echo Press any key to exit this window (services will keep running)
pause >nul
