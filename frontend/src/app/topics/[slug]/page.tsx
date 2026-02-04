"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/loading";
import apiClient from "@/services/api/client";

// Topic data - expandable as needed
const topicData: Record<string, {
  name: string;
  description: string;
  relatedTopics: { name: string; slug: string }[];
  relatedIndustries: { name: string; slug: string }[];
}> = {
  "central-banks": {
    name: "Central Banks",
    description: "Analysis of monetary policy decisions, interest rate movements, and central bank communications across Africa and globally.",
    relatedTopics: [
      { name: "Interest Rates", slug: "interest-rates" },
      { name: "Inflation", slug: "inflation" },
      { name: "Currency Policy", slug: "currency-policy" },
    ],
    relatedIndustries: [
      { name: "Banking & Finance", slug: "banking" },
    ],
  },
  "interest-rates": {
    name: "Interest Rates",
    description: "Tracking policy rate decisions, lending rates, and their impact on markets and economies across the continent.",
    relatedTopics: [
      { name: "Central Banks", slug: "central-banks" },
      { name: "Inflation", slug: "inflation" },
      { name: "Bond Markets", slug: "bond-markets" },
    ],
    relatedIndustries: [
      { name: "Banking & Finance", slug: "banking" },
    ],
  },
  fintech: {
    name: "Fintech",
    description: "The digital transformation of financial services in Africa - mobile money, digital lending, neobanks, and payment innovation.",
    relatedTopics: [
      { name: "Digital Payments", slug: "digital-payments" },
      { name: "Mobile Money", slug: "mobile-money" },
      { name: "Startups", slug: "startups" },
    ],
    relatedIndustries: [
      { name: "Banking & Finance", slug: "banking" },
      { name: "Technology", slug: "technology" },
    ],
  },
  startups: {
    name: "Startups",
    description: "Africa's burgeoning startup ecosystem - funding rounds, exits, ecosystem development, and venture capital trends.",
    relatedTopics: [
      { name: "Venture Capital", slug: "venture-capital" },
      { name: "Fintech", slug: "fintech" },
      { name: "Innovation", slug: "innovation" },
    ],
    relatedIndustries: [
      { name: "Technology", slug: "technology" },
    ],
  },
  "trade-policy": {
    name: "Trade Policy",
    description: "African continental free trade, bilateral agreements, tariffs, and trade relations shaping the continent's economic future.",
    relatedTopics: [
      { name: "AfCFTA", slug: "afcfta" },
      { name: "Exports", slug: "exports" },
      { name: "Customs", slug: "customs" },
    ],
    relatedIndustries: [
      { name: "Global Markets", slug: "global" },
    ],
  },
  "foreign-direct-investment": {
    name: "Foreign Direct Investment",
    description: "Tracking investment flows into Africa - trends, source countries, sectors, and the policy environment shaping FDI.",
    relatedTopics: [
      { name: "Trade Policy", slug: "trade-policy" },
      { name: "Economic Policy", slug: "economic-policy" },
    ],
    relatedIndustries: [
      { name: "Global Markets", slug: "global" },
    ],
  },
  geopolitics: {
    name: "Geopolitics",
    description: "How global political dynamics, international relations, and strategic competition impact African markets and economies.",
    relatedTopics: [
      { name: "Trade Policy", slug: "trade-policy" },
      { name: "Sanctions", slug: "sanctions" },
    ],
    relatedIndustries: [
      { name: "Global Markets", slug: "global" },
    ],
  },
  energy: {
    name: "Energy",
    description: "Africa's energy sector - oil & gas, renewables, electricity generation, and the transition to sustainable power.",
    relatedTopics: [
      { name: "Oil & Gas", slug: "oil-gas" },
      { name: "Renewables", slug: "renewables" },
      { name: "Power Generation", slug: "power-generation" },
    ],
    relatedIndustries: [
      { name: "Infrastructure", slug: "infrastructure" },
      { name: "Mining & Resources", slug: "mining" },
    ],
  },
  sustainability: {
    name: "Sustainability",
    description: "ESG investing, climate finance, sustainable development, and Africa's green transition across industries.",
    relatedTopics: [
      { name: "Climate", slug: "climate" },
      { name: "Green Finance", slug: "green-finance" },
      { name: "ESG", slug: "esg" },
    ],
    relatedIndustries: [
      { name: "Banking & Finance", slug: "banking" },
      { name: "Infrastructure", slug: "infrastructure" },
    ],
  },
  inflation: {
    name: "Inflation",
    description: "Consumer and producer price trends, cost of living, and inflation dynamics across African economies.",
    relatedTopics: [
      { name: "Central Banks", slug: "central-banks" },
      { name: "Interest Rates", slug: "interest-rates" },
      { name: "Currency", slug: "currency" },
    ],
    relatedIndustries: [
      { name: "Banking & Finance", slug: "banking" },
    ],
  },
  gold: {
    name: "Gold",
    description: "Gold mining, prices, and the role of gold in African economies from Ghana to South Africa.",
    relatedTopics: [
      { name: "Commodities", slug: "commodities" },
      { name: "Mining", slug: "mining" },
    ],
    relatedIndustries: [
      { name: "Mining & Resources", slug: "mining" },
    ],
  },
  commodities: {
    name: "Commodities",
    description: "Commodity markets, prices, and Africa's role in global supply chains for minerals, agriculture, and energy.",
    relatedTopics: [
      { name: "Gold", slug: "gold" },
      { name: "Oil & Gas", slug: "oil-gas" },
      { name: "Agricultural Commodities", slug: "agricultural-commodities" },
    ],
    relatedIndustries: [
      { name: "Mining & Resources", slug: "mining" },
      { name: "Agriculture", slug: "agriculture" },
    ],
  },
};

// Generate a default topic for unknown slugs
function getDefaultTopic(slug: string): typeof topicData[string] {
  const name = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return {
    name,
    description: `Analysis and insights on ${name.toLowerCase()} across African markets and economies.`,
    relatedTopics: [],
    relatedIndustries: [],
  };
}

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

export default function TopicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const topic = topicData[slug] || getDefaultTopic(slug);

  useEffect(() => {
    if (!slug) return;

    const fetchArticles = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/news/articles/", {
          params: { limit: 12 },
        });
        setArticles(response.data.results || []);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [slug]);

  const featuredArticle = articles[0];
  const gridArticles = articles.slice(1, 7);
  const moreArticles = articles.slice(7);

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/topics" className="hover:text-foreground">Topics</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary">{topic.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="headline-xl mb-4">{topic.name}</h1>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            {topic.description}
          </p>
        </header>

        {/* Related Topics */}
        {topic.relatedTopics.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {topic.relatedTopics.map((t) => (
              <Link
                key={t.slug}
                href={`/topics/${t.slug}`}
                className="topic-tag"
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}

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
                <h2 className="headline text-xl mb-6">More on {topic.name}</h2>
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
            <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="headline text-lg mb-2">{topic.name} Updates</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get the latest insights on {topic.name.toLowerCase()} delivered weekly.
              </p>
              <Link
                href="/subscribe"
                className="btn-primary w-full text-center block"
              >
                Subscribe
              </Link>
            </div>

            {/* Related Industries */}
            {topic.relatedIndustries.length > 0 && (
              <div className="p-6 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
                <h3 className="label-uppercase mb-4">Related Industries</h3>
                <div className="space-y-2">
                  {topic.relatedIndustries.map((industry) => (
                    <Link
                      key={industry.slug}
                      href={`/industries/${industry.slug}`}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-terminal-bg-elevated transition-colors"
                    >
                      <span className="text-sm font-medium">{industry.name}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Browse Topics */}
            <div className="p-6 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h3 className="label-uppercase mb-4">Browse Topics</h3>
              <Link
                href="/topics"
                className="text-sm text-primary hover:underline"
              >
                View all topics →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
