"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Newspaper,
  User,
  Clock,
  ArrowRight,
  Sparkles,
  Factory,
  Globe,
  Tag,
  FileText,
  Mic,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "article" | "person" | "suggestion" | "industry" | "region" | "topic" | "research" | "podcast" | "economics";
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

// Mock search data - Articles
const articleResults: SearchResult[] = [
  { id: "ar2", type: "article", title: "Central Bank of Nigeria Holds Rates", subtitle: "Economics • 4 hours ago", url: "/news/cbn-rates-decision" },
  { id: "ar3", type: "article", title: "Naspers Share Buyback Programme", subtitle: "Corporate • 5 hours ago", url: "/news/naspers-buyback" },
  { id: "ar4", type: "article", title: "MTN Q3 Revenue Growth Report", subtitle: "Corporate • 6 hours ago", url: "/news/mtn-q3-results" },
  { id: "ar5", type: "article", title: "SARB Inflation Outlook 2025", subtitle: "Economics • 8 hours ago", url: "/news/sarb-inflation-outlook" },
  { id: "ar6", type: "article", title: "Gold Mining Sector Analysis", subtitle: "Industries • 1 day ago", url: "/news/gold-mining-analysis" },
  { id: "ar7", type: "article", title: "AfCFTA Trade Agreement Progress", subtitle: "Trade Policy • 2 days ago", url: "/news/afcfta-progress" },
  { id: "ar8", type: "article", title: "Kenya Fintech Ecosystem Growth", subtitle: "Technology • 3 days ago", url: "/news/kenya-fintech-growth" },
];

// Mock search data - People
const personResults: SearchResult[] = [
  { id: "pe1", type: "person", title: "Phuthi Mahanyele-Dabengwa", subtitle: "CEO, Naspers South Africa", url: "/people/phuthi-mahanyele" },
  { id: "pe2", type: "person", title: "Ralph Mupita", subtitle: "CEO, MTN Group", url: "/people/ralph-mupita" },
  { id: "pe3", type: "person", title: "Aliko Dangote", subtitle: "Chairman, Dangote Group", url: "/people/aliko-dangote" },
  { id: "pe4", type: "person", title: "Lesetja Kganyago", subtitle: "Governor, SARB", url: "/people/lesetja-kganyago" },
  { id: "pe5", type: "person", title: "Peter Ndegwa", subtitle: "CEO, Safaricom", url: "/people/peter-ndegwa" },
  { id: "pe6", type: "person", title: "James Mwangi", subtitle: "CEO, Equity Group", url: "/people/james-mwangi" },
];

// Mock search data - Industries
const industryResults: SearchResult[] = [
  { id: "in1", type: "industry", title: "Banking & Financial Services", subtitle: "Industry • 142 companies", url: "/industries/banking" },
  { id: "in2", type: "industry", title: "Mining & Resources", subtitle: "Industry • 98 companies", url: "/industries/mining" },
  { id: "in3", type: "industry", title: "Technology & Fintech", subtitle: "Industry • 76 companies", url: "/industries/technology" },
  { id: "in4", type: "industry", title: "Agriculture & Agribusiness", subtitle: "Industry • 54 companies", url: "/industries/agriculture" },
  { id: "in5", type: "industry", title: "Infrastructure & Energy", subtitle: "Industry • 67 companies", url: "/industries/infrastructure" },
  { id: "in6", type: "industry", title: "Telecommunications", subtitle: "Industry • 38 companies", url: "/industries/telecommunications" },
  { id: "in7", type: "industry", title: "Real Estate & Construction", subtitle: "Industry • 45 companies", url: "/industries/real-estate" },
  { id: "in8", type: "industry", title: "Consumer Goods & Retail", subtitle: "Industry • 89 companies", url: "/industries/consumer-goods" },
];

