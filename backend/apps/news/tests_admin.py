"""
Admin CMS End-to-End Tests for Article CRUD operations.
"""
import json
from io import BytesIO
from PIL import Image as PILImage
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Category, Tag, NewsArticle

User = get_user_model()


class ArticleCRUDTests(APITestCase):
    """End-to-end tests for article CRUD operations."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()

        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@bardiq.co.zw",
            password="TestAdmin123!",
            first_name="Admin",
            last_name="User",
            role="super_admin",
        )

        # Create regular user
        self.regular_user = User.objects.create_user(
            email="user@example.com",
            password="TestUser123!",
            first_name="Regular",
            last_name="User",
        )

        # Create categories
        self.category_markets = Category.objects.create(
            name="Markets",
            slug="markets",
            description="Market news",
            is_active=True,
        )
        self.category_opinion = Category.objects.create(
            name="Opinion",
            slug="opinion",
            description="Opinion pieces",
            is_active=True,
        )

        # Create tags
        self.tag_jse = Tag.objects.create(name="JSE", slug="jse")
        self.tag_sa = Tag.objects.create(name="South Africa", slug="south-africa")

    def _get_auth_token(self, email, password):
        """Helper to get authentication token."""
        response = self.client.post("/api/v1/auth/login/", {
            "email": email,
            "password": password,
        })
        if response.status_code == 200:
            return response.data.get("access")
        return None

    def _auth_client(self, user_email, password):
        """Helper to authenticate client."""
        token = self._get_auth_token(user_email, password)
        if token:
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return token

    # ===========================
    # CREATE Article Tests
    # ===========================

    def test_create_article_authenticated(self):
        """Test creating an article when authenticated as admin."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        article_data = {
            "title": "Test Article Title",
            "subtitle": "Test subtitle",
            "excerpt": "This is a test excerpt for the article.",
            "content": "# Test Content\n\nThis is the main article content with **bold** text.",
            "category": "markets",
            "content_type": "news",
            "tags": ["jse", "south-africa"],
            "status": "draft",
            "is_featured": False,
            "is_breaking": False,
            "is_premium": False,
        }

        response = self.client.post(
            "/api/v1/news/articles/",
            data=json.dumps(article_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Test Article Title")
        self.assertEqual(response.data["category"], "markets")
        self.assertIn("jse", response.data["tags"])

        # Verify article exists in database
        article = NewsArticle.objects.get(title="Test Article Title")
        self.assertEqual(article.author, self.admin_user)
        self.assertEqual(article.category, self.category_markets)

    def test_create_article_unauthenticated(self):
        """Test that unauthenticated users cannot create articles."""
        article_data = {
            "title": "Test Article",
            "content": "Content",
            "category": "markets",
        }

        response = self.client.post(
            "/api/v1/news/articles/",
            data=article_data,
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_article_creates_new_tags(self):
        """Test that creating article with new tag slugs auto-creates tags."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        article_data = {
            "title": "Article with New Tags",
            "content": "Content here",
            "category": "markets",
            "tags": ["new-tag-one", "new-tag-two"],
            "status": "draft",
        }

        response = self.client.post(
            "/api/v1/news/articles/",
            data=json.dumps(article_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify new tags were created
        self.assertTrue(Tag.objects.filter(slug="new-tag-one").exists())
        self.assertTrue(Tag.objects.filter(slug="new-tag-two").exists())

    def test_create_article_publish(self):
        """Test creating and immediately publishing an article."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        article_data = {
            "title": "Published Article",
            "excerpt": "This article should be published.",
            "content": "Published content.",
            "category": "markets",
            "status": "published",
        }

        response = self.client.post(
            "/api/v1/news/articles/",
            data=json.dumps(article_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        article = NewsArticle.objects.get(title="Published Article")
        self.assertEqual(article.status, "published")
        self.assertIsNotNone(article.published_at)

    def test_create_opinion_article(self):
        """Test creating an opinion article."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        article_data = {
            "title": "My Opinion Piece",
            "excerpt": "An opinion on current events.",
            "content": "This is my opinion...",
            "category": "opinion",
            "content_type": "opinion",
            "status": "draft",
        }

        response = self.client.post(
            "/api/v1/news/articles/",
            data=json.dumps(article_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["content_type"], "opinion")

    # ===========================
    # READ Article Tests
    # ===========================

    def test_list_articles(self):
        """Test listing articles."""
        # Create some articles
        NewsArticle.objects.create(
            title="Article 1",
            slug="article-1",
            content="Content 1",
            author=self.admin_user,
            category=self.category_markets,
            status="published",
        )
        NewsArticle.objects.create(
            title="Article 2",
            slug="article-2",
            content="Content 2",
            author=self.admin_user,
            category=self.category_markets,
            status="published",
        )

        response = self.client.get("/api/v1/news/articles/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 2)

    def test_get_article_detail(self):
        """Test getting article details."""
        article = NewsArticle.objects.create(
            title="Detail Test Article",
            slug="detail-test-article",
            content="Full content here",
            excerpt="Excerpt",
            author=self.admin_user,
            category=self.category_markets,
            status="published",
        )

        response = self.client.get(f"/api/v1/news/articles/{article.slug}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Detail Test Article")
        self.assertEqual(response.data["content"], "Full content here")

    def test_filter_articles_by_category(self):
        """Test filtering articles by category."""
        NewsArticle.objects.create(
            title="Markets Article",
            slug="markets-article",
            content="Content",
            author=self.admin_user,
            category=self.category_markets,
            status="published",
        )
        NewsArticle.objects.create(
            title="Opinion Article",
            slug="opinion-article",
            content="Content",
            author=self.admin_user,
            category=self.category_opinion,
            status="published",
        )

        response = self.client.get("/api/v1/news/articles/", {"category": "markets"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for article in response.data["results"]:
            self.assertEqual(article["category"]["slug"], "markets")

    def test_filter_articles_by_status(self):
        """Test filtering articles by status (admin only)."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        NewsArticle.objects.create(
            title="Draft Article",
            slug="draft-article",
            content="Content",
            author=self.admin_user,
            category=self.category_markets,
            status="draft",
        )
        NewsArticle.objects.create(
            title="Published Article",
            slug="published-article",
            content="Content",
            author=self.admin_user,
            category=self.category_markets,
            status="published",
        )

        response = self.client.get("/api/v1/news/articles/", {"status": "draft"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_articles(self):
        """Test searching articles."""
        NewsArticle.objects.create(
            title="JSE Hits Record High",
            slug="jse-record-high",
            content="The JSE reached new highs today.",
            author=self.admin_user,
            category=self.category_markets,
            status="published",
        )

        response = self.client.get("/api/v1/news/articles/", {"search": "JSE"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)

    # ===========================
    # UPDATE Article Tests
    # ===========================

    def test_update_article(self):
        """Test updating an article."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        article = NewsArticle.objects.create(
            title="Original Title",
            slug="original-title",
            content="Original content",
            author=self.admin_user,
            category=self.category_markets,
            status="draft",
        )

        update_data = {
            "title": "Updated Title",
            "content": "Updated content with more details.",
            "category": "markets",
            "status": "draft",
        }

        response = self.client.put(
            f"/api/v1/news/articles/{article.slug}/",
            data=json.dumps(update_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        article.refresh_from_db()
        self.assertEqual(article.title, "Updated Title")
        self.assertEqual(article.content, "Updated content with more details.")

    def test_partial_update_article(self):
        """Test partial update (PATCH) of an article."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        article = NewsArticle.objects.create(
            title="Patch Test",
            slug="patch-test",
            content="Original",
            author=self.admin_user,
            category=self.category_markets,
            status="draft",
        )

        response = self.client.patch(
            f"/api/v1/news/articles/{article.slug}/",
            data={"is_featured": True},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        article.refresh_from_db()
        self.assertTrue(article.is_featured)

    def test_publish_article(self):
        """Test publishing a draft article."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        article = NewsArticle.objects.create(
            title="Draft to Publish",
            slug="draft-to-publish",
            content="Content",
            author=self.admin_user,
            category=self.category_markets,
            status="draft",
        )

        response = self.client.patch(
            f"/api/v1/news/articles/{article.slug}/",
            data={"status": "published"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        article.refresh_from_db()
        self.assertEqual(article.status, "published")

    def test_update_article_tags(self):
        """Test updating article tags."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        article = NewsArticle.objects.create(
            title="Tag Update Test",
            slug="tag-update-test",
            content="Content",
            author=self.admin_user,
            category=self.category_markets,
            status="draft",
        )
        article.tags.add(self.tag_jse)

        response = self.client.patch(
            f"/api/v1/news/articles/{article.slug}/",
            data=json.dumps({"tags": ["south-africa", "new-tag"]}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        article.refresh_from_db()
        tag_slugs = list(article.tags.values_list("slug", flat=True))
        self.assertIn("south-africa", tag_slugs)
        self.assertIn("new-tag", tag_slugs)
        self.assertNotIn("jse", tag_slugs)

    # ===========================
    # DELETE Article Tests
    # ===========================

    def test_delete_article(self):
        """Test deleting an article."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        article = NewsArticle.objects.create(
            title="To Delete",
            slug="to-delete",
            content="Content",
            author=self.admin_user,
            category=self.category_markets,
            status="draft",
        )

        response = self.client.delete(f"/api/v1/news/articles/{article.slug}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(NewsArticle.objects.filter(slug="to-delete").exists())

    def test_delete_article_unauthorized(self):
        """Test that unauthorized users cannot delete articles."""
        article = NewsArticle.objects.create(
            title="Protected Article",
            slug="protected-article",
            content="Content",
            author=self.admin_user,
            category=self.category_markets,
            status="draft",
        )

        response = self.client.delete(f"/api/v1/news/articles/{article.slug}/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(NewsArticle.objects.filter(slug="protected-article").exists())

    # ===========================
    # Validation Tests
    # ===========================

    def test_create_article_missing_title(self):
        """Test that title is required."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        response = self.client.post(
            "/api/v1/news/articles/",
            data={"content": "Content", "category": "markets"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_article_missing_category(self):
        """Test that category is required."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        response = self.client.post(
            "/api/v1/news/articles/",
            data={"title": "Title", "content": "Content"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_article_invalid_category(self):
        """Test creating article with invalid category."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        response = self.client.post(
            "/api/v1/news/articles/",
            data=json.dumps({
                "title": "Title",
                "content": "Content",
                "category": "nonexistent-category",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CategoryAPITests(APITestCase):
    """Tests for category API."""

    def setUp(self):
        self.client = APIClient()
        Category.objects.create(name="Markets", slug="markets", is_active=True)
        Category.objects.create(name="Opinion", slug="opinion", is_active=True)
        Category.objects.create(name="Inactive", slug="inactive", is_active=False)

    def test_list_categories(self):
        """Test listing active categories."""
        response = self.client.get("/api/v1/news/categories/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only show active categories
        active_cats = [c for c in response.data if c["is_active"]]
        self.assertGreaterEqual(len(active_cats), 2)


class TagAPITests(APITestCase):
    """Tests for tag API."""

    def setUp(self):
        self.client = APIClient()
        Tag.objects.create(name="JSE", slug="jse")
        Tag.objects.create(name="Markets", slug="markets")

    def test_list_tags(self):
        """Test listing tags."""
        response = self.client.get("/api/v1/news/tags/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
