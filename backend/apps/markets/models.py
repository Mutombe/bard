"""
Market Models

Core models for African stock market data:
- Exchange: Stock exchanges (JSE, ZSE, BSE, etc.)
- Sector: Industry sectors
- Company: Listed companies
- MarketTicker: Real-time and historical price data
- MarketIndex: Index data (JSE All Share, etc.)
"""
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel, TimeStampedModel


class Exchange(TimeStampedModel):
    """
    Stock Exchange model.

    Supported exchanges:
    - JSE: Johannesburg Stock Exchange (South Africa)
    - ZSE: Zimbabwe Stock Exchange
    - BSE: Botswana Stock Exchange
    - NSE: Nairobi Securities Exchange (Kenya)
    - NSE_NG: Nigerian Stock Exchange
    - GSE: Ghana Stock Exchange
    - EGX: Egyptian Exchange
    """

    code = models.CharField(
        "Exchange Code",
        max_length=10,
        unique=True,
        db_index=True,
        help_text="Unique exchange identifier (e.g., JSE, ZSE)",
    )
    name = models.CharField(
        "Exchange Name",
        max_length=200,
        help_text="Full name of the exchange",
    )
    country = models.CharField(
        "Country",
        max_length=100,
    )
    currency = models.CharField(
        "Currency",
        max_length=3,
        help_text="Trading currency (e.g., ZAR, USD)",
    )
    timezone = models.CharField(
        "Timezone",
        max_length=50,
        default="Africa/Johannesburg",
    )
    trading_hours_start = models.TimeField(
        "Trading Hours Start",
        default="09:00",
    )
    trading_hours_end = models.TimeField(
        "Trading Hours End",
        default="17:00",
    )
    is_active = models.BooleanField(
        "Active",
        default=True,
    )
    website = models.URLField(
        "Website",
        blank=True,
    )

    class Meta:
        verbose_name = "Exchange"
        verbose_name_plural = "Exchanges"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def is_open(self):
        """Check if the exchange is currently open for trading."""
        now = timezone.localtime(timezone.now())
        current_time = now.time()
        is_weekday = now.weekday() < 5  # Monday = 0, Friday = 4

        return (
            is_weekday
            and self.trading_hours_start <= current_time <= self.trading_hours_end
        )


