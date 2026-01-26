"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  ChevronRight,
  Filter,
  Search,
  TrendingUp,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: string;
  imageUrl?: string;
  url: string;
  isBreaking?: boolean;
  isPremium?: boolean;
}

const categories = [
  { id: "all", label: "All News" },
  { id: "markets", label: "Markets" },
  { id: "companies", label: "Companies" },
  { id: "economy", label: "Economy" },
  { id: "politics", label: "Politics" },
  { id: "commodities", label: "Commodities" },
  { id: "forex", label: "Forex" },
  { id: "technology", label: "Technology" },
];

const newsArticles: NewsArticle[] = [
  {
    id: "1",
    title: "JSE All Share Index Hits Record High Amid Strong Commodity Prices",
    excerpt: "South African equities surge as mining stocks rally on the back of rising gold and platinum prices, pushing the benchmark index to unprecedented levels.",
    category: "Markets",
    author: "Michael Sobukwe",
    publishedAt: "2 hours ago",
    readTime: "5 min",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    url: "/news/jse-record-high",
    isBreaking: true,
  },
  {
    id: "2",
    title: "Central Bank of Nigeria Holds Rates Steady at 27.25%",
    excerpt: "The Monetary Policy Committee maintains benchmark interest rate as inflation remains elevated, signaling continued tight monetary policy stance.",
    category: "Economy",
    author: "Amara Okonkwo",
    publishedAt: "4 hours ago",
    readTime: "4 min",
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=400&fit=crop",
    url: "/news/cbn-rates-decision",
  },
  {
    id: "3",
    title: "Naspers Announces R10bn Share Buyback Programme",
    excerpt: "Africa's largest company by market cap unveils aggressive capital return strategy as management seeks to address persistent discount to NAV.",
    category: "Companies",
    author: "Johan van der Berg",
    publishedAt: "5 hours ago",
    readTime: "6 min",
    url: "/news/naspers-buyback",
    isPremium: true,
  },
  {
    id: "4",
    title: "MTN Group Reports Strong Q3 Revenue Growth in Nigerian Market",
    excerpt: "Telecom giant sees 15% year-on-year increase in data revenue as mobile money services expand across the continent.",
    category: "Companies",
    author: "Sarah Moyo",
    publishedAt: "6 hours ago",
    readTime: "4 min",
    url: "/news/mtn-q3-results",
  },
  {
    id: "5",
    title: "Egyptian Pound Stabilizes Following IMF Loan Approval",
    excerpt: "Currency finds support after international monetary fund approves additional financing tranche worth $3 billion.",
    category: "Forex",
    author: "Ahmed Hassan",
    publishedAt: "7 hours ago",
    readTime: "3 min",
    imageUrl: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&h=400&fit=crop",
    url: "/news/egypt-imf-loan",
  },
  {
    id: "6",
    title: "Dangote Cement Expands Operations Across West Africa",
    excerpt: "Nigerian cement manufacturer opens new plants in Ghana and Senegal as regional demand grows.",
    category: "Companies",
    author: "Chidi Eze",
    publishedAt: "8 hours ago",
    readTime: "5 min",
    url: "/news/dangote-expansion",
  },
  {
    id: "7",
    title: "South African Reserve Bank Signals Potential Rate Cut",
    excerpt: "Governor hints at monetary easing as inflation approaches target range of 3-6 percent.",
    category: "Economy",
    author: "Thabo Molefe",
    publishedAt: "9 hours ago",
    readTime: "4 min",
    url: "/news/sarb-rate-outlook",
  },
  {
    id: "8",
    title: "Gold Prices Rally to Six-Month High on Dollar Weakness",
    excerpt: "Precious metal breaks through key resistance as investors seek safe haven assets.",
    category: "Commodities",
    author: "Peter van Zyl",
    publishedAt: "10 hours ago",
    readTime: "3 min",
    imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&h=400&fit=crop",
    url: "/news/gold-rally",
  },
];

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <Link href={article.url} className="group block">
      <article className="flex gap-4 p-4 rounded-lg hover:bg-terminal-bg-elevated transition-colors">
        {article.imageUrl && (
          <div className="relative w-32 h-24 flex-shrink-0 overflow-hidden rounded bg-terminal-bg-secondary">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">
              {article.category}
            </span>
            {article.isBreaking && (
              <span className="px-1.5 py-0.5 bg-market-down text-white text-[10px] font-semibold rounded">
                BREAKING
              </span>
            )}
            {article.isPremium && (
              <span className="px-1.5 py-0.5 bg-brand-orange/20 text-brand-orange text-[10px] font-semibold rounded">
                PREMIUM
              </span>
            )}
          </div>
          <h3 className="font-semibold mb-1 group-hover:text-brand-orange transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{article.author}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.publishedAt}
            </span>
            <span>{article.readTime} read</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function FeaturedArticle({ article }: { article: NewsArticle }) {
  return (
    <Link href={article.url} className="group block">
      <article className="relative overflow-hidden rounded-lg bg-terminal-bg-secondary">
        {article.imageUrl && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            {article.isBreaking && (
              <span className="px-2 py-1 bg-market-down text-white text-xs font-semibold rounded">
                BREAKING
              </span>
            )}
            <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">
              {article.category}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-brand-orange transition-colors leading-tight">
            {article.title}
          </h2>
          <p className="text-white/80 mb-3 line-clamp-2">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span>{article.author}</span>
            <span>{article.publishedAt}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = newsArticles.filter((article) => {
    const matchesCategory =
      selectedCategory === "all" ||
      article.category.toLowerCase() === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticle = filteredArticles[0];
  const remainingArticles = filteredArticles.slice(1);

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">News</h1>
            <p className="text-muted-foreground">
              Latest financial news and market updates from Africa and beyond
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
                selectedCategory === category.id
                  ? "bg-brand-orange text-white"
                  : "bg-terminal-bg-elevated text-muted-foreground hover:text-foreground"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Featured */}
            {featuredArticle && <FeaturedArticle article={featuredArticle} />}

            {/* Article List */}
            <div className="space-y-2">
              {remainingArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Load More */}
            <div className="text-center pt-4">
              <button className="px-6 py-2 border border-terminal-border rounded-md text-sm font-medium hover:bg-terminal-bg-elevated transition-colors">
                Load More Articles
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Trending */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="font-bold flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-brand-orange" />
                Trending
              </h2>
              <div className="space-y-3">
                {newsArticles.slice(0, 5).map((article, index) => (
                  <Link
                    key={article.id}
                    href={article.url}
                    className="flex gap-3 group"
                  >
                    <span className="text-2xl font-bold text-muted-foreground/50 w-6">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-medium group-hover:text-brand-orange transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {article.publishedAt}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Newsletter */}
            <section className="p-4 rounded-lg bg-terminal-bg-elevated border border-brand-orange/30">
              <h3 className="font-bold mb-2">Stay Informed</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get breaking news alerts and daily market summaries delivered to your inbox.
              </p>
              <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 text-sm bg-terminal-bg border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-md hover:bg-brand-orange-dark transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </section>

            {/* Topics */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="font-bold mb-4">Popular Topics</h2>
              <div className="flex flex-wrap gap-2">
                {["JSE", "Naspers", "MTN", "Gold", "Rand", "Oil", "Banking", "Mining", "Nigeria", "Kenya"].map(
                  (topic) => (
                    <Link
                      key={topic}
                      href={`/news?topic=${topic.toLowerCase()}`}
                      className="px-3 py-1 text-sm bg-terminal-bg-elevated rounded-full hover:bg-brand-orange hover:text-white transition-colors"
                    >
                      {topic}
                    </Link>
                  )
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
