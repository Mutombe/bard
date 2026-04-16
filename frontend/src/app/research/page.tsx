"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  DownloadSimple,
  Lock,
  Calendar,
  User,
  TrendUp,
  Buildings,
  Globe,
  MagnifyingGlass,
  CaretRight,
  BookOpen,
  ChartBar,
  Briefcase,
  ArrowRight,
  Clock,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAppSelector } from "@/store";
import { useResearchReports, useTopics, useIndustries } from "@/hooks";
import type { ResearchReport, Topic, Industry } from "@/services/api/research";

// Helper functions
function formatDate(dateString?: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getReportTypeIcon(type?: string) {
  switch (type) {
    case "whitepaper":
      return <FileText className="h-4 w-4" />;
    case "analysis":
      return <TrendUp className="h-4 w-4" />;
    case "outlook":
      return <Globe className="h-4 w-4" />;
    case "country":
      return <Buildings className="h-4 w-4" />;
    default:
      return <ChartBar className="h-4 w-4" />;
  }
}

function getReportTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    whitepaper: "Whitepaper",
    analysis: "Market Analysis",
    outlook: "Sector Outlook",
    country: "Country Report",
    quarterly: "Quarterly Review",
    annual: "Annual Report",
    special: "Special Report",
  };
  return labels[type || ""] || "Research";
}

// Skeleton Components
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-terminal-bg-elevated rounded", className)} />;
}