class Sector(TimeStampedModel):
    """Industry sector classification."""

    code = models.CharField(
        "Sector Code",
        max_length=20,
        unique=True,
        db_index=True,
    )
    name = models.CharField(
        "Sector Name",
        max_length=200,
    )
    description = models.TextField(
        "Description",
        blank=True,
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subsectors",
        help_text="Parent sector for hierarchical classification",
    )

    class Meta:
        verbose_name = "Sector"
        verbose_name_plural = "Sectors"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Company(BaseModel):
    """
    Listed company model.

    Stores company information and current market snapshot.
    """

    # =========================
    # Identifiers
    # =========================
    symbol = models.CharField(
        "Ticker Symbol",
        max_length=20,
        db_index=True,
        help_text="Stock ticker symbol (e.g., AGL, MTN)",
    )
    isin = models.CharField(
        "ISIN",
        max_length=12,
        unique=True,
        null=True,
        blank=True,
        help_text="International Securities Identification Number",
    )
    name = models.CharField(
        "Company Name",
        max_length=300,
    )
    short_name = models.CharField(
        "Short Name",
        max_length=100,
        blank=True,
        help_text="Abbreviated company name for display",
    )

    # =========================
    # Classification
    # =========================
    exchange = models.ForeignKey(
        Exchange,
        on_delete=models.PROTECT,
        related_name="companies",
    )
    sector = models.ForeignKey(
        Sector,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="companies",
    )

    # =========================
    # Company Info
    # =========================
    description = models.TextField(
        "Description",
        blank=True,
    )
    logo = models.ImageField(
        "Logo",
        upload_to="company_logos/",
        null=True,
        blank=True,
    )
    website = models.URLField(
        "Website",
        blank=True,
    )
    founded_year = models.PositiveIntegerField(
        "Founded Year",
        null=True,
        blank=True,
    )
    employees = models.PositiveIntegerField(
        "Number of Employees",
        null=True,
        blank=True,
    )
    headquarters = models.CharField(
        "Headquarters",
        max_length=200,
        blank=True,
    )

    # =========================
    # Current Market Snapshot
    # (Updated by spider tasks)
    # =========================
    current_price = models.DecimalField(
        "Current Price",
        max_digits=18,
        decimal_places=4,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
    )
    previous_close = models.DecimalField(
        "Previous Close",
        max_digits=18,
        decimal_places=4,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
    )
    day_open = models.DecimalField(
        "Day Open",
        max_digits=18,
        decimal_places=4,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
    )
    day_high = models.DecimalField(
        "Day High",
        max_digits=18,
        decimal_places=4,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
    )
    day_low = models.DecimalField(
        "Day Low",
        max_digits=18,
        decimal_places=4,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
    )
    volume = models.BigIntegerField(
        "Volume",
        default=0,
        validators=[MinValueValidator(0)],
    )
    market_cap = models.DecimalField(
        "Market Cap",
        max_digits=24,
        decimal_places=2,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
    )
    shares_outstanding = models.BigIntegerField(
        "Shares Outstanding",
        default=0,
        validators=[MinValueValidator(0)],
    )
    pe_ratio = models.DecimalField(
        "P/E Ratio",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    dividend_yield = models.DecimalField(
        "Dividend Yield %",
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
    )
    week_52_high = models.DecimalField(
        "52 Week High",
        max_digits=18,
        decimal_places=4,
        default=Decimal("0"),
    )
    week_52_low = models.DecimalField(
        "52 Week Low",
        max_digits=18,
        decimal_places=4,
        default=Decimal("0"),
    )
    last_updated = models.DateTimeField(
        "Last Updated",
        auto_now=True,
    )

    # =========================
    # Status
    # =========================
    is_active = models.BooleanField(
        "Active",
        default=True,
        help_text="Whether the stock is actively trading",
    )
    is_featured = models.BooleanField(
        "Featured",
        default=False,
        help_text="Featured on homepage ticker",
    )

    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        ordering = ["symbol"]
        unique_together = [["symbol", "exchange"]]
        indexes = [
            models.Index(fields=["symbol"]),
            models.Index(fields=["exchange", "symbol"]),
            models.Index(fields=["is_active", "is_featured"]),
            models.Index(fields=["sector"]),
        ]

    def __str__(self):
        return f"{self.symbol} ({self.exchange.code})"

    @property
    def price_change(self):
        """Calculate absolute price change from previous close."""
        return self.current_price - self.previous_close

    @property
    def price_change_percent(self):
        """Calculate percentage price change from previous close."""
        if self.previous_close == 0:
            return Decimal("0")
        return ((self.current_price - self.previous_close) / self.previous_close) * 100

    @property
    def is_up(self):
        """Check if stock is up from previous close."""
        return self.current_price > self.previous_close

    @property
    def is_down(self):
        """Check if stock is down from previous close."""
        return self.current_price < self.previous_close

    @property
    def display_name(self):
        """Return short name or symbol for display."""
        return self.short_name or self.symbol


class MarketTicker(TimeStampedModel):
    """
    Historical and real-time price data.

    Each record represents a price point at a specific timestamp.
    Used for:
    - Intraday charts
    - Historical analysis
    - Price alerts
    """

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="tickers",
    )
    timestamp = models.DateTimeField(
        "Timestamp",
        db_index=True,
    )
    price = models.DecimalField(
        "Price",
        max_digits=18,
        decimal_places=4,
    )
    open_price = models.DecimalField(
        "Open",
        max_digits=18,
        decimal_places=4,
        null=True,
        blank=True,
    )
    high = models.DecimalField(
        "High",
        max_digits=18,
        decimal_places=4,
        null=True,
        blank=True,
    )
    low = models.DecimalField(
        "Low",
        max_digits=18,
        decimal_places=4,
        null=True,
        blank=True,
    )
    close = models.DecimalField(
        "Close",
        max_digits=18,
        decimal_places=4,
        null=True,
        blank=True,
    )
    volume = models.BigIntegerField(
        "Volume",
        default=0,
    )
    trade_count = models.PositiveIntegerField(
        "Number of Trades",
        default=0,
    )

    # =========================
    # Interval Type
    # =========================
    class IntervalType(models.TextChoices):
        TICK = "tick", "Tick"
        MINUTE_1 = "1m", "1 Minute"
        MINUTE_5 = "5m", "5 Minutes"
        MINUTE_15 = "15m", "15 Minutes"
        MINUTE_30 = "30m", "30 Minutes"
        HOUR_1 = "1h", "1 Hour"
        DAY = "1d", "1 Day"
        WEEK = "1w", "1 Week"
        MONTH = "1M", "1 Month"

    interval = models.CharField(
        "Interval",
        max_length=10,
        choices=IntervalType.choices,
        default=IntervalType.DAY,
        db_index=True,
    )

    class Meta:
        verbose_name = "Market Ticker"
        verbose_name_plural = "Market Tickers"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["company", "timestamp"]),
            models.Index(fields=["company", "interval", "timestamp"]),
            models.Index(fields=["timestamp"]),
        ]
        unique_together = [["company", "timestamp", "interval"]]

    def __str__(self):
        return f"{self.company.symbol} @ {self.price} ({self.timestamp})"


class MarketIndex(TimeStampedModel):
    """
    Market indices (e.g., JSE All Share Index).
    """

    code = models.CharField(
        "Index Code",
        max_length=20,
        unique=True,
        db_index=True,
    )
    name = models.CharField(
        "Index Name",
        max_length=200,
    )
    exchange = models.ForeignKey(
        Exchange,
        on_delete=models.PROTECT,
        related_name="indices",
    )
    current_value = models.DecimalField(
        "Current Value",
        max_digits=18,
        decimal_places=4,
        default=Decimal("0"),
    )
    previous_close = models.DecimalField(
        "Previous Close",
        max_digits=18,
        decimal_places=4,
        default=Decimal("0"),
    )
    day_high = models.DecimalField(
        "Day High",
        max_digits=18,
        decimal_places=4,
        default=Decimal("0"),
    )
    day_low = models.DecimalField(
        "Day Low",
        max_digits=18,
        decimal_places=4,
        default=Decimal("0"),
    )
    ytd_change = models.DecimalField(
        "YTD Change %",
        max_digits=8,
        decimal_places=2,
        default=Decimal("0"),
    )

    class Meta:
        verbose_name = "Market Index"
        verbose_name_plural = "Market Indices"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def change(self):
        return self.current_value - self.previous_close

    @property
    def change_percent(self):
        if self.previous_close == 0:
            return Decimal("0")
        return ((self.current_value - self.previous_close) / self.previous_close) * 100