// Mock search data - Regions
const regionResults: SearchResult[] = [
  { id: "re1", type: "region", title: "Southern Africa", subtitle: "Region • South Africa, Botswana, Namibia, Zimbabwe", url: "/regions/southern-africa" },
  { id: "re2", type: "region", title: "East Africa", subtitle: "Region • Kenya, Tanzania, Uganda, Rwanda, Ethiopia", url: "/regions/east-africa" },
  { id: "re3", type: "region", title: "West Africa", subtitle: "Region • Nigeria, Ghana, Côte d'Ivoire, Senegal", url: "/regions/west-africa" },
  { id: "re4", type: "region", title: "North Africa", subtitle: "Region • Egypt, Morocco, Tunisia, Algeria", url: "/regions/north-africa" },
  { id: "re5", type: "region", title: "Central Africa", subtitle: "Region • DRC, Cameroon, Gabon", url: "/regions/central-africa" },
  { id: "re6", type: "region", title: "South Africa", subtitle: "Country • 402 companies listed", url: "/regions/south-africa" },
  { id: "re7", type: "region", title: "Nigeria", subtitle: "Country • 186 companies listed", url: "/regions/nigeria" },
  { id: "re8", type: "region", title: "Kenya", subtitle: "Country • 67 companies listed", url: "/regions/kenya" },
  { id: "re9", type: "region", title: "Egypt", subtitle: "Country • 124 companies listed", url: "/regions/egypt" },
];

// Mock search data - Topics
const topicResults: SearchResult[] = [
  { id: "to1", type: "topic", title: "Central Banks & Monetary Policy", subtitle: "Topic • SARB, CBN, CBK, NBE", url: "/topics/central-banks" },
  { id: "to2", type: "topic", title: "Fintech & Digital Finance", subtitle: "Topic • Mobile money, Digital banking", url: "/topics/fintech" },
  { id: "to3", type: "topic", title: "Trade Policy & AfCFTA", subtitle: "Topic • African Continental Free Trade", url: "/topics/trade-policy" },
  { id: "to4", type: "topic", title: "Commodities & Resources", subtitle: "Topic • Gold, Oil, Platinum, Agriculture", url: "/topics/commodities" },
  { id: "to5", type: "topic", title: "Sustainable Finance & ESG", subtitle: "Topic • Green bonds, Climate finance", url: "/topics/sustainability" },
  { id: "to6", type: "topic", title: "Private Equity & Venture Capital", subtitle: "Topic • VC funding, PE deals", url: "/topics/private-equity" },
  { id: "to7", type: "topic", title: "Foreign Direct Investment", subtitle: "Topic • FDI flows, Investment treaties", url: "/topics/fdi" },
  { id: "to8", type: "topic", title: "Cryptocurrency & Blockchain", subtitle: "Topic • Digital assets, DeFi", url: "/topics/crypto" },
];

// Mock search data - Research & Publications
const researchResults: SearchResult[] = [
  { id: "rs1", type: "research", title: "African Banking Sector Outlook 2025", subtitle: "Research Report • Q1 2025", url: "/research/african-banking-outlook-2025" },
  { id: "rs2", type: "research", title: "Mobile Money Revolution in Africa", subtitle: "Research Report • December 2024", url: "/research/mobile-money-revolution" },
  { id: "rs3", type: "research", title: "Mining & Resources Annual Review", subtitle: "Research Report • Annual 2024", url: "/research/mining-resources-review" },
  { id: "rs4", type: "research", title: "ESG Investment Trends in Africa", subtitle: "Research Report • Q4 2024", url: "/research/esg-investment-trends" },
  { id: "rs5", type: "research", title: "AfCFTA Economic Impact Analysis", subtitle: "Research Report • Special Edition", url: "/research/afcfta-economic-impact" },
  { id: "rs6", type: "research", title: "African Startup Ecosystem Report", subtitle: "Research Report • Q3 2024", url: "/research/startup-ecosystem" },
];

