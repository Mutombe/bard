"""
Portfolio Models

Investment portfolio tracking system with:
- Multiple portfolios per user
- Position tracking with cost basis
- Transaction history
- Performance calculations
- Dividend tracking
"""
from decimal import Decimal

from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel, TimeStampedModel


class Portfolio(BaseModel):
    """
    User investment portfolio.

    A user can have multiple portfolios for different purposes.
    """

    class PortfolioType(models.TextChoices):
        PERSONAL = "personal", "Personal"
        RETIREMENT = "retirement", "Retirement"
        TRADING = "trading", "Trading"
        PAPER = "paper", "Paper Trading"
        WATCH = "watch", "Watchlist Only"

    class Currency(models.TextChoices):
        ZAR = "ZAR", "South African Rand"
        USD = "USD", "US Dollar"
        BWP = "BWP", "Botswana Pula"
        ZWL = "ZWL", "Zimbabwean Dollar"
        KES = "KES", "Kenyan Shilling"
        NGN = "NGN", "Nigerian Naira"
        GHS = "GHS", "Ghanaian Cedi"
        EGP = "EGP", "Egyptian Pound"

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="portfolios",
    )
    name = models.CharField(
        "Portfolio Name",
        max_length=100,
    )
    description = models.TextField(
        "Description",
        blank=True,
    )
    portfolio_type = models.CharField(
        "Type",
        max_length=20,
        choices=PortfolioType.choices,
        default=PortfolioType.PERSONAL,
    )
    base_currency = models.CharField(
        "Base Currency",
        max_length=3,
        choices=Currency.choices,
        default=Currency.ZAR,
    )

    # Settings
    is_default = models.BooleanField(
        "Default Portfolio",
        default=False,
    )
    is_public = models.BooleanField(
        "Public",
        default=False,
        help_text="Allow others to view this portfolio",
    )
    show_values = models.BooleanField(
        "Show Values",
        default=True,
        help_text="Display monetary values",
    )

    # Cash position
    cash_balance = models.DecimalField(
        "Cash Balance",
        max_digits=15,
        decimal_places=2,
        default=0,
    )

    class Meta:
        verbose_name = "Portfolio"
        verbose_name_plural = "Portfolios"
        ordering = ["-is_default", "name"]
        indexes = [
            models.Index(fields=["user", "-is_default"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.user.email})"

    def save(self, *args, **kwargs):
        # Ensure only one default portfolio per user
        if self.is_default:
            Portfolio.objects.filter(
                user=self.user, is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    @property
    def total_value(self):
        """Total portfolio value including cash."""
        positions_value = sum(p.market_value for p in self.positions.all())
        return positions_value + self.cash_balance

    @property
    def total_cost(self):
        """Total cost basis of all positions."""
        return sum(p.cost_basis for p in self.positions.all())

    @property
    def total_gain_loss(self):
        """Total unrealized gain/loss."""
        return self.total_value - self.total_cost - self.cash_balance

    @property
    def total_gain_loss_percent(self):
        """Total gain/loss percentage."""
        if self.total_cost > 0:
            return (self.total_gain_loss / self.total_cost) * 100
        return Decimal("0")


class Position(TimeStampedModel):
    """
    Stock position within a portfolio.
    """

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="positions",
    )
    company = models.ForeignKey(
        "markets.Company",
        on_delete=models.CASCADE,
        related_name="positions",
    )

    # Quantity and pricing
    quantity = models.DecimalField(
        "Quantity",
        max_digits=15,
        decimal_places=4,
    )
    average_cost = models.DecimalField(
        "Average Cost",
        max_digits=15,
        decimal_places=4,
        help_text="Average cost per share",
    )

    # First and last transaction dates
    first_purchase_date = models.DateField(
        "First Purchase",
    )
    last_transaction_date = models.DateField(
        "Last Transaction",
    )

    # Notes
    notes = models.TextField(
        "Notes",
        blank=True,
    )

    class Meta:
        verbose_name = "Position"
        verbose_name_plural = "Positions"
        unique_together = [["portfolio", "company"]]
        ordering = ["company__symbol"]

    def __str__(self):
        return f"{self.company.symbol}: {self.quantity} shares"

    @property
    def cost_basis(self):
        """Total cost basis for position."""
        return self.quantity * self.average_cost

    @property
    def current_price(self):
        """Get current price from ticker."""
        ticker = self.company.tickers.filter(is_primary=True).first()
        if ticker:
            return ticker.last_price
        return Decimal("0")

    @property
    def market_value(self):
        """Current market value."""
        return self.quantity * self.current_price

    @property
    def unrealized_gain_loss(self):
        """Unrealized gain/loss."""
        return self.market_value - self.cost_basis

    @property
    def unrealized_gain_loss_percent(self):
        """Unrealized gain/loss percentage."""
        if self.cost_basis > 0:
            return (self.unrealized_gain_loss / self.cost_basis) * 100
        return Decimal("0")

    @property
    def day_gain_loss(self):
        """Today's gain/loss."""
        ticker = self.company.tickers.filter(is_primary=True).first()
        if ticker and ticker.change:
            return self.quantity * ticker.change
        return Decimal("0")


class Transaction(TimeStampedModel):
    """
    Transaction record for portfolio.
    """

    class TransactionType(models.TextChoices):
        BUY = "buy", "Buy"
        SELL = "sell", "Sell"
        DIVIDEND = "dividend", "Dividend"
        SPLIT = "split", "Stock Split"
        TRANSFER_IN = "transfer_in", "Transfer In"
        TRANSFER_OUT = "transfer_out", "Transfer Out"
        DEPOSIT = "deposit", "Cash Deposit"
        WITHDRAWAL = "withdrawal", "Cash Withdrawal"

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    company = models.ForeignKey(
        "markets.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )
    transaction_type = models.CharField(
        "Type",
        max_length=20,
        choices=TransactionType.choices,
    )

    # Transaction details
    date = models.DateField(
        "Transaction Date",
    )
    quantity = models.DecimalField(
        "Quantity",
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
    )
    price = models.DecimalField(
        "Price per Share",
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
    )
    amount = models.DecimalField(
        "Total Amount",
        max_digits=15,
        decimal_places=2,
    )
    currency = models.CharField(
        "Currency",
        max_length=3,
        default="ZAR",
    )

    # Fees
    commission = models.DecimalField(
        "Commission",
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    fees = models.DecimalField(
        "Other Fees",
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    # Notes
    notes = models.TextField(
        "Notes",
        blank=True,
    )

    # For tax purposes
    tax_lot_id = models.CharField(
        "Tax Lot ID",
        max_length=50,
        blank=True,
    )

    class Meta:
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["portfolio", "-date"]),
            models.Index(fields=["company", "-date"]),
        ]

    def __str__(self):
        if self.company:
            return f"{self.transaction_type}: {self.quantity} {self.company.symbol} @ {self.price}"
        return f"{self.transaction_type}: {self.amount}"

    @property
    def total_cost(self):
        """Total cost including fees."""
        base = self.amount
        if self.transaction_type == "buy":
            return base + self.commission + self.fees
        elif self.transaction_type == "sell":
            return base - self.commission - self.fees
        return base


class Dividend(TimeStampedModel):
    """
    Dividend payment record.
    """

    class DividendType(models.TextChoices):
        CASH = "cash", "Cash Dividend"
        STOCK = "stock", "Stock Dividend"
        SPECIAL = "special", "Special Dividend"

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="dividends",
    )
    company = models.ForeignKey(
        "markets.Company",
        on_delete=models.CASCADE,
        related_name="dividend_payments",
    )
    dividend_type = models.CharField(
        "Type",
        max_length=20,
        choices=DividendType.choices,
        default=DividendType.CASH,
    )

    # Dates
    ex_date = models.DateField(
        "Ex-Dividend Date",
    )
    pay_date = models.DateField(
        "Payment Date",
    )

    # Amounts
    shares_held = models.DecimalField(
        "Shares Held",
        max_digits=15,
        decimal_places=4,
    )
    dividend_per_share = models.DecimalField(
        "Dividend per Share",
        max_digits=10,
        decimal_places=4,
    )
    gross_amount = models.DecimalField(
        "Gross Amount",
        max_digits=15,
        decimal_places=2,
    )
    tax_withheld = models.DecimalField(
        "Tax Withheld",
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    net_amount = models.DecimalField(
        "Net Amount",
        max_digits=15,
        decimal_places=2,
    )
    currency = models.CharField(
        "Currency",
        max_length=3,
        default="ZAR",
    )

    # Reinvestment
    is_reinvested = models.BooleanField(
        "Reinvested",
        default=False,
    )
    reinvestment_transaction = models.ForeignKey(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dividend_reinvestment",
    )

    class Meta:
        verbose_name = "Dividend"
        verbose_name_plural = "Dividends"
        ordering = ["-pay_date"]

    def __str__(self):
        return f"{self.company.symbol}: {self.net_amount} on {self.pay_date}"


class PortfolioSnapshot(TimeStampedModel):
    """
    Daily snapshot of portfolio value for historical tracking.
    """

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="snapshots",
    )
    date = models.DateField(
        "Date",
    )

    # Values
    total_value = models.DecimalField(
        "Total Value",
        max_digits=15,
        decimal_places=2,
    )
    cash_balance = models.DecimalField(
        "Cash Balance",
        max_digits=15,
        decimal_places=2,
    )
    positions_value = models.DecimalField(
        "Positions Value",
        max_digits=15,
        decimal_places=2,
    )

    # Performance
    day_change = models.DecimalField(
        "Day Change",
        max_digits=15,
        decimal_places=2,
        default=0,
    )
    day_change_percent = models.DecimalField(
        "Day Change %",
        max_digits=8,
        decimal_places=4,
        default=0,
    )

    # Position count
    position_count = models.PositiveIntegerField(
        "Positions",
        default=0,
    )

    class Meta:
        verbose_name = "Portfolio Snapshot"
        verbose_name_plural = "Portfolio Snapshots"
        unique_together = [["portfolio", "date"]]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.portfolio.name}: {self.total_value} on {self.date}"


