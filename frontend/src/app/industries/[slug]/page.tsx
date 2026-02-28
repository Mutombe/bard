"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Clock,
  ArrowRight,
  Building2,
  Landmark,
  Pickaxe,
  Cpu,
  Wheat,
  Globe,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/loading";
import apiClient from "@/services/api/client";

// Industry data
const industryData: Record<string, {
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  categories: string[];
  relatedTopics: { name: string; slug: string }[];
}> = {
  banking: {
    name: "Banking & Finance",
    description: "Analysis and insights on African banking sectors, financial services, fintech innovation, and monetary policy developments across the continent.",
    icon: Landmark,
    color: "text-blue-500",
    categories: ["banking", "finance", "fintech"],
    relatedTopics: [
      { name: "Central Banks", slug: "central-banks" },
      { name: "Interest Rates", slug: "interest-rates" },
      { name: "Fintech", slug: "fintech" },
      { name: "Insurance", slug: "insurance" },
    ],
  },
  mining: {
    name: "Mining & Resources",
    description: "Coverage of Africa's mining industry, commodity markets, natural resource development, and the transition to sustainable extraction.",
    icon: Pickaxe,
    color: "text-amber-500",
    categories: ["mining", "commodities", "resources"],
    relatedTopics: [
      { name: "Gold", slug: "gold" },
      { name: "Platinum", slug: "platinum" },
      { name: "Copper", slug: "copper" },
      { name: "Rare Earths", slug: "rare-earths" },
    ],
  },
  technology: {
    name: "Technology",
    description: "Exploring Africa's tech ecosystem, digital transformation, startup scene, and the continent's growing role in the global technology landscape.",
    icon: Cpu,
    color: "text-purple-500",
    categories: ["technology", "tech", "digital"],
    relatedTopics: [
      { name: "Startups", slug: "startups" },
      { name: "Digital Payments", slug: "digital-payments" },
      { name: "Telecommunications", slug: "telecommunications" },
      { name: "E-commerce", slug: "e-commerce" },
    ],
  },
  agriculture: {
    name: "Agriculture",
    description: "Insights on African agricultural markets, food security, agribusiness, and sustainable farming practices across diverse climates.",
    icon: Wheat,
    color: "text-green-500",
    categories: ["agriculture", "agribusiness", "food"],
    relatedTopics: [
      { name: "Food Security", slug: "food-security" },
      { name: "Commodities", slug: "commodities" },
      { name: "Climate", slug: "climate" },
      { name: "Supply Chains", slug: "supply-chains" },
    ],
  },
  infrastructure: {
    name: "Infrastructure",
    description: "Analysis of Africa's infrastructure development, construction, real estate, energy, and transportation sectors.",
    icon: Building2,
    color: "text-slate-500",
    categories: ["infrastructure", "construction", "real-estate", "energy"],
    relatedTopics: [
      { name: "Energy", slug: "energy" },
      { name: "Transport", slug: "transport" },
      { name: "Real Estate", slug: "real-estate" },
      { name: "PPPs", slug: "public-private-partnerships" },
    ],
  },
  global: {
    name: "Global Markets",
    description: "How global economic trends, international trade, and geopolitical developments impact African markets and economies.",
    icon: Globe,
    color: "text-cyan-500",
    categories: ["global", "international", "trade"],
    relatedTopics: [
      { name: "Trade Policy", slug: "trade-policy" },
      { name: "FDI", slug: "foreign-direct-investment" },
      { name: "Geopolitics", slug: "geopolitics" },
      { name: "Emerging Markets", slug: "emerging-markets" },
    ],
  },
};

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  category?: { name: string; slug: string };
  author?: { full_name: string };
  published_at?: string;
  read_time_minutes?: number;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <Link href={`/news/${article.slug}`} className="group block">
      {article.featured_image && (
        <div className={cn(
          "relative rounded-lg overflow-hidden mb-4 bg-terminal-bg-elevated",
          featured ? "aspect-[16/9]" : "aspect-[16/10]"
        )}>
          <Image
            src={article.featured_image}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        </div>
      )}
      <span className="label-uppercase text-primary">
        {article.category?.name || "Analysis"}
      </span>
      <h3 className={cn(
        "headline mt-2 group-hover:text-primary transition-colors line-clamp-3",
        featured ? "text-2xl" : "text-lg"
      )}>
        {article.title}
      </h3>
      {featured && (
        <p className="text-muted-foreground mt-2 line-clamp-2">
          {article.excerpt}
        </p>
      )}
      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
        <span>{article.author?.full_name || "Staff Writer"}</span>
        <span>·</span>
        <span>{formatDate(article.published_at)}</span>
      </div>
    </Link>
  );
}

function ArticleSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className="animate-pulse">
      <Skeleton className={cn("rounded-lg mb-4", featured ? "aspect-[16/9]" : "aspect-[16/10]")} />
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className={cn("w-full mb-2", featured ? "h-8" : "h-6")} />
      <Skeleton className="h-5 w-3/4" />
      {featured && <Skeleton className="h-4 w-full mt-2" />}
      <Skeleton className="h-4 w-32 mt-3" />
    </div>
  );
}

export default function IndustryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const industry = industryData[slug];

  useEffect(() => {
    if (!slug || !industry) return;

    const fetchArticles = async () => {
      setLoading(true);
      try {
        // Fetch articles matching industry categories
        // Pass the first category as the main filter, backend will match
        const response = await apiClient.get("/news/articles/", {
          params: {
            category: industry.categories[0], // Primary category filter
            page_size: 12,
          },
        });
        setArticles(response.data.results || []);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [slug, industry]);

  if (!industry) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="headline-lg mb-4">Industry Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The industry you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/" className="text-primary hover:underline">
            Return to homepage
          </Link>
        </div>
      </MainLayout>
    );
  }

  const IconComponent = industry.icon;
  const featuredArticle = articles[0];
  const gridArticles = articles.slice(1, 7);
  const moreArticles = articles.slice(7);

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/industries" className="hover:text-foreground">Industries</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary">{industry.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className={cn("p-3 rounded-lg bg-terminal-bg-elevated", industry.color)}>
              <IconComponent className="h-8 w-8" />
            </div>
            <h1 className="headline-xl">{industry.name}</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            {industry.description}
          </p>
        </header>

        {/* Related Topics */}
        <div className="flex flex-wrap gap-2 mb-10">
          {industry.relatedTopics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              className="topic-tag"
            >
              {topic.name}
            </Link>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Featured Article */}
            {loading ? (
              <ArticleSkeleton featured />
            ) : featuredArticle ? (
              <div className="mb-10">
                <ArticleCard article={featuredArticle} featured />
              </div>
            ) : null}

            {/* Article Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <ArticleSkeleton key={i} />
                ))
              ) : (
                gridArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))
              )}
            </div>

            {/* More Articles */}
            {moreArticles.length > 0 && (
              <section className="mt-12 pt-8 border-t border-terminal-border">
                <h2 className="headline text-xl mb-6">More in {industry.name}</h2>
                <div className="space-y-6">
                  {moreArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="flex gap-4 group"
                    >
                      {article.featured_image && (
                        <div className="relative w-24 h-24 rounded overflow-hidden flex-shrink-0 bg-terminal-bg-elevated">
                          <Image
                            src={article.featured_image}
                            alt={article.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(article.published_at)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Newsletter */}
            <div className="relative overflow-hidden p-6 rounded-lg bg-primary/5 border border-primary/20">
              <div className="absolute inset-0 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-[0.07] dark:opacity-[0.10]"><defs><pattern id="industry-sub-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(355, 70%, 38%)" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#industry-sub-grid)"/></svg></div>
              <h3 className="relative headline text-lg mb-2">{industry.name} Updates</h3>
              <p className="relative text-sm text-muted-foreground mb-4">
                Get the latest insights on {industry.name.toLowerCase()} delivered to your inbox.
              </p>
              <Link
                href="/subscribe"
                className="relative btn-primary w-full text-center block"
              >
                Subscribe
              </Link>
            </div>

            {/* All Industries */}
            <div className="p-6 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h3 className="label-uppercase mb-4">All Industries</h3>
              <div className="space-y-2">
                {Object.entries(industryData).map(([key, data]) => {
                  const Icon = data.icon;
                  return (
                    <Link
                      key={key}
                      href={`/industries/${key}`}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md transition-colors",
                        key === slug
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-terminal-bg-elevated"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", data.color)} />
                      <span className="text-sm font-medium">{data.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