// Mock search data - Podcasts
const podcastResults: SearchResult[] = [
  { id: "po2", type: "podcast", title: "BGFI Economic Briefing", subtitle: "Podcast • Weekly economics", url: "/podcasts/economic-briefing" },
  { id: "po3", type: "podcast", title: "Fintech Frontiers", subtitle: "Podcast • Technology interviews", url: "/podcasts/fintech-frontiers" },
  { id: "po4", type: "podcast", title: "Commodity Corner", subtitle: "Podcast • Resources & Mining", url: "/podcasts/commodity-corner" },
  { id: "po5", type: "podcast", title: "Central Bank Watch", subtitle: "Podcast • Monetary policy analysis", url: "/podcasts/central-bank-watch" },
];

// Mock search data - Economics content
const economicsResults: SearchResult[] = [
  { id: "ec1", type: "economics", title: "South African Reserve Bank (SARB)", subtitle: "Central Bank • Monetary Policy", url: "/economics/sarb" },
  { id: "ec2", type: "economics", title: "Central Bank of Nigeria (CBN)", subtitle: "Central Bank • Monetary Policy", url: "/economics/cbn" },
  { id: "ec3", type: "economics", title: "Central Bank of Kenya (CBK)", subtitle: "Central Bank • Monetary Policy", url: "/economics/cbk" },
  { id: "ec4", type: "economics", title: "Bank of Ghana (BoG)", subtitle: "Central Bank • Monetary Policy", url: "/economics/bog" },
  { id: "ec5", type: "economics", title: "National Bank of Ethiopia (NBE)", subtitle: "Central Bank • Monetary Policy", url: "/economics/nbe" },
  { id: "ec6", type: "economics", title: "Central Bank of Egypt (CBE)", subtitle: "Central Bank • Monetary Policy", url: "/economics/cbe" },
  { id: "ec7", type: "economics", title: "GDP Growth Tracker", subtitle: "Economic Indicator • Real-time data", url: "/economics/gdp-tracker" },
  { id: "ec8", type: "economics", title: "Inflation Monitor", subtitle: "Economic Indicator • CPI data", url: "/economics/inflation" },
];

// Suggestions shown when search is empty
const suggestions: SearchResult[] = [
  { id: "s1", type: "suggestion", title: "Banking sector analysis", url: "/industries/banking" },
  { id: "s2", type: "suggestion", title: "Central Banks", url: "/topics/central-banks" },
  { id: "s3", type: "suggestion", title: "Latest Research", url: "/research" },
  { id: "s4", type: "suggestion", title: "East Africa", url: "/regions/east-africa" },
  { id: "s5", type: "suggestion", title: "Fintech & Digital Finance", url: "/topics/fintech" },
  { id: "s6", type: "suggestion", title: "Mining & Resources", url: "/industries/mining" },
];

const recentSearches = [
  "Banking sector",
  "SARB rates",
  "East Africa",
  "Fintech",
  "Mining",
];

