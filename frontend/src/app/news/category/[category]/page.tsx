"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  Newspaper,
  Search,
  Clock,
  CircleUserRound,
  Zap,
  BarChart3,
  Building2,
  Landmark,
  Users,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  image: string;
  publishedAt: string;
  readTime: string;
  slug: string;
}

interface CategoryData {
  name: string;
  description: string;
  icon: React.ElementType;
  articles: Article[];
}

const categoryData: Record<string, CategoryData> = {
  breaking: {
    name: "Breaking News",
    description: "Latest developments and urgent market updates",
    icon: Zap,
    articles: [
      { id: "1", title: "JSE All Share Index Hits Record High Amid Global Rally", excerpt: "The Johannesburg Stock Exchange reached unprecedented levels today as global markets...", author: "Thabo Mokoena", category: "Breaking", image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop", publishedAt: "2025-01-24T14:30:00Z", readTime: "3 min", slug: "jse-record-high" },
      { id: "2", title: "SARB Announces Emergency Rate Decision Meeting", excerpt: "The South African Reserve Bank has called an unscheduled meeting of the Monetary Policy Committee...", author: "Amara Obi", category: "Breaking", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=400&fit=crop", publishedAt: "2025-01-24T12:00:00Z", readTime: "2 min", slug: "sarb-emergency-meeting" },
      { id: "3", title: "Major Mining Deal: Anglo American Receives Takeover Bid", excerpt: "In a surprise move, Anglo American has received a significant takeover approach...", author: "Sipho Ndaba", category: "Breaking", image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=600&h=400&fit=crop", publishedAt: "2025-01-24T10:15:00Z", readTime: "4 min", slug: "anglo-takeover-bid" },
    ],
  },
  markets: {
    name: "Market News",
    description: "Stock market coverage and trading updates",
    icon: BarChart3,
    articles: [
      { id: "1", title: "Top JSE Movers: Banking Stocks Lead the Charge", excerpt: "Financial sector stocks dominated today's session with Standard Bank and FirstRand...", author: "Thabo Mokoena", category: "Markets", image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop", publishedAt: "2025-01-24T17:00:00Z", readTime: "4 min", slug: "jse-banking-stocks" },
      { id: "2", title: "NGX Weekly Wrap: Oil & Gas Sector Outperforms", excerpt: "Nigerian stocks closed the week higher with energy companies posting strong gains...", author: "Chidi Okonkwo", category: "Markets", image: "https://images.unsplash.com/photo-1642543348745-f05b3d1f56d1?w=600&h=400&fit=crop", publishedAt: "2025-01-24T16:30:00Z", readTime: "5 min", slug: "ngx-weekly-wrap" },
      { id: "3", title: "African Markets Summary: Mixed Performance Across Exchanges", excerpt: "A divergent session across African markets as South Africa rallied while Egypt pulled back...", author: "Fatima Hassan", category: "Markets", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop", publishedAt: "2025-01-24T15:00:00Z", readTime: "6 min", slug: "african-markets-summary" },
    ],
  },
  companies: {
    name: "Company News",
    description: "Corporate updates and business developments",
    icon: Building2,
    articles: [
      { id: "1", title: "Naspers Announces Major Investment in African Fintech", excerpt: "The South African tech giant is expanding its fintech portfolio with a new strategic investment...", author: "Fatima Hassan", category: "Companies", image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop", publishedAt: "2025-01-24T11:00:00Z", readTime: "5 min", slug: "naspers-fintech-investment" },
      { id: "2", title: "MTN Reports Strong Q4 Subscriber Growth", excerpt: "Africa's largest mobile operator added 5 million new subscribers in the fourth quarter...", author: "Amara Obi", category: "Companies", image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&h=400&fit=crop", publishedAt: "2025-01-24T09:30:00Z", readTime: "4 min", slug: "mtn-subscriber-growth" },
      { id: "3", title: "Dangote Refinery Reaches Full Production Capacity", excerpt: "Nigeria's massive refinery project has achieved a major milestone in operations...", author: "Chidi Okonkwo", category: "Companies", image: "https://images.unsplash.com/photo-1581093458791-9f3c3250a8b0?w=600&h=400&fit=crop", publishedAt: "2025-01-23T14:00:00Z", readTime: "6 min", slug: "dangote-refinery-capacity" },
    ],
  },
  economy: {
    name: "Economy",
    description: "Economic developments and policy analysis",
    icon: Landmark,
    articles: [
      { id: "1", title: "South Africa GDP Growth Beats Expectations in Q4", excerpt: "The economy expanded faster than anticipated driven by mining and manufacturing sectors...", author: "Dr. Amara Okafor", category: "Economy", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=400&fit=crop", publishedAt: "2025-01-24T08:00:00Z", readTime: "7 min", slug: "sa-gdp-growth" },
      { id: "2", title: "Nigeria Inflation Slows for Third Consecutive Month", excerpt: "Consumer price increases continue to moderate as monetary policy measures take effect...", author: "Chidi Okonkwo", category: "Economy", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop", publishedAt: "2025-01-23T10:00:00Z", readTime: "5 min", slug: "nigeria-inflation-slowdown" },
      { id: "3", title: "Kenya Central Bank Holds Rates Amid Shilling Volatility", excerpt: "The MPC decided to maintain benchmark rates despite currency pressures...", author: "David Kamau", category: "Economy", image: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=600&h=400&fit=crop", publishedAt: "2025-01-22T15:00:00Z", readTime: "4 min", slug: "kenya-rates-hold" },
    ],
  },
  politics: {
    name: "Politics",
    description: "Policy and regulatory developments",
    icon: Users,
    articles: [
      { id: "1", title: "South Africa Budget Preview: What Investors Need to Know", excerpt: "Finance Minister set to deliver budget speech with focus on fiscal consolidation...", author: "Thabo Mokoena", category: "Politics", image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&h=400&fit=crop", publishedAt: "2025-01-24T07:00:00Z", readTime: "8 min", slug: "sa-budget-preview" },
      { id: "2", title: "Nigeria New Investment Code Attracts Foreign Capital", excerpt: "Recent regulatory reforms have increased FDI inflows significantly...", author: "Amara Obi", category: "Politics", image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&h=400&fit=crop", publishedAt: "2025-01-23T11:00:00Z", readTime: "5 min", slug: "nigeria-investment-code" },
    ],
  },
  technology: {
    name: "Technology",
    description: "Tech sector news and innovation",
    icon: Cpu,
    articles: [
      { id: "1", title: "African Tech Startups Raise Record $2.4 Billion in 2024", excerpt: "Venture capital funding into African tech reached new heights despite global slowdown...", author: "Fatima Hassan", category: "Technology", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop", publishedAt: "2025-01-24T09:00:00Z", readTime: "6 min", slug: "african-tech-funding-record" },
      { id: "2", title: "Flutterwave Expands into 10 New African Markets", excerpt: "The payments giant continues its continental expansion with new licensing deals...", author: "Fatima Hassan", category: "Technology", image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop", publishedAt: "2025-01-23T13:00:00Z", readTime: "4 min", slug: "flutterwave-expansion" },
      { id: "3", title: "South Africa's Digital ID System Goes Live", excerpt: "The government's new digital identity platform launches after years of development...", author: "Sipho Ndaba", category: "Technology", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop", publishedAt: "2025-01-22T10:00:00Z", readTime: "5 min", slug: "sa-digital-id-launch" },
    ],
  },
};

export default function NewsCategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const category = categoryData[categorySlug];

  const [searchQuery, setSearchQuery] = useState("");

  if (!category) {
    return (
      <MainLayout>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12 text-center">
          <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The news category you're looking for doesn't exist.
          </p>
          <Link
            href="/news"
            className="px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors inline-block"
          >
            View All News
          </Link>
        </div>
      </MainLayout>
    );
  }

  const Icon = category.icon;

  const filteredArticles = category.articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/news" className="hover:text-foreground">News</Link>
              <span>/</span>
              <span>{category.name}</span>
            </div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Icon className="h-6 w-6 text-brand-orange" />
              {category.name}
            </h1>
            <p className="text-muted-foreground">{category.description}</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <Link key={article.id} href={`/news/${article.slug}`}>
              <article className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors h-full flex flex-col">
                <div className="relative aspect-video">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <span className="text-xs text-brand-orange font-medium">{article.category}</span>
                  <h3 className="font-semibold mt-1 mb-2 line-clamp-2 hover:text-brand-orange transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CircleUserRound className="h-3 w-3" />
                      {article.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No articles found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
