"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Download,
  Share2,
  Bookmark,
  Clock,
  Calendar,
  User,
  FileText,
  ArrowRight,
  CheckCircle,
  Lock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

// Mock research reports data
const researchReports: Record<string, any> = {
  "african-banking-outlook-2025": {
    id: "1",
    title: "African Banking Sector Outlook 2025",
    subtitle: "Comprehensive analysis of banking trends, digital transformation, and regulatory developments across key African markets",
    category: "Banking & Finance",
    date: "January 2025",
    quarter: "Q1 2025",
    readTime: "45 min read",
    pages: 86,
    isPremium: false,
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=600&fit=crop",
    abstract: `This comprehensive report examines the state of African banking in 2025, analyzing key trends shaping the industry across the continent's major economies. From digital transformation initiatives to regulatory developments, we provide actionable insights for investors, policymakers, and industry stakeholders.

The African banking sector continues its evolution, driven by technological innovation, changing consumer expectations, and regulatory reforms. This report synthesizes data from 15 major markets and interviews with over 50 industry executives to present a forward-looking analysis of opportunities and challenges.`,
    keyFindings: [
      "Digital banking adoption has increased 340% since 2020, with mobile-first strategies dominating",
      "Pan-African banking groups are expanding, with cross-border transactions growing 28% YoY",
      "Regulatory harmonization under AfCFTA is creating new opportunities for regional banking",
      "NPL ratios have stabilized at 5.2% continent-wide, down from 7.8% in 2022",
      "Fintech partnerships have become the primary growth strategy for 67% of traditional banks",
      "ESG-linked lending has grown to represent 12% of new corporate loan originations",
    ],
    tableOfContents: [
      { title: "Executive Summary", page: 1 },
      { title: "Macroeconomic Context", page: 8 },
      { title: "Digital Transformation Trends", page: 18 },
      { title: "Regional Analysis: Southern Africa", page: 32 },
      { title: "Regional Analysis: East Africa", page: 44 },
      { title: "Regional Analysis: West Africa", page: 56 },
      { title: "Regulatory Landscape", page: 68 },
      { title: "Investment Outlook & Recommendations", page: 76 },
      { title: "Appendices", page: 82 },
    ],
    methodology: `This report is based on a combination of quantitative and qualitative research methods:

**Data Sources:**
- Central bank publications from 15 African countries
- Annual reports from 42 major banking institutions
- Proprietary BGFI market data and surveys
- World Bank and IMF economic indicators

**Primary Research:**
- 52 executive interviews with C-suite banking leaders
- Survey of 1,200 banking customers across 8 countries
- Focus groups with fintech entrepreneurs and regulators

**Analysis Period:** January 2024 - December 2024`,
    authors: [
      {
        name: "Dr. Fatima Hassan",
        role: "Chief Economist",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop",
        bio: "Former Central Bank advisor with 20+ years in African financial markets",
      },
      {
        name: "Samuel Okonkwo",
        role: "Senior Banking Analyst",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
        bio: "Previously at Standard Bank's Research Division",
      },
    ],
    relatedReports: [
      { title: "Mobile Money Revolution in Africa", slug: "mobile-money-revolution", category: "Fintech" },
      { title: "ESG Investment Trends in Africa", slug: "esg-investment-trends", category: "Sustainable Finance" },
      { title: "AfCFTA Economic Impact Analysis", slug: "afcfta-economic-impact", category: "Trade Policy" },
    ],
    tags: ["Banking", "Digital Transformation", "Africa", "Financial Services", "2025 Outlook"],
  },
  "mobile-money-revolution": {
    id: "2",
    title: "The Mobile Money Revolution",
    subtitle: "How mobile financial services are reshaping economic inclusion across Sub-Saharan Africa",
    category: "Fintech",
    date: "December 2024",
    quarter: "Q4 2024",
    readTime: "35 min read",
    pages: 64,
    isPremium: true,
    coverImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop",
    abstract: `Mobile money has transformed financial inclusion across Africa, with over 600 million registered accounts and transaction volumes exceeding $700 billion annually. This report examines the ecosystem's evolution, key players, regulatory frameworks, and future growth trajectories.`,
    keyFindings: [
      "Mobile money accounts have surpassed traditional bank accounts in 12 African countries",
      "Average transaction values have increased 45% as users trust platforms with larger amounts",
      "Interoperability between mobile money platforms has improved cross-border remittances",
      "Agent networks have grown to over 2.5 million across the continent",
    ],
    tableOfContents: [
      { title: "Executive Summary", page: 1 },
      { title: "Market Overview", page: 6 },
      { title: "Key Players Analysis", page: 18 },
      { title: "Regulatory Environment", page: 34 },
      { title: "Future Outlook", page: 52 },
    ],
    methodology: `Based on analysis of mobile money transaction data, operator reports, and regulatory filings across 20 African markets.`,
    authors: [
      {
        name: "Amara Obi",
        role: "Editor-in-Chief",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop",
        bio: "Award-winning financial journalist with expertise in African fintech",
      },
    ],
    relatedReports: [
      { title: "African Banking Sector Outlook 2025", slug: "african-banking-outlook-2025", category: "Banking" },
    ],
    tags: ["Mobile Money", "Fintech", "Financial Inclusion", "Africa"],
  },
};

