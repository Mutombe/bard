#!/usr/bin/env bash
# =========================
# BARDIQ JOURNAL - BUILD SCRIPT
# Render Build Command
# =========================

set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Running migrations..."
python manage.py migrate --no-input

echo "Build complete!"
