"""
Authentication URLs

JWT-based authentication endpoints.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from . import views

app_name = "auth"

urlpatterns = [
    # JWT Token endpoints
    path("token/", views.CustomTokenObtainPairView.as_view(), name="token-obtain"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token-verify"),
    path("logout/", views.LogoutView.as_view(), name="logout"),

    # Password management
    path("password/change/", views.ChangePasswordView.as_view(), name="password-change"),
    path("password/reset/", views.PasswordResetRequestView.as_view(), name="password-reset"),
    path("password/reset/confirm/", views.PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]
