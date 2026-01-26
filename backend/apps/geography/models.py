"""
Geography Models

Hierarchical geographic categorization for African markets:
- Continent → Region → Country → City

Supports:
- News geo-tagging
- Company headquarters
- Exchange locations
- Regional market analysis
- Geographic content filtering
"""
from django.db import models
from django.utils.text import slugify

from apps.core.models import TimeStampedModel


class AfricanRegion(models.TextChoices):
    """African regional classifications."""

    SOUTHERN = "southern", "Southern Africa"
    EASTERN = "eastern", "East Africa"
    WESTERN = "western", "West Africa"
    NORTHERN = "northern", "North Africa"
    CENTRAL = "central", "Central Africa"


class Country(TimeStampedModel):
    """
    Country model for African nations.

    Includes economic indicators and market metadata.
    """

    # =========================
    # Identifiers
    # =========================
    code = models.CharField(
        "ISO Code",
        max_length=3,
        unique=True,
        db_index=True,
        help_text="ISO 3166-1 alpha-2 or alpha-3 code",
    )
    name = models.CharField(
        "Country Name",
        max_length=100,
    )
    slug = models.SlugField(
        "Slug",
        max_length=100,
        unique=True,
        db_index=True,
    )
    official_name = models.CharField(
        "Official Name",
        max_length=200,
        blank=True,
    )

    # =========================
    # Geographic Classification
    # =========================
    region = models.CharField(
        "African Region",
        max_length=20,
        choices=AfricanRegion.choices,
        db_index=True,
    )
    capital = models.CharField(
        "Capital City",
        max_length=100,
        blank=True,
    )

    # =========================
    # Economic Data
    # =========================
    currency_code = models.CharField(
        "Currency Code",
        max_length=3,
        help_text="ISO 4217 currency code",
    )
    currency_name = models.CharField(
        "Currency Name",
        max_length=100,
        blank=True,
    )
    currency_symbol = models.CharField(
        "Currency Symbol",
        max_length=10,
        blank=True,
    )
    gdp_usd = models.DecimalField(
        "GDP (USD)",
        max_digits=18,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="GDP in billions USD",
    )
    population = models.BigIntegerField(
        "Population",
        null=True,
        blank=True,
    )

    # =========================
    # Market Info
    # =========================
    has_stock_exchange = models.BooleanField(
        "Has Stock Exchange",
        default=False,
    )
    primary_exchange_code = models.CharField(
        "Primary Exchange Code",
        max_length=10,
        blank=True,
        help_text="Primary stock exchange code (e.g., JSE)",
    )
    timezone = models.CharField(
        "Timezone",
        max_length=50,
        default="UTC",
    )

    # =========================
    # Display
    # =========================
    flag_emoji = models.CharField(
        "Flag Emoji",
        max_length=10,
        blank=True,
    )
    flag_image = models.ImageField(
        "Flag Image",
        upload_to="flags/",
        null=True,
        blank=True,
    )

    # =========================
    # Status
    # =========================
    is_active = models.BooleanField(
        "Active",
        default=True,
        help_text="Include in listings and filters",
    )
    is_featured = models.BooleanField(
        "Featured",
        default=False,
        help_text="Prominent display in market overview",
    )

    class Meta:
        verbose_name = "Country"
        verbose_name_plural = "Countries"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["region"]),
            models.Index(fields=["code"]),
            models.Index(fields=["is_active", "region"]),
        ]

    def __str__(self):
        return f"{self.flag_emoji} {self.name}" if self.flag_emoji else self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class City(TimeStampedModel):
    """
    Major cities for finer geographic granularity.
    """

    name = models.CharField(
        "City Name",
        max_length=100,
    )
    slug = models.SlugField(
        "Slug",
        max_length=100,
        db_index=True,
    )
    country = models.ForeignKey(
        Country,
        on_delete=models.CASCADE,
        related_name="cities",
    )
    is_capital = models.BooleanField(
        "Is Capital",
        default=False,
    )
    is_financial_center = models.BooleanField(
        "Is Financial Center",
        default=False,
        help_text="Major financial/business hub",
    )
    population = models.BigIntegerField(
        "Population",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "City"
        verbose_name_plural = "Cities"
        ordering = ["country", "name"]
        unique_together = [["country", "slug"]]

    def __str__(self):
        return f"{self.name}, {self.country.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class GeographicTag(TimeStampedModel):
    """
    Geographic tagging for content (news, companies, etc.).

    Allows flexible geo-association at multiple levels.
    """

    class TagLevel(models.TextChoices):
        REGION = "region", "Region"
        COUNTRY = "country", "Country"
        CITY = "city", "City"

    # The tag references one of: region, country, or city
    level = models.CharField(
        "Tag Level",
        max_length=10,
        choices=TagLevel.choices,
    )
    region = models.CharField(
        "Region",
        max_length=20,
        choices=AfricanRegion.choices,
        blank=True,
    )
    country = models.ForeignKey(
        Country,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="geo_tags",
    )
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="geo_tags",
    )

    class Meta:
        verbose_name = "Geographic Tag"
        verbose_name_plural = "Geographic Tags"

    def __str__(self):
        if self.level == self.TagLevel.REGION:
            return f"Region: {self.get_region_display()}"
        elif self.level == self.TagLevel.COUNTRY and self.country:
            return f"Country: {self.country.name}"
        elif self.level == self.TagLevel.CITY and self.city:
            return f"City: {self.city.name}"
        return "Unknown"

    @property
    def display_name(self):
        """Get display name based on level."""
        if self.level == self.TagLevel.REGION:
            return self.get_region_display()
        elif self.level == self.TagLevel.COUNTRY and self.country:
            return self.country.name
        elif self.level == self.TagLevel.CITY and self.city:
            return self.city.name
        return ""


