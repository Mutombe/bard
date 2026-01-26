/**
 * African Stock Exchange Data Service
 * Aggregates data from JSE, ZSE, BSE and other African markets
 */

// African market indices and their symbols
export const AFRICAN_INDICES = {
  // South Africa - JSE
  JSE_ALSI: { symbol: 'J203', name: 'JSE All Share Index', exchange: 'JSE', country: 'ZA', currency: 'ZAR' },
  JSE_TOP40: { symbol: 'J200', name: 'JSE Top 40', exchange: 'JSE', country: 'ZA', currency: 'ZAR' },
  JSE_INDI: { symbol: 'J257', name: 'JSE Industrial 25', exchange: 'JSE', country: 'ZA', currency: 'ZAR' },
  JSE_FINI: { symbol: 'J580', name: 'JSE Financial 15', exchange: 'JSE', country: 'ZA', currency: 'ZAR' },
  JSE_RESI: { symbol: 'J210', name: 'JSE Resources 10', exchange: 'JSE', country: 'ZA', currency: 'ZAR' },

  // Nigeria - NGX
  NGX_ASI: { symbol: 'NGXASI', name: 'NGX All Share Index', exchange: 'NGX', country: 'NG', currency: 'NGN' },
  NGX_30: { symbol: 'NGX30', name: 'NGX 30', exchange: 'NGX', country: 'NG', currency: 'NGN' },

  // Egypt - EGX
  EGX_30: { symbol: 'EGX30', name: 'EGX 30', exchange: 'EGX', country: 'EG', currency: 'EGP' },

  // Kenya - NSE
  NSE_20: { symbol: 'NSE20', name: 'NSE 20 Share Index', exchange: 'NSE', country: 'KE', currency: 'KES' },
  NSE_ASI: { symbol: 'NSEASI', name: 'NSE All Share Index', exchange: 'NSE', country: 'KE', currency: 'KES' },

  // Morocco - CSE
  MASI: { symbol: 'MASI', name: 'Morocco All Shares Index', exchange: 'CSE', country: 'MA', currency: 'MAD' },

  // Zimbabwe - ZSE
  ZSE_ASI: { symbol: 'ZSEASI', name: 'ZSE All Share Index', exchange: 'ZSE', country: 'ZW', currency: 'ZWL' },

  // Botswana - BSE
  BSE_DCI: { symbol: 'BSEDCI', name: 'BSE Domestic Company Index', exchange: 'BSE', country: 'BW', currency: 'BWP' },

  // Ghana - GSE
  GSE_CI: { symbol: 'GSECI', name: 'GSE Composite Index', exchange: 'GSE', country: 'GH', currency: 'GHS' },

  // Mauritius - SEM
  SEMDEX: { symbol: 'SEMDEX', name: 'SEMDEX', exchange: 'SEM', country: 'MU', currency: 'MUR' },

  // Tunisia - BVMT
  TUNINDEX: { symbol: 'TUNINDEX', name: 'Tunindex', exchange: 'BVMT', country: 'TN', currency: 'TND' },
} as const;

// Major JSE listed companies
export const JSE_TOP_STOCKS = [
  { symbol: 'NPN', name: 'Naspers Ltd', sector: 'Technology', marketCap: 1200000000000 },
  { symbol: 'PRX', name: 'Prosus NV', sector: 'Technology', marketCap: 900000000000 },
  { symbol: 'BTI', name: 'British American Tobacco', sector: 'Consumer Goods', marketCap: 800000000000 },
  { symbol: 'AGL', name: 'Anglo American Plc', sector: 'Mining', marketCap: 700000000000 },
  { symbol: 'GLN', name: 'Glencore Plc', sector: 'Mining', marketCap: 650000000000 },
  { symbol: 'BHP', name: 'BHP Group Ltd', sector: 'Mining', marketCap: 600000000000 },
  { symbol: 'CFR', name: 'Richemont', sector: 'Consumer Goods', marketCap: 550000000000 },
  { symbol: 'SOL', name: 'Sasol Ltd', sector: 'Energy', marketCap: 200000000000 },
  { symbol: 'SBK', name: 'Standard Bank Group', sector: 'Banking', marketCap: 350000000000 },
  { symbol: 'FSR', name: 'FirstRand Ltd', sector: 'Banking', marketCap: 400000000000 },
  { symbol: 'ABG', name: 'Absa Group Ltd', sector: 'Banking', marketCap: 180000000000 },
  { symbol: 'NED', name: 'Nedbank Group', sector: 'Banking', marketCap: 150000000000 },
  { symbol: 'MTN', name: 'MTN Group Ltd', sector: 'Telecommunications', marketCap: 280000000000 },
  { symbol: 'VOD', name: 'Vodacom Group', sector: 'Telecommunications', marketCap: 220000000000 },
  { symbol: 'SHP', name: 'Shoprite Holdings', sector: 'Retail', marketCap: 160000000000 },
  { symbol: 'WHL', name: 'Woolworths Holdings', sector: 'Retail', marketCap: 70000000000 },
  { symbol: 'DSY', name: 'Discovery Ltd', sector: 'Insurance', marketCap: 120000000000 },
  { symbol: 'SLM', name: 'Sanlam Ltd', sector: 'Insurance', marketCap: 130000000000 },
  { symbol: 'INP', name: 'Investec Plc', sector: 'Financial Services', marketCap: 90000000000 },
  { symbol: 'AMS', name: 'Anglo American Platinum', sector: 'Mining', marketCap: 300000000000 },
];