export default function ResearchDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const report = researchReports[slug];
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!report) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold mb-2">Report Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The research report you're looking for doesn't exist or has been moved.
          </p>
          <Link
            href="/research"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Browse All Research
          </Link>
        </div>
      </MainLayout>
    );
  }

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "findings", label: "Key Findings" },
    { id: "methodology", label: "Methodology" },
    { id: "authors", label: "Authors" },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-terminal-bg-secondary border-b border-terminal-border">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/research" className="hover:text-foreground">Research</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground truncate">{report.title}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative">
          <div className="absolute inset-0 h-[400px]">
            <Image
              src={report.coverImage}
              alt={report.title}
              fill
              className="object-cover"
              unoptimized
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-terminal-bg via-terminal-bg/80 to-terminal-bg/40" />
          </div>

          <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 pt-32 pb-12">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary rounded">
                  {report.category}
                </span>
                <span className="text-sm text-muted-foreground">{report.quarter}</span>
                {report.isPremium && (
                  <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Premium
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
                {report.title}
              </h1>

              <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                {report.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-8">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {report.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {report.readTime}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {report.pages} pages
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
                  <Download className="h-5 w-5" />
                  Download PDF
                </button>
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors",
                    isBookmarked
                      ? "bg-primary/20 border-primary text-primary"
                      : "border-slate-600 text-slate-300 hover:border-slate-500"
                  )}
                >
                  <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
                  {isBookmarked ? "Saved" : "Save"}
                </button>
                <button className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors">
                  <Share2 className="h-5 w-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Navigation */}
        <div className="sticky top-16 z-30 bg-terminal-bg border-b border-terminal-border">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            <div className="flex items-center gap-1 overflow-x-auto">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    activeSection === section.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {/* Abstract / Overview */}
              {activeSection === "overview" && (
                <section>
                  <h2 className="font-serif text-2xl font-bold mb-6">Abstract</h2>
                  <div className="prose-journal text-muted-foreground leading-relaxed whitespace-pre-line">
                    {report.abstract}
                  </div>

                  {/* Table of Contents */}
                  <div className="mt-12">
                    <h3 className="font-serif text-xl font-bold mb-4">Table of Contents</h3>
                    <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                      <ul className="space-y-2">
                        {report.tableOfContents.map((item: any, index: number) => (
                          <li
                            key={index}
                            className="flex items-center justify-between py-2 border-b border-terminal-border last:border-0"
                          >
                            <span className="text-muted-foreground">{item.title}</span>
                            <span className="text-sm text-muted-foreground">p. {item.page}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* Key Findings */}
              {activeSection === "findings" && (
                <section>
                  <h2 className="font-serif text-2xl font-bold mb-6">Key Findings</h2>
                  <div className="space-y-4">
                    {report.keyFindings.map((finding: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border"
                      >
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">{finding}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Methodology */}
              {activeSection === "methodology" && (
                <section>
                  <h2 className="font-serif text-2xl font-bold mb-6">Research Methodology</h2>
                  <div className="prose-journal text-muted-foreground leading-relaxed whitespace-pre-line">
                    {report.methodology}
                  </div>
                </section>
              )}

              {/* Authors */}
              {activeSection === "authors" && (
                <section>
                  <h2 className="font-serif text-2xl font-bold mb-6">Research Team</h2>
                  <div className="space-y-6">
                    {report.authors.map((author: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-6 bg-terminal-bg-secondary rounded-lg border border-terminal-border"
                      >
                        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={author.image}
                            alt={author.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{author.name}</h4>
                          <p className="text-primary text-sm mb-2">{author.role}</p>
                          <p className="text-muted-foreground text-sm">{author.bio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              {/* Download Card */}
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 mb-6">
                <h3 className="font-semibold mb-4">Download Report</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get the full {report.pages}-page report with detailed analysis, charts, and appendices.
                </p>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
                  <Download className="h-5 w-5" />
                  Download PDF
                </button>
              </div>

              {/* Tags */}
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 mb-6">
                <h3 className="font-semibold mb-4">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {report.tags.map((tag: string) => (
                    <Link
                      key={tag}
                      href={`/topics/${tag.toLowerCase().replace(/ /g, "-")}`}
                      className="px-3 py-1 text-sm bg-terminal-bg rounded-full border border-terminal-border hover:border-primary/50 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Related Reports */}
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                <h3 className="font-semibold mb-4">Related Research</h3>
                <div className="space-y-4">
                  {report.relatedReports.map((related: any) => (
                    <Link
                      key={related.slug}
                      href={`/research/${related.slug}`}
                      className="block group"
                    >
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {related.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{related.category}</p>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/research"
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 mt-4"
                >
                  View all research <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </div>

        {/* CTA Section */}
        <section className="bg-terminal-bg-secondary border-t border-terminal-border py-16">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <h2 className="font-serif text-2xl font-bold mb-4">
              Stay Updated on African Markets
            </h2>
            <p className="text-muted-foreground mb-6">
              Subscribe to receive our latest research reports, market analysis, and insights directly in your inbox.
            </p>
            <Link
              href="/newsletters"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Subscribe to Research Updates
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
