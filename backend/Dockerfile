# =========================
# BARDIQ JOURNAL BACKEND DOCKERFILE
# Multi-stage build for production
# =========================

FROM python:3.12-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# =========================
# Production Stage
# =========================
FROM python:3.12-slim

WORKDIR /app

# Create non-root user for security
RUN groupadd -r bardiq && useradd -r -g bardiq bardiq

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache /wheels/*

# Copy application code
COPY . .

# Create directories and set permissions
RUN mkdir -p staticfiles media logs && \
    touch logs/bard.log && \
    chown -R bardiq:bardiq /app && \
    chmod -R 755 /app/logs

# Switch to non-root user
USER bardiq

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

# Run migrations, collect static, and start server
CMD python manage.py collectstatic --no-input && python manage.py migrate --no-input && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --threads 4
