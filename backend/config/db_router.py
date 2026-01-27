"""
Database Router for Read/Write Splitting

Routes read operations to the replica database and write operations to the primary.
This improves performance for read-heavy workloads typical in financial data platforms.
"""

import random


class ReadReplicaRouter:
    """
    A router to control database operations for read/write splitting.

    - Writes always go to the 'default' database
    - Reads can be routed to 'replica' database
    - Migrations always use 'default'
    """

    # Models that should always read from primary (for consistency)
    PRIMARY_ONLY_MODELS = {
        'auth',
        'contenttypes',
        'sessions',
        'admin',
        'token_blacklist',
        'django_celery_beat',
        'django_celery_results',
    }

    # Apps that benefit most from read replica
    READ_REPLICA_APPS = {
        'markets',
        'news',
        'media',
        'geography',
        'columnists',
        'seo',
        'analytics',
    }

    def db_for_read(self, model, **hints):
        """
        Route read operations to replica for high-traffic models.
        """
        # Check if replica is configured
        from django.conf import settings
        if 'replica' not in settings.DATABASES:
            return 'default'

        # Always use primary for auth-related and session models
        if model._meta.app_label in self.PRIMARY_ONLY_MODELS:
            return 'default'

        # Use replica for read-heavy apps
        if model._meta.app_label in self.READ_REPLICA_APPS:
            return 'replica'

        # For other models, randomly distribute reads (load balancing)
        # 70% to replica, 30% to primary for eventual consistency
        if random.random() < 0.7:
            return 'replica'

        return 'default'

    def db_for_write(self, model, **hints):
        """
        All writes go to the primary database.
        """
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations between objects in the same database.
        """
        # Relations are allowed between any databases in our setup
        # since they're replicas of each other
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Only run migrations on the primary database.
        """
        return db == 'default'


class PrimaryOnlyRouter:
    """
    Simple router that always uses the primary database.
    Use this in development or when replica is not needed.
    """

    def db_for_read(self, model, **hints):
        return 'default'

    def db_for_write(self, model, **hints):
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return db == 'default'
