"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  X,
  TrendingUp,
  Newspaper,
  Building2,
  User,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "stock" | "article" | "company" | "person" | "suggestion";
  title: string;
  subtitle?: string;
  url: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface LiveSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock search data
const stockResults: SearchResult[] = [
  { id: "1", type: "stock", title: "NPN", subtitle: "Naspers Ltd • JSE", url: "/companies/npn", badge: "+2.83%" },
  { id: "2", type: "stock", title: "MTN", subtitle: "MTN Group Ltd • JSE", url: "/companies/mtn", badge: "+6.41%" },
  { id: "3", type: "stock", title: "AGL", subtitle: "Anglo American Plc • JSE", url: "/companies/agl", badge: "+8.75%" },
  { id: "4", type: "stock", title: "SBK", subtitle: "Standard Bank Group • JSE", url: "/companies/sbk", badge: "+4.80%" },
  { id: "5", type: "stock", title: "DANGCEM", subtitle: "Dangote Cement • NGX", url: "/companies/dangcem", badge: "+1.58%" },
];

const articleResults: SearchResult[] = [
  { id: "6", type: "article", title: "JSE All Share Index Hits Record High", subtitle: "Markets • 2 hours ago", url: "/news/jse-record-high" },
  { id: "7", type: "article", title: "Central Bank of Nigeria Holds Rates", subtitle: "Economics • 4 hours ago", url: "/news/cbn-rates-decision" },
  { id: "8", type: "article", title: "Naspers Share Buyback Programme", subtitle: "Corporate • 5 hours ago", url: "/news/naspers-buyback" },
  { id: "9", type: "article", title: "MTN Q3 Revenue Growth Report", subtitle: "Earnings • 6 hours ago", url: "/news/mtn-q3-results" },
];

const companyResults: SearchResult[] = [
  { id: "10", type: "company", title: "Naspers Ltd", subtitle: "Technology • JSE", url: "/companies/npn" },
  { id: "11", type: "company", title: "MTN Group Ltd", subtitle: "Telecommunications • JSE", url: "/companies/mtn" },
  { id: "12", type: "company", title: "Standard Bank Group", subtitle: "Banking • JSE", url: "/companies/sbk" },
  { id: "13", type: "company", title: "Dangote Cement Plc", subtitle: "Industrial • NGX", url: "/companies/dangcem" },
];

const personResults: SearchResult[] = [
  { id: "14", type: "person", title: "Phuthi Mahanyele-Dabengwa", subtitle: "CEO, Naspers South Africa", url: "/people/phuthi-mahanyele" },
  { id: "15", type: "person", title: "Ralph Memory Memory", subtitle: "CEO, MTN Group", url: "/people/ralph-mupita" },
  { id: "16", type: "person", title: "Aliko Dangote", subtitle: "Chairman, Dangote Group", url: "/people/aliko-dangote" },
];

const suggestions: SearchResult[] = [
  { id: "s1", type: "suggestion", title: "JSE Top 40", url: "/markets/indices/j200" },
  { id: "s2", type: "suggestion", title: "NGX All Share Index", url: "/markets/indices/ngxasi" },
  { id: "s3", type: "suggestion", title: "Banking sector analysis", url: "/research?sector=banking" },
  { id: "s4", type: "suggestion", title: "Gold price forecast", url: "/markets/commodities/gold" },
];

const recentSearches = [
  "Naspers",
  "JSE All Share",
  "MTN earnings",
  "Rand forecast",
];

function getIcon(type: SearchResult["type"]) {
  switch (type) {
    case "stock":
      return <TrendingUp className="h-4 w-4 text-market-up" />;
    case "article":
      return <Newspaper className="h-4 w-4 text-brand-orange" />;
    case "company":
      return <Building2 className="h-4 w-4 text-blue-400" />;
    case "person":
      return <User className="h-4 w-4 text-purple-400" />;
    case "suggestion":
      return <Sparkles className="h-4 w-4 text-yellow-400" />;
    default:
      return <Search className="h-4 w-4" />;
  }
}

