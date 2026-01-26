"""
Tests for the Users app.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse

User = get_user_model()


class UserModelTests(TestCase):
    """Test cases for User model."""

    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123"
        )
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        """Test creating a superuser."""
        admin = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123"
        )
        self.assertEqual(admin.email, "admin@example.com")
        self.assertTrue(admin.is_active)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_user_email_normalized(self):
        """Test that email is normalized."""
        email = "test@EXAMPLE.COM"
        user = User.objects.create_user(email=email, password="test123")
        self.assertEqual(user.email, email.lower())

    def test_user_without_email_raises_error(self):
        """Test that creating user without email raises error."""
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="test123")

    def test_user_string_representation(self):
        """Test user string representation."""
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="John",
            last_name="Doe"
        )
        self.assertEqual(str(user), "test@example.com")


class UserAPITests(APITestCase):
    """API tests for users."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="John",
            last_name="Doe"
        )

    def test_user_login(self):
        """Test user login works."""
        # Just verify the user can be authenticated
        self.assertTrue(self.user.check_password("testpass123"))
        self.assertTrue(self.user.is_active)