function ReportCardSkeleton() {
  return (
    <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
      <Skeleton className="aspect-[16/10]" />
      <div className="p-5">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

// Featured Report Card with Overlay
function FeaturedReport({ report }: { report: ResearchReport }) {
  const imageUrl = report.image_url || report.cover_image || report.cover_image_url;

  return (
    <Link href={`/research/${report.slug}`} className="group block">
      <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 relative aspect-video md:aspect-auto md:min-h-[350px]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={report.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <FileText className="h-20 w-20 text-primary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          </div>
          <div className="md:w-1/2 p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <span className="label-uppercase text-primary flex items-center gap-1">
                {getReportTypeIcon(report.report_type)}
                {getReportTypeLabel(report.report_type)}
              </span>
              {report.is_premium && (
                <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Premium
                </span>
              )}
            </div>
            <h2 className="headline text-2xl mb-4 group-hover:text-primary transition-colors">
              {report.title}
            </h2>
            {report.subtitle && (
              <p className="text-muted-foreground mb-4">{report.subtitle}</p>
            )}
            <p className="text-muted-foreground mb-6 line-clamp-3">
              {report.abstract}
            </p>
            <div className="flex items-center gap-4 mb-6">
              <div>
                <div className="font-medium text-sm">
                  {report.lead_author?.full_name || "BGFI Research"}
                </div>
                {report.topics && report.topics.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {report.topics.map(t => t.name).join(", ")}
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDate(report.published_at)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="btn-primary flex items-center gap-2">
                <DownloadSimple className="h-4 w-4" />
                Download Report
              </span>
              {report.read_time_minutes && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {report.read_time_minutes} min read
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Report Card with Overlay Image
function ReportCard({ report }: { report: ResearchReport }) {
  const imageUrl = report.image_url || report.cover_image || report.cover_image_url;

  return (
    <Link href={`/research/${report.slug}`} className="group block h-full">
      <div className="h-full bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-primary/50 transition-colors">
        <div className="relative aspect-[16/10]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={report.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <FileText className="h-12 w-12 text-primary/30" />
            </div>
          )}
          {/* Overlay with category */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="px-2 py-1 rounded text-xs font-medium bg-white/90 text-gray-900 flex items-center gap-1 w-fit">
              {getReportTypeIcon(report.report_type)}
              {getReportTypeLabel(report.report_type)}
            </span>
          </div>
          {report.is_premium && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 rounded text-xs font-medium bg-primary text-primary-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Premium
              </span>
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="headline text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {report.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {report.abstract}
          </p>

          {report.topics && report.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {report.topics.slice(0, 3).map((topic) => (
                <span
                  key={topic.id}
                  className="px-2 py-0.5 text-xs font-mono bg-terminal-bg-elevated rounded"
                >
                  {topic.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>{report.lead_author?.full_name || "BGFI"}</span>
            <span>{formatDate(report.published_at)}</span>
          </div>

          <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium">
            <DownloadSimple className="h-4 w-4" />
            Download PDF
          </div>
        </div>
      </div>
    </Link>
  );
}

// Category filter categories
const categories = [
  { id: "all", label: "All Research", icon: BookOpen },
  { id: "whitepaper", label: "Whitepapers", icon: FileText },
  { id: "analysis", label: "Market Analysis", icon: TrendUp },
  { id: "outlook", label: "Sector Outlook", icon: Buildings },
  { id: "country", label: "Country Reports", icon: Globe },
  { id: "quarterly", label: "Quarterly", icon: Briefcase },
];

export default function ResearchPage() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isPremiumUser = user?.subscription_tier === "professional" || user?.subscription_tier === "enterprise";

  // Fetch data from API
  const { data: reportsData, isLoading, error, mutate } = useResearchReports({
    report_type: selectedCategory !== "all" ? selectedCategory : undefined,
    search: searchQuery || undefined,
    page_size: 20,
  });
  const { data: topics } = useTopics();
  const { data: industries } = useIndustries();

  const reports = reportsData?.results || [];
  const featuredReport = reports.find(r => r.is_featured) || reports[0];
  const gridReports = reports.filter(r => r.id !== featuredReport?.id);

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <CaretRight className="h-4 w-4" />
          <span className="text-primary">Research & Publications</span>
        </nav>

        {/* Header */}
        <header className="mb-10 max-w-3xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="headline-xl">Research & Publications</h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            In-depth research reports and analysis from the Bard Global Finance Institute.
            Our team of expert analysts provides actionable insights across African markets,
            sectors, and economies.
          </p>
        </header>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors",
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-terminal-bg-secondary text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Refresh button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => mutate()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowClockwise className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <>
            <section className="mb-12">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-[350px] rounded-lg" />
            </section>
            <section className="mb-12">
              <Skeleton className="h-6 w-40 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <ReportCardSkeleton key={i} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16 bg-terminal-bg-secondary rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="headline text-lg mb-2">Unable to Load Reports</h3>
            <p className="text-muted-foreground mb-4">
              Please try again later or check your connection.
            </p>
            <button onClick={() => mutate()} className="btn-primary">
              Retry
            </button>
          </div>
        )}

        {/* Featured Report */}
        {!isLoading && !error && featuredReport && (
          <section className="mb-12">
            <h2 className="label-uppercase mb-4">Featured Report</h2>
            <FeaturedReport report={featuredReport} />
          </section>
        )}

        {/* Reports Grid */}
        {!isLoading && !error && gridReports.length > 0 && (
          <section className="mb-12">
            <h2 className="headline text-xl mb-6">Latest Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </section>
        )}

        {/* No Results */}
        {!isLoading && !error && reports.length === 0 && (
          <div className="text-center py-16 bg-terminal-bg-secondary rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="headline text-lg mb-2">No reports found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

        {/* Topics & Industries */}
        {(topics && topics.length > 0) || (industries && industries.length > 0) ? (
          <section className="mt-12 pt-12 border-t border-terminal-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Topics */}
              {topics && topics.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Browse by Topic
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                      <Link
                        key={topic.id}
                        href={`/topics/${topic.slug}`}
                        className="px-3 py-1.5 text-sm bg-terminal-bg-secondary border border-terminal-border rounded-md hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        {topic.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Industries */}
              {industries && industries.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Browse by Industry
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {industries.map((industry) => (
                      <Link
                        key={industry.id}
                        href={`/industries/${industry.slug}`}
                        className="px-3 py-1.5 text-sm bg-terminal-bg-secondary border border-terminal-border rounded-md hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        {industry.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* Our Research Team */}
        <section className="mt-12 pt-12 border-t border-terminal-border">
          <h2 className="headline text-2xl mb-6">Our Research Team</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            BGFI&apos;s research is produced by an editorial team grounded in the African continent and supported by an advisory network of economists, public policy specialists, Chartered Financial Analysts, and banking professionals.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: "Shephard Mphambela", title: "CEO · Editor-in-Chief", focus: "Co-Founder" },
              { name: "Senziwani Sikhosana", title: "Chair of the Board", focus: "Co-Founder" },
              { name: "Mollen Chamisa", title: "Sub-Editor", focus: "Production · Research" },
              { name: "Farai Mabeza", title: "Research & Analysis", focus: "Markets" },
              { name: "Belinda Chiroodza", title: "Research & Analysis", focus: "Sectors" },
              { name: "Tinashe Kaduwo", title: "Research & Analysis", focus: "Economics" },
            ].map((person) => (
              <div key={person.name} className="text-center p-4 bg-terminal-bg-secondary border border-terminal-border">
                <div className="h-16 w-16 bg-brand-plum text-white mx-auto mb-3 flex items-center justify-center text-lg font-serif font-bold">
                  {person.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="font-semibold text-sm">{person.name}</div>
                <div className="text-xs text-brand-coral mt-0.5">{person.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{person.focus}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Subscribe CTA */}
        <section className="relative overflow-hidden mt-12 p-8 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <div className="absolute inset-0 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-[0.07] dark:opacity-[0.10]"><defs><pattern id="research-sub-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(355, 70%, 38%)" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#research-sub-grid)"/></svg></div>
          <BookOpen className="relative h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="headline text-2xl mb-4">Stay Updated on Research</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Get free alerts for new research reports, weekly digests, and analyst commentary
            delivered straight to your inbox.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/subscribe"
              className="btn-primary flex items-center gap-2"
            >
              Subscribe Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/newsletters/research"
              className="btn-secondary"
            >
              Research Alerts
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
