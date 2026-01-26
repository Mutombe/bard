"""
Tests for the Subscriptions app.
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse

from .models import (
    SubscriptionPlan,
    Subscription,
    Payment,
    Invoice,
    Coupon,
    PaymentMethod,
)

User = get_user_model()


class SubscriptionPlanModelTests(TestCase):
    """Test cases for SubscriptionPlan model."""

    def setUp(self):
        self.free_plan = SubscriptionPlan.objects.create(
            name="Free",
            slug="free",
            plan_type=SubscriptionPlan.PlanType.FREE,
            price_usd=0,
            price_zar=0,
            price_ngn=0,
            billing_cycle=SubscriptionPlan.BillingCycle.MONTHLY,
            article_limit=10,
            api_calls_limit=100,
        )
        self.premium_plan = SubscriptionPlan.objects.create(
            name="Premium",
            slug="premium",
            plan_type=SubscriptionPlan.PlanType.PREMIUM,
            price_usd=1999,  # $19.99
            price_zar=34999,  # R349.99
            price_ngn=1500000,  # ₦15,000
            billing_cycle=SubscriptionPlan.BillingCycle.MONTHLY,
            article_limit=0,  # Unlimited
            api_calls_limit=1000,
            is_featured=True,
        )

    def test_plan_creation(self):
        """Test subscription plan creation."""
        self.assertEqual(self.free_plan.name, "Free")
        self.assertEqual(self.premium_plan.price_usd, 1999)

    def test_price_display(self):
        """Test price display formatting."""
        self.assertEqual(self.premium_plan.get_price_display("usd"), "$19.99")
        self.assertEqual(self.premium_plan.get_price_display("zar"), "R349.99")
        self.assertEqual(self.premium_plan.get_price_display("ngn"), "₦15000.00")

    def test_has_unlimited_articles(self):
        """Test unlimited articles check."""
        self.assertFalse(self.free_plan.has_unlimited_articles)
        self.assertTrue(self.premium_plan.has_unlimited_articles)

    def test_has_api_access(self):
        """Test API access check."""
        self.assertTrue(self.free_plan.has_api_access)
        self.assertTrue(self.premium_plan.has_api_access)


class SubscriptionModelTests(TestCase):
    """Test cases for Subscription model."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123"
        )
        self.plan = SubscriptionPlan.objects.create(
            name="Premium",
            slug="premium",
            plan_type=SubscriptionPlan.PlanType.PREMIUM,
            price_usd=1999,
            billing_cycle=SubscriptionPlan.BillingCycle.MONTHLY,
            article_limit=100,
            api_calls_limit=1000,
        )
        self.subscription = Subscription.objects.create(
            user=self.user,
            plan=self.plan,
            status=Subscription.Status.ACTIVE,
        )

    def test_subscription_creation(self):
        """Test subscription creation."""
        self.assertEqual(self.subscription.user, self.user)
        self.assertEqual(self.subscription.plan, self.plan)
        self.assertTrue(self.subscription.is_active)

    def test_can_read_premium_article(self):
        """Test premium article access."""
        self.assertTrue(self.subscription.can_read_premium_article())

        # Simulate reading articles
        self.subscription.articles_read_this_period = 99
        self.subscription.save()
        self.assertTrue(self.subscription.can_read_premium_article())

        self.subscription.articles_read_this_period = 100
        self.subscription.save()
        self.assertFalse(self.subscription.can_read_premium_article())

    def test_increment_article_read(self):
        """Test incrementing article read counter."""
        initial_count = self.subscription.articles_read_this_period
        self.subscription.increment_article_read()
        self.subscription.refresh_from_db()
        self.assertEqual(
            self.subscription.articles_read_this_period,
            initial_count + 1
        )


class CouponModelTests(TestCase):
    """Test cases for Coupon model."""

    def setUp(self):
        self.percentage_coupon = Coupon.objects.create(
            code="SAVE20",
            name="20% Off",
            discount_type=Coupon.DiscountType.PERCENTAGE,
            discount_value=20,
            max_redemptions=100,
        )
        self.fixed_coupon = Coupon.objects.create(
            code="SAVE500",
            name="$5 Off",
            discount_type=Coupon.DiscountType.FIXED,
            discount_value=500,  # $5.00 in cents
        )

    def test_coupon_creation(self):
        """Test coupon creation."""
        self.assertEqual(self.percentage_coupon.code, "SAVE20")
        self.assertTrue(self.percentage_coupon.is_valid)

    def test_percentage_discount(self):
        """Test percentage discount calculation."""
        discount = self.percentage_coupon.calculate_discount(1000)
        self.assertEqual(discount, 200)  # 20% of 1000

    def test_fixed_discount(self):
        """Test fixed discount calculation."""
        discount = self.fixed_coupon.calculate_discount(1000)
        self.assertEqual(discount, 500)  # $5.00

    def test_fixed_discount_cap(self):
        """Test fixed discount doesn't exceed amount."""
        discount = self.fixed_coupon.calculate_discount(300)
        self.assertEqual(discount, 300)  # Capped at original amount


class SubscriptionPlanAPITests(APITestCase):
    """API tests for subscription plans."""

    def setUp(self):
        self.client = APIClient()
        self.plan = SubscriptionPlan.objects.create(
            name="Premium",
            slug="premium",
            plan_type=SubscriptionPlan.PlanType.PREMIUM,
            price_usd=1999,
            billing_cycle=SubscriptionPlan.BillingCycle.MONTHLY,
            is_active=True,
        )

    def test_list_plans_unauthenticated(self):
        """Test that anyone can list plans without authentication."""
        url = reverse("api-v1:subscriptions:plan-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_plan(self):
        """Test retrieving a single plan."""
        url = reverse("api-v1:subscriptions:plan-detail", args=[self.plan.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Premium")


class SubscriptionAPITests(APITestCase):
    """API tests for user subscriptions."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123"
        )
        self.client = APIClient()
        self.plan = SubscriptionPlan.objects.create(
            name="Premium",
            slug="premium",
            plan_type=SubscriptionPlan.PlanType.PREMIUM,
            price_usd=1999,
            billing_cycle=SubscriptionPlan.BillingCycle.MONTHLY,
            is_active=True,
        )

    def test_list_subscriptions_requires_auth(self):
        """Test that listing subscriptions requires authentication."""
        url = reverse("api-v1:subscriptions:subscription-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_subscriptions_authenticated(self):
        """Test listing subscriptions when authenticated."""
        self.client.force_authenticate(user=self.user)
        url = reverse("api-v1:subscriptions:subscription-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_current_subscription(self):
        """Test getting current subscription."""
        Subscription.objects.create(
            user=self.user,
            plan=self.plan,
            status=Subscription.Status.ACTIVE,
        )
        self.client.force_authenticate(user=self.user)
        url = reverse("api-v1:subscriptions:subscription-current")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["plan"]["name"], "Premium")

    def test_get_subscription_summary(self):
        """Test getting subscription summary."""
        self.client.force_authenticate(user=self.user)
        url = reverse("api-v1:subscriptions:subscription-summary")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("has_active_subscription", response.data)
        self.assertIn("available_plans", response.data)
