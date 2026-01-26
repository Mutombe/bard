"""
Core Permissions

Role-based permission classes for the API.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Permission for admin-only actions.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ["super_admin", "admin"]
        )


class IsSuperAdmin(BasePermission):
    """
    Permission for super admin-only actions.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "super_admin"
        )


class IsEditor(BasePermission):
    """
    Permission for editors and above.

    Includes: super_admin, admin, editor
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ["super_admin", "admin", "editor"]
        )


class IsAnalyst(BasePermission):
    """
    Permission for analysts and above.

    Includes: super_admin, admin, editor, analyst
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ["super_admin", "admin", "editor", "analyst"]
        )


class IsSubscriber(BasePermission):
    """
    Permission for paid subscribers.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.subscription_tier in ["premium", "enterprise"]
        )


class IsPremiumSubscriber(BasePermission):
    """
    Permission for premium subscribers only.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.subscription_tier == "premium"
        )


class IsEnterpriseSubscriber(BasePermission):
    """
    Permission for enterprise subscribers only.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.subscription_tier == "enterprise"
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Permission for object owners or admins.

    Requires object to have 'user' or 'author' field.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in ["super_admin", "admin"]:
            return True

        # Check common ownership patterns
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "author"):
            return obj.author == request.user
        if hasattr(obj, "created_by"):
            return obj.created_by == request.user

        return False


class IsOwnerOrEditor(BasePermission):
    """
    Permission for object owners or editors.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in ["super_admin", "admin", "editor"]:
            return True

        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "author"):
            return obj.author == request.user
        if hasattr(obj, "created_by"):
            return obj.created_by == request.user

        return False


class ReadOnly(BasePermission):
    """
    Read-only permission.
    """

    def has_permission(self, request, view):
        return request.method in ["GET", "HEAD", "OPTIONS"]


class IsEmailVerified(BasePermission):
    """
    Requires email to be verified.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.email_verified
        )
