"""
Task Queue Configuration for Bard (django-q2)

Previously Celery — migrated to django-q2 for simpler deployment.
django-q2 uses PostgreSQL as the broker (no Redis needed).

Run the worker: python manage.py qcluster
"""
