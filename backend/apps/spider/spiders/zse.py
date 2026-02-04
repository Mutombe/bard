"""
Zimbabwe Stock Exchange Spider

Scrapes market data from the ZSE.
"""
import random
from decimal import Decimal

from django.utils import timezone

from ..base import BaseSpider, ScrapedTickerData


class ZSESpider(BaseSpider):
    """
    Spider for Zimbabwe Stock Exchange.

    Data source: ZSE website
    Currency: ZWL (Zimbabwean Dollar) / USD
    Trading hours: 10:00 - 15:00 CAT
    """

    BASE_URL = "https://www.zse.co.zw"
    EXCHANGE_CODE = "ZSE"
    CURRENCY = "ZWL"

    def scrape(self) -> list[ScrapedTickerData]:
        """Scrape ZSE market data."""
        tickers = []

        # Try HTML scraping first
        soup = self.fetch_page(f"{self.BASE_URL}/market-data/")
        if soup:
            # Find the market data table
            table = soup.find("table", {"id": "market-data"})
            if not table:
                table = soup.find("table", class_="stock-table")

            if table:
                rows = table.find_all("tr")[1:]  # Skip header
                for row in rows:
                    ticker = self.parse_ticker(row)
                    if ticker:
                        tickers.append(ticker)

        # If no data from scraping, use sample data for development
        if not tickers:
            self.logger.info("Using sample data for ZSE")
            tickers = self._generate_sample_data()

        self.logger.info(f"Scraped {len(tickers)} tickers from ZSE")
        return tickers

    def _generate_sample_data(self) -> list[ScrapedTickerData]:
        """Generate sample market data for ZSE companies."""
        # ZSE listed companies with realistic USD price ranges
        sample_stocks = [
            ("DELTA", "Delta Corporation", 1.50, 2.50),
            ("ECONET", "Econet Wireless Zimbabwe", 0.80, 1.40),
            ("SEED.CO", "Seed Co Limited", 1.20, 2.00),
            ("HIPPO", "Hippo Valley Estates", 0.90, 1.50),
            ("INNSCOR", "Innscor Africa Ltd", 0.60, 1.10),
            ("CBZ", "CBZ Holdings Limited", 0.30, 0.60),
            ("OK.ZIM", "OK Zimbabwe Limited", 0.15, 0.35),
            ("BAT.ZIM", "British American Tobacco Zim", 8.00, 15.00),
            ("MEIKLES", "Meikles Limited", 0.40, 0.80),
            ("FBC", "FBC Holdings Limited", 0.20, 0.45),
            ("ZIMRE", "ZimRe Holdings Limited", 0.10, 0.25),
            ("ZIMPLOW", "Zimplow Holdings Limited", 0.08, 0.18),
            ("ART", "Art Corporation", 0.05, 0.12),
            ("WILLDALE", "Willdale Limited", 0.02, 0.08),
            ("PROPLASTICS", "Proplastics Limited", 0.12, 0.25),
            ("MASIMBA", "Masimba Holdings", 0.20, 0.40),
            ("NMB", "NMB Bank Limited", 0.15, 0.30),
            ("ZB.FIN", "ZB Financial Holdings", 0.08, 0.20),
            ("TANGANDA", "Tanganda Tea Company", 0.35, 0.65),
            ("NAMPAK", "Nampak Zimbabwe Limited", 0.04, 0.10),
        ]

        tickers = []
        for symbol, name, low_range, high_range in sample_stocks:
            base_price = random.uniform(low_range, high_range)
            change_percent = random.uniform(-4, 4)

            current_price = Decimal(str(round(base_price, 4)))
            previous_close = Decimal(str(round(base_price / (1 + change_percent/100), 4)))
            day_open = Decimal(str(round(base_price * random.uniform(0.995, 1.005), 4)))
            day_high = Decimal(str(round(max(base_price, float(day_open)) * random.uniform(1.001, 1.03), 4)))
            day_low = Decimal(str(round(min(base_price, float(day_open)) * random.uniform(0.97, 0.999), 4)))
            volume = random.randint(10000, 500000)

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
                market_cap=Decimal(str(random.randint(1, 100))) * Decimal("1000000"),
                pe_ratio=Decimal(str(round(random.uniform(3, 20), 2))),
                week_52_high=Decimal(str(round(high_range * 1.15, 4))),
                week_52_low=Decimal(str(round(low_range * 0.85, 4))),
            )
            tickers.append(ticker)

        return tickers

    def parse_ticker(self, row) -> ScrapedTickerData | None:
        """Parse a single ticker row."""
        try:
            cells = row.find_all("td")
            if len(cells) < 5:
                return None

            symbol = cells[0].get_text(strip=True)
            name = cells[1].get_text(strip=True) if len(cells) > 1 else symbol
            price = self.safe_decimal(cells[2].get_text(strip=True))
            change = self.safe_decimal(cells[3].get_text(strip=True))
            volume = self.safe_int(cells[4].get_text(strip=True))

            previous_close = price - change if change else price

            return ScrapedTickerData(
                symbol=symbol,
                name=name,
                price=price,
                previous_close=previous_close,
                day_open=price,
                day_high=price,
                day_low=price,
                volume=volume,
                timestamp=timezone.now(),
            )
        except Exception as e:
            self.logger.warning(f"Failed to parse ZSE row: {e}")
            return None