// Major NGX listed companies
export const NGX_TOP_STOCKS = [
  { symbol: 'DANGCEM', name: 'Dangote Cement Plc', sector: 'Industrial', marketCap: 4500000000000 },
  { symbol: 'MTNN', name: 'MTN Nigeria', sector: 'Telecommunications', marketCap: 5000000000000 },
  { symbol: 'AIRTELAF', name: 'Airtel Africa Plc', sector: 'Telecommunications', marketCap: 3800000000000 },
  { symbol: 'BUACEMENT', name: 'BUA Cement Plc', sector: 'Industrial', marketCap: 2800000000000 },
  { symbol: 'GTCO', name: 'Guaranty Trust Holding', sector: 'Banking', marketCap: 900000000000 },
  { symbol: 'ZENITHBANK', name: 'Zenith Bank Plc', sector: 'Banking', marketCap: 800000000000 },
  { symbol: 'FBNH', name: 'FBN Holdings Plc', sector: 'Banking', marketCap: 600000000000 },
  { symbol: 'ACCESSCORP', name: 'Access Holdings Plc', sector: 'Banking', marketCap: 550000000000 },
  { symbol: 'UBA', name: 'United Bank for Africa', sector: 'Banking', marketCap: 500000000000 },
  { symbol: 'SEPLAT', name: 'Seplat Energy Plc', sector: 'Oil & Gas', marketCap: 700000000000 },
  { symbol: 'NESTLE', name: 'Nestle Nigeria Plc', sector: 'Consumer Goods', marketCap: 1200000000000 },
  { symbol: 'BUAFOODS', name: 'BUA Foods Plc', sector: 'Consumer Goods', marketCap: 2500000000000 },
  { symbol: 'STANBIC', name: 'Stanbic IBTC Holdings', sector: 'Banking', marketCap: 450000000000 },
  { symbol: 'FLOURMILL', name: 'Flour Mills of Nigeria', sector: 'Consumer Goods', marketCap: 300000000000 },
  { symbol: 'PRESCO', name: 'Presco Plc', sector: 'Agriculture', marketCap: 250000000000 },
];

export interface MarketIndex {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  currency: string;
  value: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: Date;
}

export interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;
  peRatio?: number;
  dividend?: number;
  timestamp: Date;
}

// Simulated real-time data generator for African markets
// In production, this would connect to actual exchange APIs
function generateRealisticPrice(basePrice: number, volatility: number = 0.02): number {
  const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
  return Math.round((basePrice + change) * 100) / 100;
}

function generateChange(price: number, previousClose: number): { change: number; changePercent: number } {
  const change = Math.round((price - previousClose) * 100) / 100;
  const changePercent = Math.round((change / previousClose) * 10000) / 100;
  return { change, changePercent };
}

class AfricanMarketsService {
  // Simulated index values (would be fetched from actual APIs in production)
  private indexBaseValues: Record<string, number> = {
    J203: 78456.23,    // JSE All Share
    J200: 71234.56,    // JSE Top 40
    J257: 95678.90,    // JSE Industrial
    J580: 45678.12,    // JSE Financial
    J210: 62345.67,    // JSE Resources
    NGXASI: 98234.56,  // NGX All Share
    NGX30: 3456.78,    // NGX 30
    EGX30: 28765.43,   // EGX 30
    NSE20: 1456.78,    // NSE 20
    NSEASI: 112.34,    // NSE All Share
    MASI: 12345.67,    // Morocco MASI
    ZSEASI: 234567.89, // ZSE All Share
    BSEDCI: 8765.43,   // BSE DCI
    GSECI: 3234.56,    // GSE CI
    SEMDEX: 2156.78,   // SEMDEX
    TUNINDEX: 8234.56, // Tunindex
  };

