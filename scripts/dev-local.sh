#!/bin/bash
# =========================
# LOCAL DEVELOPMENT (No Docker)
# =========================
# Run backend and frontend without Docker
# Prerequisites: Python 3.12+, Node.js 20+, PostgreSQL, Redis

set -e

echo "Bardiq Journal - Local Development"
echo "==================================="
echo ""

# Check prerequisites
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python is not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    exit 1
fi

echo "Note: Make sure PostgreSQL and Redis are running"
echo ""

# Install dependencies if needed
cd "$(dirname "$0")/.."

if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
fi

echo "Installing backend dependencies..."
source backend/venv/bin/activate
pip install -r backend/requirements.txt -q

echo "Installing frontend dependencies..."
cd frontend
npm install -q
cd ..

echo ""
echo "Starting services..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting Django backend..."
source backend/venv/bin/activate
cd backend
python manage.py runserver 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Start frontend
echo "Starting Next.js frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "==================================="
echo "Services running:"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  API Docs: http://localhost:8000/api/docs/"
echo "==================================="
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait
