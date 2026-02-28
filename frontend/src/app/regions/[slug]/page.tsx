"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/loading";
import apiClient from "@/services/api/client";

// Region data
const regionData: Record<string, {
  name: string;
  description: string;
  countries: { name: string; code: string; exchange?: string }[];
}> = {
  "southern-africa": {
    name: "Southern Africa",
    description: "Economic analysis covering South Africa, Zimbabwe, Botswana, Namibia, Zambia, and other Southern African economies. Home to the JSE, Africa's largest stock exchange, and key mining operations.",
    countries: [
      { name: "South Africa", code: "ZA", exchange: "JSE" },
      { name: "Zimbabwe", code: "ZW", exchange: "ZSE" },
      { name: "Botswana", code: "BW", exchange: "BSE" },
      { name: "Namibia", code: "NA", exchange: "NSX" },
      { name: "Zambia", code: "ZM", exchange: "LuSE" },
      { name: "Mozambique", code: "MZ", exchange: "BVM" },
      { name: "Mauritius", code: "MU", exchange: "SEM" },
    ],
  },
  "east-africa": {
    name: "East Africa",
    description: "Coverage of Kenya, Tanzania, Uganda, Rwanda, and the East African Community. A rapidly growing region with strong tech ecosystems and infrastructure development.",
    countries: [
      { name: "Kenya", code: "KE", exchange: "NSE" },
      { name: "Tanzania", code: "TZ", exchange: "DSE" },
      { name: "Uganda", code: "UG", exchange: "USE" },
      { name: "Rwanda", code: "RW", exchange: "RSE" },
      { name: "Ethiopia", code: "ET" },
    ],
  },
  "west-africa": {
    name: "West Africa",
    description: "Analysis of Nigeria, Ghana, Côte d'Ivoire, Senegal, and ECOWAS economies. Home to Africa's largest economy and key oil & gas production.",
    countries: [
      { name: "Nigeria", code: "NG", exchange: "NGX" },
      { name: "Ghana", code: "GH", exchange: "GSE" },
      { name: "Côte d'Ivoire", code: "CI", exchange: "BRVM" },
      { name: "Senegal", code: "SN", exchange: "BRVM" },
      { name: "Cameroon", code: "CM", exchange: "DSX" },
    ],
  },
  "north-africa": {
    name: "North Africa",
    description: "Economic insights on Egypt, Morocco, Tunisia, Algeria, and Libya. A strategically important region connecting Africa with Europe and the Middle East.",
    countries: [
      { name: "Egypt", code: "EG", exchange: "EGX" },
      { name: "Morocco", code: "MA", exchange: "CSE" },
      { name: "Tunisia", code: "TN", exchange: "BVMT" },
      { name: "Algeria", code: "DZ", exchange: "SGBV" },
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

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/news/${article.slug}`} className="group block">
      {article.featured_image && (
        <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-4 bg-terminal-bg-elevated">
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
      <h3 className="headline text-lg mt-2 group-hover:text-primary transition-colors line-clamp-2">
        {article.title}
      </h3>
      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
        <span>{formatDate(article.published_at)}</span>
      </div>
    </Link>
  );
}

function ArticleSkeleton() {
  return (
    <div className="animate-pulse">
      <Skeleton className="aspect-[16/10] rounded-lg mb-4" />
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-4 w-32 mt-3" />
    </div>
  );
}

export default function RegionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const region = regionData[slug];

  useEffect(() => {
    if (!slug) return;

    const fetchArticles = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/news/articles/", {
          params: { limit: 9 },
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

  if (!region) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="headline-lg mb-4">Region Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The region you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/regions" className="text-primary hover:underline">
            View all regions
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/regions" className="hover:text-foreground">Regions</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary">{region.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-8 w-8 text-primary" />
            <h1 className="headline-xl">{region.name}</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            {region.description}
          </p>
        </header>

        {/* Countries */}
        <div className="flex flex-wrap gap-2 mb-10">
          {region.countries.map((country) => (
            <Link
              key={country.code}
              href={`/countries/${country.code.toLowerCase()}`}
              className="topic-tag"
            >
              {country.name}
              {country.exchange && (
                <span className="text-xs text-muted-foreground ml-1">({country.exchange})</span>
              )}
            </Link>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h2 className="headline text-xl mb-6">Latest from {region.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <ArticleSkeleton key={i} />
                ))
              ) : (
                articles.slice(0, 6).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Newsletter */}
            <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="headline text-lg mb-2">{region.name} Brief</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Weekly insights on {region.name.toLowerCase()} markets and economies.
              </p>
              <Link
                href="/subscribe"
                className="btn-primary w-full text-center block"
              >
                Subscribe
              </Link>
            </div>

            {/* Other Regions */}
            <div className="p-6 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h3 className="label-uppercase mb-4">All Regions</h3>
              <div className="space-y-2">
                {Object.entries(regionData).map(([key, data]) => (
                  <Link
                    key={key}
                    href={`/regions/${key}`}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md transition-colors",
                      key === slug
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-terminal-bg-elevated"
                    )}
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">{data.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
