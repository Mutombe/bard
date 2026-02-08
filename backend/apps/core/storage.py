"""
Custom storage backends for DigitalOcean Spaces (S3-compatible).
"""
from storages.backends.s3boto3 import S3Boto3Storage


class StaticStorage(S3Boto3Storage):
    """Storage backend for static files."""
    location = "static"
    default_acl = "public-read"
    file_overwrite = True


class MediaStorage(S3Boto3Storage):
    """Storage backend for media files (user uploads, article images, etc.)."""
    location = "media"
    default_acl = "public-read"
    file_overwrite = False


class PrivateMediaStorage(S3Boto3Storage):
    """Storage backend for private media files."""
    location = "private"
    default_acl = "private"
    file_overwrite = False
    custom_domain = False  # Use signed URLs for private files