# =========================
# Initial Data Fixture
# =========================
AFRICAN_COUNTRIES = [
    # Southern Africa
    {"code": "ZA", "name": "South Africa", "region": "southern", "currency_code": "ZAR", "flag_emoji": "🇿🇦", "has_stock_exchange": True, "primary_exchange_code": "JSE"},
    {"code": "ZW", "name": "Zimbabwe", "region": "southern", "currency_code": "ZWL", "flag_emoji": "🇿🇼", "has_stock_exchange": True, "primary_exchange_code": "ZSE"},
    {"code": "BW", "name": "Botswana", "region": "southern", "currency_code": "BWP", "flag_emoji": "🇧🇼", "has_stock_exchange": True, "primary_exchange_code": "BSE"},
    {"code": "NA", "name": "Namibia", "region": "southern", "currency_code": "NAD", "flag_emoji": "🇳🇦", "has_stock_exchange": True, "primary_exchange_code": "NSX"},
    {"code": "MZ", "name": "Mozambique", "region": "southern", "currency_code": "MZN", "flag_emoji": "🇲🇿", "has_stock_exchange": True, "primary_exchange_code": "BVM"},
    {"code": "ZM", "name": "Zambia", "region": "southern", "currency_code": "ZMW", "flag_emoji": "🇿🇲", "has_stock_exchange": True, "primary_exchange_code": "LuSE"},
    {"code": "MW", "name": "Malawi", "region": "southern", "currency_code": "MWK", "flag_emoji": "🇲🇼", "has_stock_exchange": True, "primary_exchange_code": "MSE"},
    {"code": "LS", "name": "Lesotho", "region": "southern", "currency_code": "LSL", "flag_emoji": "🇱🇸"},
    {"code": "SZ", "name": "Eswatini", "region": "southern", "currency_code": "SZL", "flag_emoji": "🇸🇿", "has_stock_exchange": True, "primary_exchange_code": "SSX"},

    # East Africa
    {"code": "KE", "name": "Kenya", "region": "eastern", "currency_code": "KES", "flag_emoji": "🇰🇪", "has_stock_exchange": True, "primary_exchange_code": "NSE"},
    {"code": "TZ", "name": "Tanzania", "region": "eastern", "currency_code": "TZS", "flag_emoji": "🇹🇿", "has_stock_exchange": True, "primary_exchange_code": "DSE"},
    {"code": "UG", "name": "Uganda", "region": "eastern", "currency_code": "UGX", "flag_emoji": "🇺🇬", "has_stock_exchange": True, "primary_exchange_code": "USE"},
    {"code": "RW", "name": "Rwanda", "region": "eastern", "currency_code": "RWF", "flag_emoji": "🇷🇼", "has_stock_exchange": True, "primary_exchange_code": "RSE"},
    {"code": "ET", "name": "Ethiopia", "region": "eastern", "currency_code": "ETB", "flag_emoji": "🇪🇹"},
    {"code": "MU", "name": "Mauritius", "region": "eastern", "currency_code": "MUR", "flag_emoji": "🇲🇺", "has_stock_exchange": True, "primary_exchange_code": "SEM"},

    # West Africa
    {"code": "NG", "name": "Nigeria", "region": "western", "currency_code": "NGN", "flag_emoji": "🇳🇬", "has_stock_exchange": True, "primary_exchange_code": "NGX"},
    {"code": "GH", "name": "Ghana", "region": "western", "currency_code": "GHS", "flag_emoji": "🇬🇭", "has_stock_exchange": True, "primary_exchange_code": "GSE"},
    {"code": "CI", "name": "Côte d'Ivoire", "region": "western", "currency_code": "XOF", "flag_emoji": "🇨🇮", "has_stock_exchange": True, "primary_exchange_code": "BRVM"},
    {"code": "SN", "name": "Senegal", "region": "western", "currency_code": "XOF", "flag_emoji": "🇸🇳"},
    {"code": "ML", "name": "Mali", "region": "western", "currency_code": "XOF", "flag_emoji": "🇲🇱"},
    {"code": "BF", "name": "Burkina Faso", "region": "western", "currency_code": "XOF", "flag_emoji": "🇧🇫"},
    {"code": "NE", "name": "Niger", "region": "western", "currency_code": "XOF", "flag_emoji": "🇳🇪"},
    {"code": "TG", "name": "Togo", "region": "western", "currency_code": "XOF", "flag_emoji": "🇹🇬"},
    {"code": "BJ", "name": "Benin", "region": "western", "currency_code": "XOF", "flag_emoji": "🇧🇯"},
    {"code": "SL", "name": "Sierra Leone", "region": "western", "currency_code": "SLL", "flag_emoji": "🇸🇱"},
    {"code": "LR", "name": "Liberia", "region": "western", "currency_code": "LRD", "flag_emoji": "🇱🇷"},
    {"code": "GM", "name": "Gambia", "region": "western", "currency_code": "GMD", "flag_emoji": "🇬🇲"},
    {"code": "GW", "name": "Guinea-Bissau", "region": "western", "currency_code": "XOF", "flag_emoji": "🇬🇼"},
    {"code": "CV", "name": "Cape Verde", "region": "western", "currency_code": "CVE", "flag_emoji": "🇨🇻", "has_stock_exchange": True, "primary_exchange_code": "BVC"},

    # North Africa
    {"code": "EG", "name": "Egypt", "region": "northern", "currency_code": "EGP", "flag_emoji": "🇪🇬", "has_stock_exchange": True, "primary_exchange_code": "EGX"},
    {"code": "MA", "name": "Morocco", "region": "northern", "currency_code": "MAD", "flag_emoji": "🇲🇦", "has_stock_exchange": True, "primary_exchange_code": "CSE"},
    {"code": "TN", "name": "Tunisia", "region": "northern", "currency_code": "TND", "flag_emoji": "🇹🇳", "has_stock_exchange": True, "primary_exchange_code": "BVMT"},
    {"code": "DZ", "name": "Algeria", "region": "northern", "currency_code": "DZD", "flag_emoji": "🇩🇿", "has_stock_exchange": True, "primary_exchange_code": "SGBV"},
    {"code": "LY", "name": "Libya", "region": "northern", "currency_code": "LYD", "flag_emoji": "🇱🇾", "has_stock_exchange": True, "primary_exchange_code": "LSM"},

    # Central Africa
    {"code": "CD", "name": "DR Congo", "region": "central", "currency_code": "CDF", "flag_emoji": "🇨🇩"},
    {"code": "AO", "name": "Angola", "region": "central", "currency_code": "AOA", "flag_emoji": "🇦🇴", "has_stock_exchange": True, "primary_exchange_code": "BODIVA"},
    {"code": "CM", "name": "Cameroon", "region": "central", "currency_code": "XAF", "flag_emoji": "🇨🇲", "has_stock_exchange": True, "primary_exchange_code": "DSX"},
    {"code": "GA", "name": "Gabon", "region": "central", "currency_code": "XAF", "flag_emoji": "🇬🇦"},
    {"code": "CG", "name": "Republic of Congo", "region": "central", "currency_code": "XAF", "flag_emoji": "🇨🇬"},
    {"code": "TD", "name": "Chad", "region": "central", "currency_code": "XAF", "flag_emoji": "🇹🇩"},
    {"code": "CF", "name": "Central African Republic", "region": "central", "currency_code": "XAF", "flag_emoji": "🇨🇫"},
    {"code": "GQ", "name": "Equatorial Guinea", "region": "central", "currency_code": "XAF", "flag_emoji": "🇬🇶"},
]