function getIcon(type: SearchResult["type"]) {
  switch (type) {
    case "article":
      return <Newspaper className="h-4 w-4 text-brand-orange" />;
    case "person":
      return <User className="h-4 w-4 text-purple-400" />;
    case "industry":
      return <Factory className="h-4 w-4 text-amber-400" />;
    case "region":
      return <Globe className="h-4 w-4 text-emerald-400" />;
    case "topic":
      return <Tag className="h-4 w-4 text-cyan-400" />;
    case "research":
      return <FileText className="h-4 w-4 text-violet-400" />;
    case "podcast":
      return <Mic className="h-4 w-4 text-rose-400" />;
    case "economics":
      return <Landmark className="h-4 w-4 text-sky-400" />;
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
    articles: SearchResult[];
    people: SearchResult[];
    industries: SearchResult[];
    regions: SearchResult[];
    topics: SearchResult[];
    research: SearchResult[];
    podcasts: SearchResult[];
    economics: SearchResult[];
    suggestions: SearchResult[];
  }>({
    articles: [],
    people: [],
    industries: [],
    regions: [],
    topics: [],
    research: [],
    podcasts: [],
    economics: [],
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

  // Search helper function
  const filterResults = (items: SearchResult[], query: string) => {
    return items.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.subtitle?.toLowerCase().includes(query)
    );
  };

  // Debounced search
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({
        articles: [],
        people: [],
        industries: [],
        regions: [],
        topics: [],
        research: [],
        podcasts: [],
        economics: [],
        suggestions: suggestions.slice(0, 6),
      });
      return;
    }

    setIsSearching(true);

    // Simulate API delay
    setTimeout(() => {
      const q = searchQuery.toLowerCase();

      setResults({
        articles: filterResults(articleResults, q),
        people: filterResults(personResults, q),
        industries: filterResults(industryResults, q),
        regions: filterResults(regionResults, q),
        topics: filterResults(topicResults, q),
        research: filterResults(researchResults, q),
        podcasts: filterResults(podcastResults, q),
        economics: filterResults(economicsResults, q),
        suggestions: filterResults(suggestions, q),
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

  // Calculate total count excluding suggestions
  const totalCount = results.articles.length +
    results.people.length + results.industries.length +
    results.regions.length + results.topics.length + results.research.length +
    results.podcasts.length + results.economics.length;

  const categories = [
    { id: "all", label: "All", count: totalCount },
    { id: "articles", label: "Insights", count: results.articles.length },
    { id: "industries", label: "Industries", count: results.industries.length },
    { id: "topics", label: "Topics", count: results.topics.length },
    { id: "regions", label: "Regions", count: results.regions.length },
    { id: "research", label: "Research", count: results.research.length },
    { id: "economics", label: "Economics", count: results.economics.length },
    { id: "podcasts", label: "Podcasts", count: results.podcasts.length },
    { id: "people", label: "People", count: results.people.length },
  ];

  // Filter out categories with 0 results (except "all")
  const visibleCategories = categories.filter(
    (cat) => cat.id === "all" || cat.count > 0
  );

  const getFilteredResults = () => {
    if (activeCategory === "all") {
      // Show a diverse mix of results from all categories
      return [
        ...results.articles.slice(0, 2),
        ...results.industries.slice(0, 2),
        ...results.topics.slice(0, 2),
        ...results.regions.slice(0, 2),
        ...results.research.slice(0, 2),
        ...results.economics.slice(0, 2),
        ...results.podcasts.slice(0, 2),
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
              placeholder="Search insights, industries, topics, regions, research..."
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
            <div className="flex items-center gap-1 px-4 py-2 border-b border-terminal-border overflow-x-auto scrollbar-thin">
              {visibleCategories.map((cat) => (
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

                {/* Browse Categories */}
                <div className="p-4 border-t border-terminal-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Browse by Category
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Link
                      href="/industries"
                      onClick={onClose}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-terminal-bg-elevated text-sm transition-colors"
                    >
                      <Factory className="h-4 w-4 text-amber-400" />
                      Industries
                    </Link>
                    <Link
                      href="/topics"
                      onClick={onClose}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-terminal-bg-elevated text-sm transition-colors"
                    >
                      <Tag className="h-4 w-4 text-cyan-400" />
                      Topics
                    </Link>
                    <Link
                      href="/regions"
                      onClick={onClose}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-terminal-bg-elevated text-sm transition-colors"
                    >
                      <Globe className="h-4 w-4 text-emerald-400" />
                      Regions
                    </Link>
                    <Link
                      href="/research"
                      onClick={onClose}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-terminal-bg-elevated text-sm transition-colors"
                    >
                      <FileText className="h-4 w-4 text-violet-400" />
                      Research
                    </Link>
                    <Link
                      href="/podcasts"
                      onClick={onClose}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-terminal-bg-elevated text-sm transition-colors"
                    >
                      <Mic className="h-4 w-4 text-rose-400" />
                      Podcasts
                    </Link>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="p-4 border-t border-terminal-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Popular Searches
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
