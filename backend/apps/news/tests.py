"""
Tests for the News app.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse

from .models import Category, Tag, NewsArticle

User = get_user_model()


class CategoryModelTests(TestCase):
    """Test cases for Category model."""

    def test_category_creation(self):
        """Test creating a category."""
        category = Category.objects.create(
            name="Markets",
            slug="markets",
            description="Market news and analysis"
        )
        self.assertEqual(category.name, "Markets")
        self.assertEqual(str(category), "Markets")


class NewsArticleModelTests(TestCase):
    """Test cases for NewsArticle model."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="author@example.com",
            password="testpass123"
        )
        self.category = Category.objects.create(
            name="Markets",
            slug="markets"
        )

    def test_article_creation(self):
        """Test creating an article."""
        article = NewsArticle.objects.create(
            title="Test Article",
            slug="test-article",
            content="This is test content.",
            excerpt="Test excerpt",
            author=self.user,
            category=self.category,
            status=NewsArticle.Status.PUBLISHED,
        )
        self.assertEqual(article.title, "Test Article")
        self.assertEqual(article.status, NewsArticle.Status.PUBLISHED)


class NewsAPITests(APITestCase):
    """API tests for news."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="author@example.com",
            password="testpass123"
        )
        self.category = Category.objects.create(
            name="Markets",
            slug="markets"
        )
        self.article = NewsArticle.objects.create(
            title="Test Article",
            slug="test-article",
            content="This is test content.",
            excerpt="Test excerpt",
            author=self.user,
            category=self.category,
            status=NewsArticle.Status.PUBLISHED,
        )

    def test_article_queryset(self):
        """Test querying published articles."""
        published = NewsArticle.objects.filter(status=NewsArticle.Status.PUBLISHED)
        self.assertEqual(published.count(), 1)
        self.assertEqual(published.first().title, "Test Article")
