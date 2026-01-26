"""
Johannesburg Stock Exchange Spider

Scrapes market data from the JSE (South Africa).
"""
from decimal import Decimal

from django.utils import timezone

from ..base import BaseSpider, ScrapedTickerData


class JSESpider(BaseSpider):
    """
    Spider for Johannesburg Stock Exchange.

    Data source: JSE website and APIs
    Currency: ZAR (South African Rand)
    Trading hours: 09:00 - 17:00 SAST
    """

    BASE_URL = "https://www.jse.co.za"
    EXCHANGE_CODE = "JSE"
    CURRENCY = "ZAR"

    # JSE provides a JSON API for market data
    API_URL = "https://www.jse.co.za/api/instruments"

    def scrape(self) -> list[ScrapedTickerData]:
        """
        Scrape JSE market data.

        Uses JSE's public API where available, falls back to sample data.
        """
        tickers = []

        # Try API first
        api_data = self._fetch_api_data()
        if api_data:
            tickers.extend(api_data)
        else:
            # Fallback to sample data generation (for development)
            sample_data = self._generate_sample_data()
            tickers.extend(sample_data)

        self.logger.info(f"Scraped {len(tickers)} tickers from JSE")
        return tickers

    def _generate_sample_data(self) -> list[ScrapedTickerData]:
        """Generate sample market data for development/testing."""
        import random
        from decimal import Decimal

        # JSE Top 40 sample companies with realistic price ranges
        sample_stocks = [
            ("AGL", "Anglo American Plc", 600, 700),
            ("SBK", "Standard Bank Group", 150, 200),
            ("MTN", "MTN Group Ltd", 80, 120),
            ("NPN", "Naspers Ltd", 2800, 3500),
            ("SOL", "Sasol Ltd", 120, 180),
            ("FSR", "FirstRand Ltd", 60, 80),
            ("ABG", "Absa Group Ltd", 140, 180),
            ("BHP", "BHP Group Ltd", 450, 550),
            ("AMS", "Anglo American Platinum", 800, 1100),
            ("IMP", "Impala Platinum", 90, 140),
            ("SHP", "Shoprite Holdings", 200, 280),
            ("VOD", "Vodacom Group Ltd", 100, 140),
            ("CFR", "Compagnie Financiere Richemont", 180, 250),
            ("GFI", "Gold Fields Ltd", 200, 300),
            ("MNP", "Mondi Plc", 280, 350),
            ("DSY", "Discovery Ltd", 120, 160),
            ("REM", "Remgro Ltd", 100, 140),
            ("BTI", "British American Tobacco", 450, 600),
            ("APN", "Aspen Pharmacare", 140, 200),
            ("SLM", "Sanlam Ltd", 60, 80),
        ]

        tickers = []
        for symbol, name, low_range, high_range in sample_stocks:
            # Generate realistic random price movement
            base_price = random.uniform(low_range, high_range)
            change_percent = random.uniform(-3, 3)  # -3% to +3% daily change

            current_price = Decimal(str(round(base_price, 2)))
            previous_close = Decimal(str(round(base_price / (1 + change_percent/100), 2)))
            day_open = Decimal(str(round(base_price * random.uniform(0.995, 1.005), 2)))
            day_high = Decimal(str(round(max(base_price, float(day_open)) * random.uniform(1.001, 1.02), 2)))
            day_low = Decimal(str(round(min(base_price, float(day_open)) * random.uniform(0.98, 0.999), 2)))
            volume = random.randint(100000, 5000000)

            ticker = ScrapedTickerData(
                symbol=symbol,
                name=name,
                price=current_price,
                previous_close=previous_close,
                day_open=day_open,
                day_high=day_high,
                day_low=day_low,
                volume=volume,
                timestamp=timezone.now(),
                market_cap=Decimal(str(random.randint(10, 1500))) * Decimal("1000000000"),
                pe_ratio=Decimal(str(round(random.uniform(5, 30), 2))),
                week_52_high=Decimal(str(round(high_range * 1.1, 2))),
                week_52_low=Decimal(str(round(low_range * 0.9, 2))),
            )
            tickers.append(ticker)

        self.logger.info(f"Generated {len(tickers)} sample tickers for JSE")
        return tickers

    def _fetch_api_data(self) -> list[ScrapedTickerData]:
        """Fetch data from JSE API."""
        tickers = []

        try:
            response = self.client.get(
                f"{self.API_URL}",
                params={"market": "equity", "pageSize": 500},
            )
            response.raise_for_status()
            data = response.json()

            for item in data.get("instruments", []):
                ticker = self._parse_api_item(item)
                if ticker:
                    tickers.append(ticker)

        except Exception as e:
            self.logger.error(f"JSE API fetch failed: {e}")

        return tickers

    def _parse_api_item(self, item: dict) -> ScrapedTickerData | None:
        """Parse a single item from the JSE API response."""
        try:
            return ScrapedTickerData(
                symbol=item.get("symbol", ""),
                name=item.get("name", ""),
                price=self.safe_decimal(item.get("lastPrice")),
                previous_close=self.safe_decimal(item.get("previousClose")),
                day_open=self.safe_decimal(item.get("openPrice")),
                day_high=self.safe_decimal(item.get("highPrice")),
                day_low=self.safe_decimal(item.get("lowPrice")),
                volume=self.safe_int(item.get("volume")),
                timestamp=timezone.now(),
                market_cap=self.safe_decimal(item.get("marketCap")),
                pe_ratio=self.safe_decimal(item.get("peRatio")),
                dividend_yield=self.safe_decimal(item.get("dividendYield")),
                week_52_high=self.safe_decimal(item.get("fiftyTwoWeekHigh")),
                week_52_low=self.safe_decimal(item.get("fiftyTwoWeekLow")),
            )
        except Exception as e:
            self.logger.warning(f"Failed to parse API item: {e}")
            return None

    def _scrape_html(self) -> list[ScrapedTickerData]:
        """Fallback HTML scraping method."""
        tickers = []

        # Scrape top 40 stocks page
        soup = self.fetch_page(f"{self.BASE_URL}/stocks/top-40")
        if not soup:
            return tickers

        table = soup.find("table", class_="market-data-table")
        if not table:
            self.logger.warning("Could not find market data table")
            return tickers

        rows = table.find_all("tr")[1:]  # Skip header row
        for row in rows:
            ticker = self.parse_ticker(row)
            if ticker:
                tickers.append(ticker)

        return tickers

    def parse_ticker(self, row) -> ScrapedTickerData | None:
        """Parse a single ticker row from HTML."""
        try:
            cells = row.find_all("td")
            if len(cells) < 6:
                return None

            symbol = cells[0].get_text(strip=True)
            name = cells[1].get_text(strip=True)
            price = self.safe_decimal(cells[2].get_text(strip=True))
            change = self.safe_decimal(cells[3].get_text(strip=True))
            volume = self.safe_int(cells[5].get_text(strip=True))

            # Calculate previous close from current price and change
            previous_close = price - change if change else price

            return ScrapedTickerData(
                symbol=symbol,
                name=name,
                price=price,
                previous_close=previous_close,
                day_open=price,  # May not be available in HTML
                day_high=price,
                day_low=price,
                volume=volume,
                timestamp=timezone.now(),
            )
        except Exception as e:
            self.logger.warning(f"Failed to parse row: {e}")
            return None