export function LiveSearch({ isOpen, onClose }: LiveSearchProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [results, setResults] = useState<{
    stocks: SearchResult[];
    articles: SearchResult[];
    companies: SearchResult[];
    people: SearchResult[];
    suggestions: SearchResult[];
  }>({
    stocks: [],
    articles: [],
    companies: [],
    people: [],
    suggestions: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Debounced search
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({
        stocks: [],
        articles: [],
        companies: [],
        people: [],
        suggestions: suggestions.slice(0, 4),
      });
      return;
    }

    setIsSearching(true);

    // Simulate API delay
    setTimeout(() => {
      const q = searchQuery.toLowerCase();

      setResults({
        stocks: stockResults.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.subtitle?.toLowerCase().includes(q)
        ),
        articles: articleResults.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.subtitle?.toLowerCase().includes(q)
        ),
        companies: companyResults.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.subtitle?.toLowerCase().includes(q)
        ),
        people: personResults.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.subtitle?.toLowerCase().includes(q)
        ),
        suggestions: suggestions.filter((r) =>
          r.title.toLowerCase().includes(q)
        ),
      });

      setIsSearching(false);
    }, 200);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const categories = [
    { id: "all", label: "All", count: Object.values(results).flat().length },
    { id: "stocks", label: "Stocks", count: results.stocks.length },
    { id: "articles", label: "News", count: results.articles.length },
    { id: "companies", label: "Companies", count: results.companies.length },
    { id: "people", label: "People", count: results.people.length },
  ];

  const getFilteredResults = () => {
    if (activeCategory === "all") {
      return [
        ...results.stocks.slice(0, 3),
        ...results.articles.slice(0, 3),
        ...results.companies.slice(0, 2),
        ...results.people.slice(0, 2),
      ];
    }
    return results[activeCategory as keyof typeof results] || [];
  };

  const filteredResults = getFilteredResults();
  const hasResults = filteredResults.length > 0 || results.suggestions.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />

      {/* Search Modal */}
      <div className="fixed top-0 left-0 right-0 p-4 pt-16 md:pt-24">
        <div className="max-w-2xl mx-auto bg-terminal-bg border border-terminal-border rounded-lg shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-terminal-border">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stocks, news, companies, people..."
              className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex px-2 py-1 text-xs bg-terminal-bg-elevated rounded border border-terminal-border text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Categories */}
          {query && (
            <div className="flex items-center gap-1 px-4 py-2 border-b border-terminal-border overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors",
                    activeCategory === cat.id
                      ? "bg-brand-orange text-white"
                      : "bg-terminal-bg-elevated text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat.label}
                  {cat.count > 0 && (
                    <span className="ml-1 text-xs opacity-70">({cat.count})</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {isSearching ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="animate-spin h-6 w-6 border-2 border-brand-orange border-t-transparent rounded-full mx-auto mb-2" />
                Searching...
              </div>
            ) : !query ? (
              <>
                {/* Recent Searches */}
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Recent Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-terminal-bg-elevated rounded-full hover:bg-terminal-bg-secondary transition-colors"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="p-4 border-t border-terminal-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Popular
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestions.map((item) => (
                      <Link
                        key={item.id}
                        href={item.url}
                        onClick={onClose}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-terminal-bg-elevated text-sm transition-colors"
                      >
                        {getIcon(item.type)}
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            ) : hasResults ? (
              <div className="divide-y divide-terminal-border">
                {/* Suggestions */}
                {results.suggestions.length > 0 && activeCategory === "all" && (
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
                      Suggestions
                    </h3>
                    {results.suggestions.map((item) => (
                      <Link
                        key={item.id}
                        href={item.url}
                        onClick={onClose}
                        className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-terminal-bg-elevated transition-colors"
                      >
                        {getIcon(item.type)}
                        <span className="font-medium">{item.title}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* Results */}
                {filteredResults.length > 0 && (
                  <div className="p-3">
                    {activeCategory === "all" && (
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
                        Results
                      </h3>
                    )}
                    {filteredResults.map((item) => (
                      <Link
                        key={item.id}
                        href={item.url}
                        onClick={onClose}
                        className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-terminal-bg-elevated transition-colors group"
                      >
                        {getIcon(item.type)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium group-hover:text-brand-orange transition-colors">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-sm text-muted-foreground truncate">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                        {item.badge && (
                          <span
                            className={cn(
                              "text-sm font-mono",
                              item.badge.startsWith("+")
                                ? "text-market-up"
                                : item.badge.startsWith("-")
                                ? "text-market-down"
                                : "text-muted-foreground"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found for &quot;{query}&quot;</p>
                <p className="text-sm mt-1">Try different keywords or browse categories</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-terminal-border bg-terminal-bg-secondary text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-terminal-bg rounded border border-terminal-border">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-terminal-bg rounded border border-terminal-border">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-terminal-bg rounded border border-terminal-border">↵</kbd>
                to select
              </span>
            </div>
            <Link
              href="/search"
              onClick={onClose}
              className="text-brand-orange hover:text-brand-orange-light"
            >
              Advanced Search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
