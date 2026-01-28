"""
Media Library End-to-End Tests.
"""
import json
from io import BytesIO
from PIL import Image as PILImage
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import MediaFile

User = get_user_model()


def create_test_image(name="test.jpg", size=(100, 100), format="JPEG"):
    """Create a test image file."""
    file = BytesIO()
    image = PILImage.new("RGB", size, color="red")
    image.save(file, format=format)
    file.seek(0)
    return SimpleUploadedFile(
        name=name,
        content=file.read(),
        content_type=f"image/{format.lower()}"
    )


def create_test_pdf(name="test.pdf"):
    """Create a test PDF file."""
    content = b"%PDF-1.4 test content"
    return SimpleUploadedFile(
        name=name,
        content=content,
        content_type="application/pdf"
    )


@override_settings(MEDIA_ROOT="/tmp/test_media/")
class MediaLibraryTests(APITestCase):
    """End-to-end tests for media library operations."""

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
    # UPLOAD Tests
    # ===========================

    def test_upload_image(self):
        """Test uploading an image file."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        image = create_test_image("test_upload.jpg")

        response = self.client.post(
            "/api/v1/media/library/",
            data={
                "file": image,
                "alt_text": "Test image",
                "caption": "A test image caption",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["file_type"], "image")
        self.assertEqual(response.data["alt_text"], "Test image")
        self.assertIn("url", response.data)

        # Verify file exists in database
        self.assertTrue(MediaFile.objects.filter(id=response.data["id"]).exists())

    def test_upload_document(self):
        """Test uploading a document (PDF)."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        pdf = create_test_pdf("report.pdf")

        response = self.client.post(
            "/api/v1/media/library/",
            data={"file": pdf},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["file_type"], "document")

    def test_upload_unauthenticated(self):
        """Test that unauthenticated users cannot upload."""
        image = create_test_image()

        response = self.client.post(
            "/api/v1/media/library/",
            data={"file": image},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upload_sets_user(self):
        """Test that uploaded file is associated with the uploader."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        image = create_test_image()

        response = self.client.post(
            "/api/v1/media/library/",
            data={"file": image},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        media_file = MediaFile.objects.get(id=response.data["id"])
        self.assertEqual(media_file.uploaded_by, self.admin_user)

    # ===========================
    # LIST Tests
    # ===========================

    def test_list_files(self):
        """Test listing media files."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        # Create some files
        MediaFile.objects.create(
            name="file1.jpg",
            file_type="image",
            size=1000,
            uploaded_by=self.admin_user,
        )
        MediaFile.objects.create(
            name="file2.pdf",
            file_type="document",
            size=2000,
            uploaded_by=self.admin_user,
        )

        response = self.client.get("/api/v1/media/library/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 2)

    def test_filter_by_file_type(self):
        """Test filtering files by type."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        MediaFile.objects.create(
            name="image.jpg",
            file_type="image",
            size=1000,
            uploaded_by=self.admin_user,
        )
        MediaFile.objects.create(
            name="doc.pdf",
            file_type="document",
            size=2000,
            uploaded_by=self.admin_user,
        )

        response = self.client.get("/api/v1/media/library/", {"file_type": "image"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data["results"]:
            self.assertEqual(item["file_type"], "image")

    def test_search_files(self):
        """Test searching files by name."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        MediaFile.objects.create(
            name="annual_report_2024.pdf",
            file_type="document",
            size=1000,
            uploaded_by=self.admin_user,
        )
        MediaFile.objects.create(
            name="logo.png",
            file_type="image",
            size=500,
            uploaded_by=self.admin_user,
        )

        response = self.client.get("/api/v1/media/library/", {"search": "annual"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)
        self.assertIn("annual", response.data["results"][0]["name"].lower())

    # ===========================
    # DELETE Tests
    # ===========================

    def test_delete_file(self):
        """Test deleting a single file."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        media_file = MediaFile.objects.create(
            name="to_delete.jpg",
            file_type="image",
            size=1000,
            uploaded_by=self.admin_user,
        )

        response = self.client.delete(f"/api/v1/media/library/{media_file.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(MediaFile.objects.filter(id=media_file.id).exists())

    def test_delete_unauthenticated(self):
        """Test that unauthenticated users cannot delete files."""
        media_file = MediaFile.objects.create(
            name="protected.jpg",
            file_type="image",
            size=1000,
            uploaded_by=self.admin_user,
        )

        response = self.client.delete(f"/api/v1/media/library/{media_file.id}/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(MediaFile.objects.filter(id=media_file.id).exists())

    def test_bulk_delete(self):
        """Test bulk deleting multiple files."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        file1 = MediaFile.objects.create(
            name="bulk1.jpg",
            file_type="image",
            size=1000,
            uploaded_by=self.admin_user,
        )
        file2 = MediaFile.objects.create(
            name="bulk2.jpg",
            file_type="image",
            size=1000,
            uploaded_by=self.admin_user,
        )
        file3 = MediaFile.objects.create(
            name="keep.jpg",
            file_type="image",
            size=1000,
            uploaded_by=self.admin_user,
        )

        response = self.client.post(
            "/api/v1/media/library/bulk_delete/",
            data=json.dumps({"ids": [file1.id, file2.id]}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["deleted_count"], 2)

        # Verify correct files were deleted
        self.assertFalse(MediaFile.objects.filter(id=file1.id).exists())
        self.assertFalse(MediaFile.objects.filter(id=file2.id).exists())
        self.assertTrue(MediaFile.objects.filter(id=file3.id).exists())

    def test_bulk_delete_empty_ids(self):
        """Test bulk delete with empty IDs list."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        response = self.client.post(
            "/api/v1/media/library/bulk_delete/",
            data=json.dumps({"ids": []}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ===========================
    # STATS Tests
    # ===========================

    def test_get_stats(self):
        """Test getting library statistics."""
        self._auth_client("admin@bardiq.co.zw", "TestAdmin123!")

        # Create files of different types
        MediaFile.objects.create(
            name="img1.jpg",
            file_type="image",
            size=1000,
            uploaded_by=self.admin_user,
        )
        MediaFile.objects.create(
            name="img2.png",
            file_type="image",
            size=2000,
            uploaded_by=self.admin_user,
        )
        MediaFile.objects.create(
            name="doc.pdf",
            file_type="document",
            size=5000,
            uploaded_by=self.admin_user,
        )

        response = self.client.get("/api/v1/media/library/stats/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_files"], 3)
        self.assertEqual(response.data["total_size"], 8000)
        self.assertEqual(response.data["by_type"]["image"], 2)
        self.assertEqual(response.data["by_type"]["document"], 1)

    # ===========================
    # MediaFile Model Tests
    # ===========================


class MediaFileModelTests(TestCase):
    """Tests for MediaFile model."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
        )

    def test_size_display_bytes(self):
        """Test size display for bytes."""
        media_file = MediaFile(name="test.txt", size=500)
        self.assertEqual(media_file.size_display, "500.0 B")

    def test_size_display_kilobytes(self):
        """Test size display for kilobytes."""
        media_file = MediaFile(name="test.txt", size=2048)
        self.assertEqual(media_file.size_display, "2.0 KB")

    def test_size_display_megabytes(self):
        """Test size display for megabytes."""
        media_file = MediaFile(name="test.txt", size=2 * 1024 * 1024)
        self.assertEqual(media_file.size_display, "2.0 MB")

    def test_dimensions(self):
        """Test dimensions property for images."""
        media_file = MediaFile(name="test.jpg", width=800, height=600)
        self.assertEqual(media_file.dimensions, "800x600")

    def test_dimensions_none_when_no_dimensions(self):
        """Test dimensions returns None for non-images."""
        media_file = MediaFile(name="test.pdf")
        self.assertIsNone(media_file.dimensions)

    def test_str_representation(self):
        """Test string representation."""
        media_file = MediaFile(name="example.jpg")
        self.assertEqual(str(media_file), "example.jpg")
