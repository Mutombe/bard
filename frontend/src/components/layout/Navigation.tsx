"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Building2,
  Newspaper,
  FileText,
  Mic,
  Radio,
  Mail,
  Star,
  Bell,
  Bookmark,
  PieChart,
  LineChart,
  CandlestickChart,
  DollarSign,
  Briefcase,
  Landmark,
  Wallet,
  Calculator,
  Users,
  Award,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSavedCounts } from "@/hooks/use-saved-counts";

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavDropdown {
  label: string;
  sections: NavSection[];
  featured?: {
    title: string;
    description: string;
    href: string;
    badge?: string;
  };
}

const navigationData: NavDropdown[] = [
  {
    label: "Markets",
    sections: [
      {
        title: "African Exchanges",
        items: [
          { label: "JSE All Share", href: "/markets/jse", icon: TrendingUp, description: "Johannesburg Stock Exchange" },
          { label: "NGX", href: "/markets/ngx", icon: BarChart3, description: "Nigerian Exchange Group" },
          { label: "EGX", href: "/markets/egx", icon: LineChart, description: "Egyptian Exchange" },
          { label: "NSE Kenya", href: "/markets/nse", icon: CandlestickChart, description: "Nairobi Securities Exchange" },
          { label: "ZSE", href: "/markets/zse", icon: TrendingUp, description: "Zimbabwe Stock Exchange" },
          { label: "BSE Botswana", href: "/markets/bse", icon: BarChart3, description: "Botswana Stock Exchange" },
        ],
      },
      {
        title: "Market Data",
        items: [
          { label: "Indices", href: "/markets/indices", icon: LineChart, description: "Track major indices" },
          { label: "Gainers", href: "/markets/gainers", icon: TrendingUp, description: "Top performing stocks" },
          { label: "Losers", href: "/markets/losers", icon: TrendingDown, description: "Biggest decliners" },
          { label: "Most Active", href: "/markets/active", icon: Zap, description: "Highest volume traded" },
          { label: "Sectors", href: "/markets/sectors", icon: PieChart, description: "Sector performance" },
          { label: "ETFs", href: "/markets/etfs", icon: Briefcase, description: "Exchange traded funds" },
        ],
      },
      {
        title: "Global Markets",
        items: [
          { label: "US Markets", href: "/markets/us", icon: Globe, description: "NYSE, NASDAQ" },
          { label: "Europe", href: "/markets/europe", icon: Globe, description: "FTSE, DAX, CAC" },
          { label: "Asia", href: "/markets/asia", icon: Globe, description: "Nikkei, HSI, SSE" },
          { label: "Forex", href: "/markets/forex", icon: DollarSign, description: "Currency pairs" },
          { label: "Commodities", href: "/markets/commodities", icon: Target, description: "Gold, Oil, Metals" },
          { label: "Crypto", href: "/markets/crypto", icon: Wallet, description: "Digital assets" },
        ],
      },
    ],
    featured: {
      title: "Market Dashboard",
      description: "Real-time overview of all African markets with live data and analytics",
      href: "/markets",
      badge: "Live",
    },
  },
  {
    label: "Economics",
    sections: [
      {
        title: "Macro Data",
        items: [
          { label: "GDP Data", href: "/economics/gdp", icon: BarChart3, description: "Economic output" },
          { label: "Inflation", href: "/economics/inflation", icon: TrendingUp, description: "CPI & PPI data" },
          { label: "Interest Rates", href: "/economics/rates", icon: Calculator, description: "Central bank rates" },
          { label: "Employment", href: "/economics/employment", icon: Users, description: "Jobs & unemployment" },
          { label: "Trade Balance", href: "/economics/trade", icon: Globe, description: "Imports & exports" },
        ],
      },
      {
        title: "Central Banks",
        items: [
          { label: "SARB", href: "/economics/sarb", icon: Landmark, description: "South African Reserve Bank" },
          { label: "CBN", href: "/economics/cbn", icon: Landmark, description: "Central Bank of Nigeria" },
          { label: "Fed Watch", href: "/economics/fed", icon: Landmark, description: "US Federal Reserve" },
          { label: "ECB", href: "/economics/ecb", icon: Landmark, description: "European Central Bank" },
        ],
      },
      {
        title: "Calendar",
        items: [
          { label: "Economic Calendar", href: "/economics/calendar", icon: FileText, description: "Upcoming events" },
          { label: "Earnings Calendar", href: "/economics/earnings", icon: Calculator, description: "Company reports" },
          { label: "IPO Calendar", href: "/economics/ipo", icon: Award, description: "New listings" },
        ],
      },
    ],
  },
  {
    label: "News",
    sections: [
      {
        title: "News Categories",
        items: [
          { label: "Breaking News", href: "/news/category/breaking", icon: Zap, description: "Latest updates" },
          { label: "Market News", href: "/news/category/markets", icon: BarChart3, description: "Stock market coverage" },
          { label: "Company News", href: "/news/category/companies", icon: Building2, description: "Corporate updates" },
          { label: "Economy", href: "/news/category/economy", icon: Landmark, description: "Economic developments" },
          { label: "Politics", href: "/news/category/politics", icon: Users, description: "Policy & regulation" },
          { label: "Technology", href: "/news/category/technology", icon: Zap, description: "Tech sector news" },
        ],
      },
      {
        title: "Analysis",
        items: [
          { label: "Market Analysis", href: "/analysis/markets", icon: LineChart, description: "Technical & fundamental" },
          { label: "Research Reports", href: "/research", icon: FileText, description: "In-depth studies" },
          { label: "Opinions", href: "/opinions", icon: Users, description: "Expert perspectives" },
          { label: "Columns", href: "/columns", icon: Newspaper, description: "Regular commentary" },
        ],
      },
      {
        title: "Multimedia",
        items: [
          { label: "Videos", href: "/videos", icon: Radio, description: "Market updates" },
          { label: "Podcasts", href: "/podcasts", icon: Mic, description: "Audio content" },
          { label: "Webinars", href: "/webinars", icon: Users, description: "Live sessions" },
        ],
      },
    ],
    featured: {
      title: "Editor's Picks",
      description: "Curated selection of the most important stories of the day",
      href: "/news/editors-picks",
    },
  },
  {
    label: "Companies",
    sections: [
      {
        title: "Browse",
        items: [
          { label: "All Companies", href: "/companies", icon: Building2, description: "Complete directory" },
          { label: "By Sector", href: "/companies/sectors", icon: PieChart, description: "Industry breakdown" },
          { label: "By Market Cap", href: "/companies/market-cap", icon: BarChart3, description: "Size ranking" },
          { label: "Blue Chips", href: "/companies/blue-chips", icon: Award, description: "Top 40 stocks" },
        ],
      },
      {
        title: "Financials",
        items: [
          { label: "Earnings", href: "/companies/earnings", icon: Calculator, description: "Quarterly results" },
          { label: "Dividends", href: "/companies/dividends", icon: DollarSign, description: "Dividend data" },
          { label: "Annual Reports", href: "/companies/reports", icon: FileText, description: "Company filings" },
        ],
      },
      {
        title: "Tools",
        items: [
          { label: "Stock Screener", href: "/screener", icon: Target, description: "Filter stocks" },
          { label: "Compare Stocks", href: "/compare", icon: BarChart3, description: "Side by side" },
          { label: "Valuation", href: "/valuation", icon: Calculator, description: "Fair value calculator" },
        ],
      },
    ],
  },
  {
    label: "Personal Finance",
    sections: [
      {
        title: "Tools",
        items: [
          { label: "Portfolio Tracker", href: "/portfolio", icon: PieChart, description: "Track your investments" },
          { label: "Watchlist", href: "/watchlist", icon: Star, description: "Save stocks to watch" },
          { label: "Price Alerts", href: "/alerts", icon: Bell, description: "Custom notifications" },
          { label: "Saved Articles", href: "/saved", icon: Bookmark, description: "Read later" },
        ],
      },
      {
        title: "Newsletter",
        items: [
          { label: "Daily Briefing", href: "/newsletters/daily", icon: Mail, description: "Morning market wrap" },
          { label: "Weekly Digest", href: "/newsletters/weekly", icon: Mail, description: "Week in review" },
          { label: "Research Alerts", href: "/newsletters/research", icon: FileText, description: "New reports" },
        ],
      },
    ],
  },
];

