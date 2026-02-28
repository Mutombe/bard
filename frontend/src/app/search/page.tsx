"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Newspaper,
  Building2,
  CircleUserRound,
  X,
  Factory,
  Globe,
  Tag,
  FileText,
  Mic,
  Landmark,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface SearchResult {
  id: string;
  type: "article" | "company" | "person" | "index" | "industry" | "region" | "topic" | "research" | "podcast" | "economics";
  title: string;
  subtitle: string;
  description?: string;
  url: string;
  date?: string;
  image?: string;
  meta?: Record<string, any>;
}

// Mock search results with all content types
const mockResults: SearchResult[] = [
  // Articles
  {
    id: "a1",
    type: "article",
    title: "JSE All Share Index Hits Record High Amid Global Rally",
    subtitle: "Markets • 2 hours ago",
    description: "The Johannesburg Stock Exchange's All Share Index reached unprecedented levels today, driven by strong performance in mining and financial stocks.",
    url: "/news/jse-record-high",
    date: "2025-01-24",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
  },
  {
    id: "a2",
    type: "article",
    title: "Central Bank of Nigeria Holds Interest Rates Steady",
    subtitle: "Economics • 4 hours ago",
    description: "The Monetary Policy Committee decided to maintain the benchmark rate, citing inflation concerns.",
    url: "/news/cbn-rates-decision",
    date: "2025-01-24",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=200&fit=crop",
  },
  {
    id: "a3",
    type: "article",
    title: "Mining Sector Outlook: Opportunities in African Resources",
    subtitle: "Analysis • 1 day ago",
    description: "Expert analysis on the African mining sector and investment opportunities in 2025.",
    url: "/news/mining-outlook",
    date: "2025-01-23",
    image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&h=200&fit=crop",
  },
  // Companies
  {
    id: "c1",
    type: "company",
    title: "Naspers Ltd",
    subtitle: "NPN • JSE",
    url: "/companies/npn",
    meta: { price: 3245.67, change: 2.83 },
  },
  {
    id: "c2",
    type: "company",
    title: "MTN Group Ltd",
    subtitle: "MTN • JSE",
    url: "/companies/mtn",
    meta: { price: 156.78, change: 6.41 },
  },
  {
    id: "c3",
    type: "company",
    title: "Standard Bank Group",
    subtitle: "SBK • JSE",
    url: "/companies/sbk",
    meta: { price: 189.45, change: -1.23 },
  },
  // People
  {
    id: "p1",
    type: "person",
    title: "Phuthi Mahanyele-Dabengwa",
    subtitle: "CEO, Naspers South Africa",
    url: "/people/phuthi-mahanyele",
  },
  {
    id: "p2",
    type: "person",
    title: "Aliko Dangote",
    subtitle: "Chairman, Dangote Group",
    url: "/people/aliko-dangote",
  },
  {
    id: "p3",
    type: "person",
    title: "Lesetja Kganyago",
    subtitle: "Governor, South African Reserve Bank",
    url: "/people/lesetja-kganyago",
  },
  // Industries
  {
    id: "i1",
    type: "industry",
    title: "Banking & Financial Services",
    subtitle: "Industry • 142 companies",
    description: "Analysis and insights covering African banking, insurance, and financial services sectors.",
    url: "/industries/banking",
  },
  {
    id: "i2",
    type: "industry",
    title: "Mining & Resources",
    subtitle: "Industry • 98 companies",
    description: "Coverage of gold, platinum, diamonds, coal, and other mining operations across Africa.",
    url: "/industries/mining",
  },
  {
    id: "i3",
    type: "industry",
    title: "Technology & Fintech",
    subtitle: "Industry • 76 companies",
    description: "Digital transformation, fintech startups, and technology innovation in African markets.",
    url: "/industries/technology",
  },
  // Regions
  {
    id: "r1",
    type: "region",
    title: "Southern Africa",
    subtitle: "Region • South Africa, Botswana, Namibia, Zimbabwe",
    description: "Market coverage and economic analysis for Southern African economies.",
    url: "/regions/southern-africa",
  },
  {
    id: "r2",
    type: "region",
    title: "East Africa",
    subtitle: "Region • Kenya, Tanzania, Uganda, Rwanda, Ethiopia",
    description: "Economic trends and market insights for East African nations.",
    url: "/regions/east-africa",
  },
  {
    id: "r3",
    type: "region",
    title: "West Africa",
    subtitle: "Region • Nigeria, Ghana, Côte d'Ivoire, Senegal",
    description: "Comprehensive coverage of West African markets and economies.",
    url: "/regions/west-africa",
  },
  // Topics
  {
    id: "t1",
    type: "topic",
    title: "Central Banks & Monetary Policy",
    subtitle: "Topic • SARB, CBN, CBK, NBE",
    description: "Interest rate decisions, inflation targeting, and monetary policy analysis.",
    url: "/topics/central-banks",
  },
  {
    id: "t2",
    type: "topic",
    title: "Fintech & Digital Finance",
    subtitle: "Topic • Mobile money, Digital banking",
    description: "The transformation of financial services through technology innovation.",
    url: "/topics/fintech",
  },
  {
    id: "t3",
    type: "topic",
    title: "Trade Policy & AfCFTA",
    subtitle: "Topic • African Continental Free Trade Area",
    description: "Trade agreements, tariffs, and economic integration across Africa.",
    url: "/topics/trade-policy",
  },
  // Research
  {
    id: "rs1",
    type: "research",
    title: "African Banking Sector Outlook 2025",
    subtitle: "Research Report • Q1 2025",
    description: "Comprehensive analysis of banking trends, digital transformation, and regulatory developments.",
    url: "/research/african-banking-outlook-2025",
  },
  {
    id: "rs2",
    type: "research",
    title: "Mobile Money Revolution in Africa",
    subtitle: "Research Report • December 2024",
    description: "How mobile financial services are reshaping economic inclusion across Sub-Saharan Africa.",
    url: "/research/mobile-money-revolution",
  },
  // Podcasts
  {
    id: "po1",
    type: "podcast",
    title: "African Markets Today",
    subtitle: "Podcast • Daily market analysis",
    description: "Daily roundup of African market movements and economic news.",
    url: "/podcasts/african-markets-today",
  },
  {
    id: "po2",
    type: "podcast",
    title: "Central Bank Watch",
    subtitle: "Podcast • Monetary policy analysis",
    description: "In-depth analysis of central bank decisions across African economies.",
    url: "/podcasts/central-bank-watch",
  },
  // Economics
  {
    id: "e1",
    type: "economics",
    title: "South African Reserve Bank (SARB)",
    subtitle: "Central Bank • Monetary Policy",
    description: "Analysis and news related to South Africa's central bank and monetary policy decisions.",
    url: "/economics/sarb",
  },
  {
    id: "e2",
    type: "economics",
    title: "Central Bank of Nigeria (CBN)",
    subtitle: "Central Bank • Monetary Policy",
    description: "Coverage of Nigeria's monetary policy and central bank initiatives.",
    url: "/economics/cbn",
  },
  // Indices
  {
    id: "idx1",
    type: "index",
    title: "JSE Top 40",
    subtitle: "J200 • JSE",
    url: "/markets/indices/j200",
    meta: { value: 68234.56, change: 0.67 },
  },
  {
    id: "idx2",
    type: "index",
    title: "NGX All Share Index",
    subtitle: "NGXASI • NGX",
    url: "/markets/indices/ngxasi",
    meta: { value: 98456.23, change: -0.34 },
  },
];

