"""
Botswana Stock Exchange Spider

Scrapes market data from the BSE.
"""
from django.utils import timezone

from ..base import BaseSpider, ScrapedTickerData


class BSESpider(BaseSpider):
    """
    Spider for Botswana Stock Exchange.

    Data source: BSE website
    Currency: BWP (Botswana Pula)
    Trading hours: 09:30 - 15:30 CAT
    """

    BASE_URL = "https://www.bse.co.bw"
    EXCHANGE_CODE = "BSE"
    CURRENCY = "BWP"

    def scrape(self) -> list[ScrapedTickerData]:
        """Scrape BSE market data."""
        tickers = []

        soup = self.fetch_page(f"{self.BASE_URL}/listed-companies/")
        if not soup:
            return tickers

        # Find company listings
        table = soup.find("table", class_="stock-prices")
        if not table:
            table = soup.find("table")

        if not table:
            self.logger.warning("Could not find market data table on BSE")
            return tickers

        rows = table.find_all("tr")[1:]
        for row in rows:
            ticker = self.parse_ticker(row)
            if ticker:
                tickers.append(ticker)

        self.logger.info(f"Scraped {len(tickers)} tickers from BSE")
        return tickers

    def parse_ticker(self, row) -> ScrapedTickerData | None:
        """Parse a single ticker row."""
        try:
            cells = row.find_all("td")
            if len(cells) < 4:
                return None

            symbol = cells[0].get_text(strip=True)
            name = cells[1].get_text(strip=True) if len(cells) > 1 else symbol
            price = self.safe_decimal(cells[2].get_text(strip=True))
            volume = self.safe_int(cells[3].get_text(strip=True)) if len(cells) > 3 else 0

            return ScrapedTickerData(
                symbol=symbol,
                name=name,
                price=price,
                previous_close=price,
                day_open=price,
                day_high=price,
                day_low=price,
                volume=volume,
                timestamp=timezone.now(),
            )
        except Exception as e:
            self.logger.warning(f"Failed to parse BSE row: {e}")
            return None