function DropdownSection({ section, savedCounts }: { section: NavSection; savedCounts?: { watchlistCount: number; savedArticlesCount: number; likesCount: number } }) {
  // Map hrefs to their saved counts
  const getItemBadge = (href: string | undefined) => {
    if (!savedCounts || !href) return null;

    if (href === "/watchlist" && savedCounts.watchlistCount > 0) {
      return savedCounts.watchlistCount;
    }
    // Saved Articles shows bookmarks + likes combined
    if (href === "/saved") {
      const total = savedCounts.savedArticlesCount + savedCounts.likesCount;
      return total > 0 ? total : null;
    }
    return null;
  };

  return (
    <div className="py-2">
      <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {section.title}
      </h4>
      <ul className="space-y-0.5">
        {section.items.map((item) => {
          const badge = getItemBadge(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href || "#"}
                className="flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-terminal-bg-elevated rounded-md transition-colors group"
              >
                {item.icon && (
                  <div className="relative">
                    <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                    {badge !== null && (
                      <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-brand-orange text-[9px] font-bold text-white flex items-center justify-center">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2">
                    {item.label}
                    {badge !== null && !item.icon && (
                      <span className="h-4 min-w-[16px] px-1 rounded-full bg-brand-orange text-[10px] font-bold text-white flex items-center justify-center">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NavDropdownMenu({ dropdown, isOpen, topOffset, savedCounts }: { dropdown: NavDropdown; isOpen: boolean; topOffset: number; savedCounts?: { watchlistCount: number; savedArticlesCount: number } }) {
  if (!isOpen) return null;

  // Only pass savedCounts to Personal Finance dropdown
  const showSavedCounts = dropdown.label === "Personal Finance" ? savedCounts : undefined;

  return (
    <div
      className="fixed inset-x-0 bg-terminal-bg-secondary border-t-2 border-t-brand-orange/50 border-b border-terminal-border shadow-2xl z-[100]"
      style={{ top: `${topOffset}px` }}
    >
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-8">
          {/* Sections */}
          <div className="flex-1 grid grid-cols-3 gap-6">
            {dropdown.sections.map((section) => (
              <DropdownSection key={section.title} section={section} savedCounts={showSavedCounts} />
            ))}
          </div>

          {/* Featured */}
          {dropdown.featured && (
            <div className="w-64 flex-shrink-0">
              <Link
                href={dropdown.featured.href}
                className="block p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border hover:border-brand-orange/50 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-foreground group-hover:text-brand-orange transition-colors">
                    {dropdown.featured.title}
                  </h4>
                  {dropdown.featured.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-market-up/20 text-market-up rounded">
                      {dropdown.featured.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {dropdown.featured.description}
                </p>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownTop, setDropdownTop] = useState(65);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const savedCounts = useSavedCounts();

  // Calculate dropdown position based on header
  useEffect(() => {
    const updatePosition = () => {
      if (navRef.current) {
        const header = navRef.current.closest('header');
        if (header) {
          const rect = header.getBoundingClientRect();
          setDropdownTop(rect.bottom);
        }
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    // Longer delay to allow moving to dropdown
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 300);
  };

  const handleDropdownMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleDropdownMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  // Check if Personal Finance has any saved items
  const hasPersonalFinanceItems = savedCounts.totalCount > 0;

  return (
    <>
      <nav ref={navRef} className="hidden lg:flex items-center gap-1 relative">
        {navigationData.map((dropdown) => {
          const showBadge = dropdown.label === "Personal Finance" && hasPersonalFinanceItems;
          return (
            <div
              key={dropdown.label}
              className="relative"
              onMouseEnter={() => handleMouseEnter(dropdown.label)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md",
                  openDropdown === dropdown.label
                    ? "text-brand-orange bg-terminal-bg-elevated"
                    : "text-foreground/80 hover:text-foreground hover:bg-terminal-bg-elevated"
                )}
              >
                {dropdown.label}
                {showBadge && (
                  <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
                )}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    openDropdown === dropdown.label && "rotate-180"
                  )}
                />
              </button>
            </div>
          );
        })}
      </nav>

      {/* Dropdown Menus - rendered outside nav for full-width */}
      {navigationData.map((dropdown) => (
        <div
          key={dropdown.label}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          <NavDropdownMenu
            dropdown={dropdown}
            isOpen={openDropdown === dropdown.label}
            topOffset={dropdownTop}
            savedCounts={savedCounts}
          />
        </div>
      ))}
    </>
  );
}

// Export navigation data for mobile menu
export { navigationData };
export type { NavDropdown, NavSection, NavItem };