const filters = {
  types: [
    { id: "all", label: "All Results" },
    { id: "article", label: "Insights" },
    { id: "industry", label: "Industries" },
    { id: "topic", label: "Topics" },
    { id: "region", label: "Regions" },
    { id: "research", label: "Research" },
    { id: "company", label: "Companies" },
    { id: "person", label: "People" },
    { id: "index", label: "Indices" },
    { id: "podcast", label: "Podcasts" },
    { id: "economics", label: "Economics" },
  ],
  timeRange: [
    { id: "any", label: "Any time" },
    { id: "day", label: "Past 24 hours" },
    { id: "week", label: "Past week" },
    { id: "month", label: "Past month" },
    { id: "year", label: "Past year" },
  ],
  sortBy: [
    { id: "relevance", label: "Relevance" },
    { id: "date", label: "Date" },
    { id: "popularity", label: "Popularity" },
  ],
};

function getTypeIcon(type: SearchResult["type"]) {
  switch (type) {
    case "article":
      return <Newspaper className="h-4 w-4 text-brand-orange" />;
    case "company":
      return <Building2 className="h-4 w-4 text-blue-400" />;
    case "person":
      return <CircleUserRound className="h-4 w-4 text-purple-400" />;
    case "index":
      return <TrendingUp className="h-4 w-4 text-market-up" />;
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
    default:
      return <Search className="h-4 w-4" />;
  }
}

