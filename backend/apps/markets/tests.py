"""
Tests for the Markets app.
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse

from .models import Exchange, Sector, Company, MarketIndex, MarketTicker

User = get_user_model()


class ExchangeModelTests(TestCase):
    """Test cases for Exchange model."""

    def test_exchange_creation(self):
        """Test creating an exchange."""
        exchange = Exchange.objects.create(
            code="JSE",
            name="Johannesburg Stock Exchange",
            country="ZA",
            currency="ZAR",
            timezone="Africa/Johannesburg",
        )
        self.assertEqual(exchange.code, "JSE")
        self.assertEqual(str(exchange), "JSE - Johannesburg Stock Exchange")


class CompanyModelTests(TestCase):
    """Test cases for Company model."""

    def setUp(self):
        self.exchange = Exchange.objects.create(
            code="JSE",
            name="Johannesburg Stock Exchange",
            country="ZA",
            currency="ZAR",
        )
        self.sector = Sector.objects.create(
            code="TECH",
            name="Technology",
        )

    def test_company_creation(self):
        """Test creating a company."""
        company = Company.objects.create(
            symbol="NPN",
            name="Naspers Limited",
            exchange=self.exchange,
            sector=self.sector,
            market_cap=1000000000,
        )
        self.assertEqual(company.symbol, "NPN")
        self.assertEqual(company.exchange.code, "JSE")


class MarketsAPITests(APITestCase):
    """API tests for markets."""

    def setUp(self):
        self.client = APIClient()
        self.exchange = Exchange.objects.create(
            code="JSE",
            name="Johannesburg Stock Exchange",
            country="ZA",
            currency="ZAR",
        )
        self.sector = Sector.objects.create(
            code="TECH",
            name="Technology",
        )
        self.company = Company.objects.create(
            symbol="NPN",
            name="Naspers Limited",
            exchange=self.exchange,
            sector=self.sector,
            market_cap=1000000000,
        )

    def test_company_queryset(self):
        """Test querying companies."""
        companies = Company.objects.filter(exchange__code="JSE")
        self.assertEqual(companies.count(), 1)
        self.assertEqual(companies.first().symbol, "NPN")

    def test_sector_companies(self):
        """Test sector-company relationship."""
        tech_companies = self.sector.companies.all()
        self.assertEqual(tech_companies.count(), 1)
