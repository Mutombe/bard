"""
User URLs
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "users"

router = DefaultRouter()
router.register(r"", views.UserViewSet, basename="users")
router.register(r"registration", views.UserRegistrationView, basename="registration")

urlpatterns = [
    path("", include(router.urls)),
]