class PortfolioPerformance(TimeStampedModel):
    """
    Calculated performance metrics for portfolio.

    Updated periodically.
    """

    portfolio = models.OneToOneField(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="performance",
    )

    # Returns
    return_1d = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    return_1w = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    return_1m = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    return_3m = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    return_ytd = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    return_1y = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    return_all = models.DecimalField(max_digits=8, decimal_places=4, default=0)

    # Risk metrics
    volatility = models.DecimalField(
        "Volatility",
        max_digits=8,
        decimal_places=4,
        default=0,
        help_text="Annualized standard deviation",
    )
    sharpe_ratio = models.DecimalField(
        "Sharpe Ratio",
        max_digits=8,
        decimal_places=4,
        default=0,
    )
    beta = models.DecimalField(
        "Beta",
        max_digits=8,
        decimal_places=4,
        default=1,
    )

    # Dividend metrics
    total_dividends_received = models.DecimalField(
        "Total Dividends",
        max_digits=15,
        decimal_places=2,
        default=0,
    )
    dividend_yield = models.DecimalField(
        "Dividend Yield",
        max_digits=8,
        decimal_places=4,
        default=0,
    )

    # Best/worst
    best_day = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    best_day_date = models.DateField(null=True, blank=True)
    worst_day = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    worst_day_date = models.DateField(null=True, blank=True)

    last_calculated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Portfolio Performance"
        verbose_name_plural = "Portfolio Performance"

    def __str__(self):
        return f"Performance: {self.portfolio.name}"


class WatchlistItem(TimeStampedModel):
    """
    Watchlist item with price alerts.
    """

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="watchlist_items",
    )
    company = models.ForeignKey(
        "markets.Company",
        on_delete=models.CASCADE,
        related_name="watchlist_entries",
    )

    # Target prices
    target_buy_price = models.DecimalField(
        "Target Buy Price",
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
    )
    target_sell_price = models.DecimalField(
        "Target Sell Price",
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
    )

    # Notes
    notes = models.TextField(
        "Notes",
        blank=True,
    )

    # Alert settings
    alert_on_target = models.BooleanField(
        "Alert on Target",
        default=True,
    )
    alert_on_news = models.BooleanField(
        "Alert on News",
        default=False,
    )

    class Meta:
        verbose_name = "Watchlist Item"
        verbose_name_plural = "Watchlist Items"
        unique_together = [["portfolio", "company"]]

    def __str__(self):
        return f"{self.company.symbol} (watching)"