  // Get all African indices
  async getAfricanIndices(): Promise<MarketIndex[]> {
    const indices: MarketIndex[] = [];

    for (const [key, config] of Object.entries(AFRICAN_INDICES)) {
      const baseValue = this.indexBaseValues[config.symbol] || 10000;
      const previousClose = generateRealisticPrice(baseValue, 0.005);
      const currentValue = generateRealisticPrice(previousClose, 0.015);
      const { change, changePercent } = generateChange(currentValue, previousClose);

      indices.push({
        symbol: config.symbol,
        name: config.name,
        exchange: config.exchange,
        country: config.country,
        currency: config.currency,
        value: currentValue,
        change,
        changePercent,
        previousClose,
        open: generateRealisticPrice(previousClose, 0.005),
        high: currentValue * (1 + Math.random() * 0.01),
        low: currentValue * (1 - Math.random() * 0.01),
        volume: Math.floor(Math.random() * 500000000) + 100000000,
        timestamp: new Date(),
      });
    }

    return indices;
  }

  // Get JSE index data
  async getJSEIndices(): Promise<MarketIndex[]> {
    const indices = await this.getAfricanIndices();
    return indices.filter(i => i.exchange === 'JSE');
  }

  // Get NGX index data
  async getNGXIndices(): Promise<MarketIndex[]> {
    const indices = await this.getAfricanIndices();
    return indices.filter(i => i.exchange === 'NGX');
  }

  // Get stock quotes for a specific exchange
  async getStockQuotes(exchange: 'JSE' | 'NGX', limit: number = 20): Promise<StockQuote[]> {
    const stocks = exchange === 'JSE' ? JSE_TOP_STOCKS : NGX_TOP_STOCKS;
    const quotes: StockQuote[] = [];

    for (const stock of stocks.slice(0, limit)) {
      const basePrice = stock.marketCap / 1000000000; // Simplified price calculation
      const previousClose = generateRealisticPrice(basePrice, 0.01);
      const currentPrice = generateRealisticPrice(previousClose, 0.02);
      const { change, changePercent } = generateChange(currentPrice, previousClose);

      quotes.push({
        symbol: stock.symbol,
        name: stock.name,
        exchange,
        sector: stock.sector,
        price: currentPrice,
        change,
        changePercent,
        previousClose,
        open: generateRealisticPrice(previousClose, 0.005),
        high: currentPrice * (1 + Math.random() * 0.02),
        low: currentPrice * (1 - Math.random() * 0.02),
        volume: Math.floor(Math.random() * 10000000) + 100000,
        marketCap: stock.marketCap,
        peRatio: Math.round((10 + Math.random() * 20) * 100) / 100,
        dividend: Math.round(Math.random() * 5 * 100) / 100,
        timestamp: new Date(),
      });
    }

    return quotes;
  }

  // Get top gainers
  async getTopGainers(exchange?: string, limit: number = 10): Promise<StockQuote[]> {
    const jseQuotes = await this.getStockQuotes('JSE', 20);
    const ngxQuotes = await this.getStockQuotes('NGX', 15);

    let allQuotes = [...jseQuotes, ...ngxQuotes];

    if (exchange) {
      allQuotes = allQuotes.filter(q => q.exchange === exchange);
    }

    return allQuotes
      .filter(q => q.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, limit);
  }

  // Get top losers
  async getTopLosers(exchange?: string, limit: number = 10): Promise<StockQuote[]> {
    const jseQuotes = await this.getStockQuotes('JSE', 20);
    const ngxQuotes = await this.getStockQuotes('NGX', 15);

    let allQuotes = [...jseQuotes, ...ngxQuotes];

    if (exchange) {
      allQuotes = allQuotes.filter(q => q.exchange === exchange);
    }

    return allQuotes
      .filter(q => q.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, limit);
  }

  // Get most active by volume
  async getMostActive(exchange?: string, limit: number = 10): Promise<StockQuote[]> {
    const jseQuotes = await this.getStockQuotes('JSE', 20);
    const ngxQuotes = await this.getStockQuotes('NGX', 15);

    let allQuotes = [...jseQuotes, ...ngxQuotes];

    if (exchange) {
      allQuotes = allQuotes.filter(q => q.exchange === exchange);
    }

    return allQuotes
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
  }

  // Get market summary for ticker
  async getTickerData(): Promise<Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    isUp: boolean;
  }>> {
    const indices = await this.getAfricanIndices();
    const jseStocks = await this.getStockQuotes('JSE', 10);

    const tickerItems = [
      ...indices.slice(0, 8).map(i => ({
        symbol: i.symbol,
        name: i.name,
        price: i.value,
        change: i.change,
        changePercent: i.changePercent,
        isUp: i.change >= 0,
      })),
      ...jseStocks.slice(0, 8).map(s => ({
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        change: s.change,
        changePercent: s.changePercent,
        isUp: s.change >= 0,
      })),
    ];

    return tickerItems;
  }
}

export const africanMarketsService = new AfricanMarketsService();
