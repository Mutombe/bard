"""
Gunicorn Configuration for Production

This configuration is optimized for Render's free tier with limited resources.
"""
import multiprocessing
import os

# Server Socket
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
backlog = 2048

# Worker Processes
# On Render free tier, use fewer workers to save memory
workers = int(os.environ.get("WEB_CONCURRENCY", 2))
worker_class = "sync"  # Use sync workers for stability
worker_connections = 1000
timeout = 120  # Increased timeout for slow database queries
keepalive = 5

# Memory Management - CRITICAL for preventing crashes
max_requests = 500  # Restart workers after 500 requests to prevent memory leaks
max_requests_jitter = 50  # Add randomness to prevent all workers restarting at once
graceful_timeout = 30

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"  # Log to stderr
loglevel = os.environ.get("LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process Naming
proc_name = "bardiq-api"

# Server Mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (handled by Render)
keyfile = None
certfile = None

# Hooks
def on_starting(server):
    """Called just before the master process is initialized."""
    pass

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    pass

def worker_int(worker):
    """Called when a worker receives SIGINT or SIGQUIT."""
    pass

def worker_abort(worker):
    """Called when a worker receives SIGABRT (critical)."""
    pass

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    pass

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    pass

def post_worker_init(worker):
    """Called just after a worker has initialized."""
    pass

def worker_exit(server, worker):
    """Called just after a worker has been exited."""
    # Close database connections on worker exit
    from django.db import connections
    for conn in connections.all():
        conn.close()

def nworkers_changed(server, new_value, old_value):
    """Called just after num_workers has been changed."""
    pass

def on_exit(server):
    """Called just before exiting Gunicorn."""
    pass
