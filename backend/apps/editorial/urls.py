"""
Editorial URLs
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "editorial"

router = DefaultRouter()
router.register(r"buckets", views.ContentBucketViewSet, basename="buckets")
router.register(r"revisions", views.ArticleRevisionViewSet, basename="revisions")
router.register(r"notes", views.EditorialNoteViewSet, basename="notes")
router.register(r"assignments", views.EditorialAssignmentViewSet, basename="assignments")
router.register(r"calendar", views.ContentCalendarViewSet, basename="calendar")
router.register(r"activity", views.EditorActivityViewSet, basename="activity")

urlpatterns = [
    path("dashboard/", views.EditorDashboardView.as_view(), name="dashboard"),
    path("bulk-action/", views.BulkActionView.as_view(), name="bulk-action"),
    path("", include(router.urls)),
]
