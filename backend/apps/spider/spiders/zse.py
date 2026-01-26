"""
Zimbabwe Stock Exchange Spider

Scrapes market data from the ZSE.
"""
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

        soup = self.fetch_page(f"{self.BASE_URL}/market-data/")
        if not soup:
            return tickers

        # Find the market data table
        table = soup.find("table", {"id": "market-data"})
        if not table:
            # Try alternative selector
            table = soup.find("table", class_="stock-table")

        if not table:
            self.logger.warning("Could not find market data table on ZSE")
            return tickers

        rows = table.find_all("tr")[1:]  # Skip header
        for row in rows:
            ticker = self.parse_ticker(row)
            if ticker:
                tickers.append(ticker)

        self.logger.info(f"Scraped {len(tickers)} tickers from ZSE")
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
