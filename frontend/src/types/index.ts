// =========================
// User Types
// =========================

export type UserRole = "super_admin" | "editor" | "analyst" | "subscriber";
export type SubscriptionTier = "free" | "basic" | "professional" | "enterprise";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  subscription_tier: SubscriptionTier;
  is_active: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  email_verified?: boolean;
  date_joined?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  avatar: string | null;
  bio: string;
  company: string;
  job_title: string;
  phone: string;
  country: string;
  timezone: string;
  preferences: UserPreferences;
  watchlist: Company[];
}

export interface UserPreferences {
  notifications: {
    price_alerts: boolean;
    breaking_news: boolean;
    daily_digest: boolean;
    weekly_report: boolean;
  };
  display: {
    theme: "dark" | "light";
    currency: string;
    number_format: string;
  };
  default_exchange: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// =========================
// Market Types
// =========================

export interface Exchange {
  code: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  trading_hours_start: string;
  trading_hours_end: string;
  is_active: boolean;
  is_open: boolean;
  website: string;
}

export interface Sector {
  code: string;
  name: string;
  description: string;
}

export interface Company {
  id: string;
  symbol: string;
  isin: string | null;
  name: string;
  short_name: string;
  display_name: string;
  exchange: Exchange;
  exchange_code?: string;
  sector: Sector | null;
  industry?: string;
  description: string;
  logo: string | null;
  website: string;
  founded?: number;
  founded_year?: number | null;
  employees: number | null;
  headquarters: string;
  ceo?: string;
  current_price: number;
  previous_close: number;
  open_price?: number;
  day_open: number;
  day_high: number;
  day_low: number;
  volume: number;
  average_volume?: number;
  market_cap: number;
  shares_outstanding: number;
  pe_ratio: number | null;
  eps?: number | null;
  dividend?: number | null;
  dividend_yield: number | null;
  beta?: number | null;
  week_52_high: number;
  week_52_low: number;
  price_change: number;
  price_change_percent: number;
  is_up: boolean;
  is_down: boolean;
  is_active: boolean;
  is_featured: boolean;
  last_updated: string;
}

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  is_up: boolean;
}

export interface MarketTicker {
  id: string;
  symbol: string;
  timestamp: string;
  price: number;
  open_price: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trade_count: number;
  interval: string;
}

export interface ChartData {
  t: string; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

export interface MarketIndex {
  code: string;
  name: string;
  exchange?: Exchange;
  exchange_code?: string;
  country?: string;
  currency?: string;
  description?: string;
  value?: number;
  current_value: number;
  open?: number;
  high?: number;
  low?: number;
  previous_close: number;
  day_high: number;
  day_low: number;
  year_high?: number;
  year_low?: number;
  change: number;
  change_percent: number;
  ytd_change: number;
  market_cap?: string;
  constituents_count?: number;
  constituents?: any[];
  trading_hours?: string;
}

// =========================
// News Types
// =========================

export type ContentType =
  | "news"
  | "analysis"
  | "research"
  | "opinion"
  | "market_update"
  | "earnings";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  article_count: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  content?: string;
  featured_image: string | null;
  featured_image_caption: string;
  category: Category;
  tags: Tag[];
  content_type: ContentType;
  related_companies: Company[];
  author: User;
  editor: User | null;
  status: "draft" | "pending" | "published" | "archived";
  published_at: string;
  is_featured: boolean;
  is_breaking: boolean;
  is_premium: boolean;
  view_count: number;
  read_time_minutes: number;
  requires_subscription?: boolean;
}

// =========================
// Engagement Types
// =========================

export type NotificationType =
  | "price_alert"
  | "breaking_news"
  | "earnings"
  | "watchlist"
  | "system";

export interface Notification {
  id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface PriceAlert {
  id: string;
  company: Company;
  alert_type: "above" | "below" | "percent_change";
  target_price: number | null;
  target_percent: number | null;
  status: "active" | "triggered" | "expired" | "cancelled";
  triggered_at: string | null;
  triggered_price: number | null;
  expires_at: string | null;
  created_at: string;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  newsletter_type: string;
  is_active: boolean;
  is_verified: boolean;
  preferred_exchanges: string[];
  created_at: string;
}

// =========================
// API Response Types
// =========================

export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CursorPaginatedResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface APIError {
  error: {
    code: string;
    message: string;
    status_code: number;
    details?: Record<string, string[]>;
  };
}