function getTypeLabel(type: SearchResult["type"]) {
  const labels: Record<string, string> = {
    article: "Insight",
    company: "Company",
    person: "Person",
    index: "Index",
    industry: "Industry",
    region: "Region",
    topic: "Topic",
    research: "Research",
    podcast: "Podcast",
    economics: "Economics",
  };
  return labels[type] || type;
}

// Quick browse categories when no search is active
const browseCategories = [
  { label: "Industries", href: "/industries", icon: Factory, color: "text-amber-400" },
  { label: "Topics", href: "/topics", icon: Tag, color: "text-cyan-400" },
  { label: "Regions", href: "/regions", icon: Globe, color: "text-emerald-400" },
  { label: "Research", href: "/research", icon: FileText, color: "text-violet-400" },
  { label: "Podcasts", href: "/podcasts", icon: Mic, color: "text-rose-400" },
  { label: "Markets", href: "/markets", icon: TrendingUp, color: "text-green-400" },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTime, setSelectedTime] = useState("any");
  const [selectedSort, setSelectedSort] = useState("relevance");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [query, selectedType, selectedTime, selectedSort]);

  const performSearch = () => {
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      const filtered = mockResults.filter((result) => {
        const matchesQuery =
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          result.description?.toLowerCase().includes(query.toLowerCase());
        const matchesType = selectedType === "all" || result.type === selectedType;
        return matchesQuery && matchesType;
      });
      setResults(query ? filtered : []);
      setIsSearching(false);
    }, 300);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  // Count results by type
  const typeCounts = mockResults.reduce((acc, result) => {
    if (
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      result.description?.toLowerCase().includes(query.toLowerCase())
    ) {
      acc[result.type] = (acc[result.type] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Search</span>
      </nav>

      {/* Search Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground mb-6">
          Search across all insights, research, industries, topics, and regions
        </p>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search insights, industries, topics, regions, research..."
              className="w-full pl-12 pr-4 py-3 bg-terminal-bg-secondary border border-terminal-border rounded-lg text-lg focus:outline-none focus:border-primary"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filters - only show when there's a query */}
      {query && (
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-terminal-border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.types
              .filter((type) => type.id === "all" || (typeCounts[type.id] || 0) > 0)
              .map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full transition-colors",
                    selectedType === type.id
                      ? "bg-primary text-white"
                      : "bg-terminal-bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {type.label}
                  {query && (
                    <span className="ml-1 text-xs opacity-70">
                      ({type.id === "all" ? typeCounts.all || 0 : typeCounts[type.id] || 0})
                    </span>
                  )}
                </button>
              ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="px-3 py-1.5 bg-terminal-bg-secondary border border-terminal-border rounded text-sm focus:outline-none focus:border-primary"
            >
              {filters.timeRange.map((time) => (
                <option key={time.id} value={time.id}>
                  {time.label}
                </option>
              ))}
            </select>

            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-3 py-1.5 bg-terminal-bg-secondary border border-terminal-border rounded text-sm focus:outline-none focus:border-primary"
            >
              {filters.sortBy.map((sort) => (
                <option key={sort.id} value={sort.id}>
                  Sort: {sort.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      {isSearching ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Searching...</p>
        </div>
      ) : query && results.length === 0 ? (
        <div className="text-center py-12 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No results found</h3>
          <p className="text-muted-foreground mb-6">
            No results found for &quot;{query}&quot;. Try different keywords.
          </p>
          <p className="text-sm text-muted-foreground">Or browse by category:</p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {browseCategories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="flex items-center gap-2 px-4 py-2 bg-terminal-bg rounded-lg border border-terminal-border hover:border-primary/50 transition-colors"
              >
                <cat.icon className={cn("h-4 w-4", cat.color)} />
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : query ? (
        <>
          <p className="text-sm text-muted-foreground mb-6">
            Found {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
          </p>

          <div className="space-y-4">
            {results.map((result) => (
              <Link
                key={result.id}
                href={result.url}
                className="group block bg-terminal-bg-secondary rounded-lg border border-terminal-border p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex gap-4">
                  {result.image && result.type === "article" && (
                    <div className="relative w-48 h-28 rounded overflow-hidden flex-shrink-0 hidden md:block">
                      <Image
                        src={result.image}
                        alt={result.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(result.type)}
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <h3 className="font-serif font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {result.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {result.subtitle}
                    </p>
                    {result.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.description}
                      </p>
                    )}
                    {result.meta && result.type === "company" && (
                      <div className="flex items-center gap-4 mt-3">
                        <span className="font-mono">
                          {result.meta.price?.toFixed(2)}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1 text-sm",
                            result.meta.change >= 0
                              ? "text-market-up"
                              : "text-market-down"
                          )}
                        >
                          {result.meta.change >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {result.meta.change >= 0 ? "+" : ""}
                          {result.meta.change?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                    {result.meta && result.type === "index" && (
                      <div className="flex items-center gap-4 mt-3">
                        <span className="font-mono">
                          {result.meta.value?.toLocaleString()}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1 text-sm",
                            result.meta.change >= 0
                              ? "text-market-up"
                              : "text-market-down"
                          )}
                        >
                          {result.meta.change >= 0 ? "+" : ""}
                          {result.meta.change?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        /* Empty state - Browse categories */
        <div className="py-8">
          <div className="text-center mb-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-serif text-xl font-medium mb-2">Search African Finance Insights</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Find insights, research reports, industry analysis, regional coverage, and more across our comprehensive African finance database.
            </p>
          </div>

          <div className="mb-12">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Browse by Category
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {browseCategories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="group flex flex-col items-center gap-3 p-6 bg-terminal-bg-secondary rounded-lg border border-terminal-border hover:border-primary/50 transition-all text-center"
                >
                  <cat.icon className={cn("h-8 w-8", cat.color)} />
                  <span className="font-medium group-hover:text-primary transition-colors">
                    {cat.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Popular searches */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Popular Searches
            </h4>
            <div className="flex flex-wrap gap-2">
              {["Banking sector", "SARB", "Fintech", "Mining", "East Africa", "Central banks", "AfCFTA", "ESG investing"].map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-4 py-2 bg-terminal-bg-secondary rounded-full border border-terminal-border hover:border-primary/50 text-sm transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
      <div className="mb-8">
        <div className="h-8 w-32 bg-terminal-bg-secondary rounded animate-pulse mb-4" />
        <div className="flex gap-4">
          <div className="relative flex-1">
            <div className="w-full h-12 bg-terminal-bg-secondary border border-terminal-border rounded-lg animate-pulse" />
          </div>
          <div className="w-24 h-12 bg-terminal-bg-secondary rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <MainLayout>
      <Suspense fallback={<SearchLoading />}>
        <SearchContent />
      </Suspense>
    </MainLayout>
  );
}
