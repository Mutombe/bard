"""
URL configuration for subscriptions app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "subscriptions"

router = DefaultRouter()
router.register(r"plans", views.SubscriptionPlanViewSet, basename="plan")
router.register(r"subscriptions", views.SubscriptionViewSet, basename="subscription")
router.register(r"payments", views.PaymentViewSet, basename="payment")
router.register(r"invoices", views.InvoiceViewSet, basename="invoice")
router.register(r"payment-methods", views.PaymentMethodViewSet, basename="payment-method")

# Admin routes
router.register(
    r"admin/subscriptions",
    views.AdminSubscriptionViewSet,
    basename="admin-subscription"
)

urlpatterns = [
    path("", include(router.urls)),

    # Checkout
    path("checkout/", views.CheckoutView.as_view(), name="checkout"),
    path("billing-portal/", views.BillingPortalView.as_view(), name="billing-portal"),

    # Coupon validation
    path("coupons/validate/", views.CouponValidateView.as_view(), name="coupon-validate"),

    # Webhooks
    path("webhooks/stripe/", views.StripeWebhookView.as_view(), name="stripe-webhook"),
    path("webhooks/paystack/", views.PaystackWebhookView.as_view(), name="paystack-webhook"),
]
