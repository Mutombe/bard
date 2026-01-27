"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Download,
  Lock,
  Calendar,
  User,
  TrendingUp,
  Building2,
  Globe,
  Filter,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAppSelector } from "@/store";

interface ResearchReport {
  id: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  category: string;
  type: "equity" | "sector" | "macro" | "strategy";
  isPremium: boolean;
  companies?: string[];
  image: string;
  downloadUrl: string;
}

const categories = [
  { id: "all", label: "All Reports" },
  { id: "equity", label: "Equity Research" },
  { id: "sector", label: "Sector Analysis" },
  { id: "macro", label: "Macroeconomic" },
  { id: "strategy", label: "Strategy" },
];

const reports: ResearchReport[] = [
  {
    id: "1",
    title: "South African Banks: Q1 2026 Outlook",
    summary: "An in-depth analysis of the major South African banks and their positioning as the SARB maintains its hawkish stance. We examine loan growth, credit quality, and dividend sustainability.",
    author: "Dr. Fatima Hassan",
    date: "2026-01-27",
    category: "Sector Analysis",
    type: "sector",
    isPremium: false,
    companies: ["SBK", "FSR", "ABG", "NED"],
    image: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800&h=400&fit=crop",
    downloadUrl: "#",
  },
  {
    id: "2",
    title: "Naspers/Prosus: Closing the Discount Gap",
    summary: "We analyze the discount to NAV, Tencent exposure, and management's ongoing efforts to close the valuation gap through aggressive buybacks and strategic asset sales.",
    author: "Thabo Mokoena",
    date: "2026-01-25",
    category: "Equity Research",
    type: "equity",
    isPremium: false,
    companies: ["NPN", "PRX"],
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
    downloadUrl: "#",
  },
  {
    id: "3",
    title: "Nigeria 2026: The Reform Dividend",
    summary: "A comprehensive review of Nigeria's economic reforms, Naira stabilization, and investment opportunities as the economy rebounds from restructuring.",
    author: "Chidi Okonkwo",
    date: "2026-01-24",
    category: "Macroeconomic",
    type: "macro",
    isPremium: false,
    image: "https://images.unsplash.com/photo-1618044619888-009e412ff12a?w=800&h=400&fit=crop",
    downloadUrl: "#",
  },
  {
    id: "4",
    title: "African Mining: Critical Minerals Deep Dive",
    summary: "An exploration of Africa's critical mineral resources (lithium, cobalt, manganese) and the companies positioned to benefit from the global energy transition.",
    author: "Sarah Mulondo",
    date: "2026-01-22",
    category: "Sector Analysis",
    type: "sector",
    isPremium: false,
    companies: ["AGL", "IMP", "S32"],
    image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=800&h=400&fit=crop",
    downloadUrl: "#",
  },
  {
    id: "5",
    title: "MTN Group: Fintech Acceleration",
    summary: "We examine MTN's MoMo fintech expansion, 5G rollout across Africa, and the path to value creation as digital financial services adoption accelerates.",
    author: "Amara Obi",
    date: "2026-01-20",
    category: "Equity Research",
    type: "equity",
    isPremium: false,
    companies: ["MTN", "MTNN"],
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
    downloadUrl: "#",
  },
  {
    id: "6",
    title: "African Fixed Income Strategy Q1 2026",
    summary: "Our recommended positioning across African sovereign and corporate bonds, with focus on Egypt, Kenya, and South Africa amid shifting global rate expectations.",
    author: "Dr. Yemi Adegoke",
    date: "2026-01-18",
    category: "Strategy",
    type: "strategy",
    isPremium: false,
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop",
    downloadUrl: "#",
  },
  {
    id: "7",
    title: "Zimbabwe: Dollarization and Investment Opportunities",
    summary: "An analysis of Zimbabwe's dual currency system, ZiG performance, and investment opportunities in the ZSE as economic stability improves.",
    author: "Tendai Nyamweda",
    date: "2026-01-16",
    category: "Macroeconomic",
    type: "macro",
    isPremium: false,
    image: "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&h=400&fit=crop",
    downloadUrl: "#",
  },
  {
    id: "8",
    title: "Shoprite Holdings: African Retail Champion",
    summary: "Deep dive into Shoprite's operations across 14 African countries, margin trends, and competitive positioning in the fast-growing African consumer market.",
    author: "Dr. Fatima Hassan",
    date: "2026-01-14",
    category: "Equity Research",
    type: "equity",
    isPremium: false,
    companies: ["SHP"],
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=400&fit=crop",
    downloadUrl: "#",
  },
  {
    id: "9",
    title: "African Telecoms: 5G and Beyond",
    summary: "A comprehensive sector analysis of African telecom operators, 5G rollout timelines, tower spinoff opportunities, and data monetization strategies.",
    author: "Amara Obi",
    date: "2026-01-12",
    category: "Sector Analysis",
    type: "sector",
    isPremium: false,
    companies: ["MTN", "VOD", "SAFCOM"],
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop",
    downloadUrl: "#",
  },
  {
    id: "10",
    title: "Kenya Economic Outlook 2026",
    summary: "Analysis of Kenya's debt sustainability, shilling outlook, and key investment themes including the tech startup ecosystem and infrastructure development.",
    author: "Wanjiku Mwangi",
    date: "2026-01-10",
    category: "Macroeconomic",
    type: "macro",
    isPremium: false,
    image: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800&h=400&fit=crop",
    downloadUrl: "#",
  },
  {
    id: "11",
    title: "Anglo American Platinum: Green Hydrogen Play",
    summary: "We examine Amplats' platinum group metals exposure and its strategic positioning in the emerging green hydrogen economy.",
    author: "Sarah Mulondo",
    date: "2026-01-08",
    category: "Equity Research",
    type: "equity",
    isPremium: false,
    companies: ["AMS"],
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=400&fit=crop",
    downloadUrl: "#",
  },
  {
    id: "12",
    title: "African Equity Strategy: Top Picks for 2026",
    summary: "Our best investment ideas across African markets, with focus on quality growth at reasonable valuations in SA, Nigeria, Kenya, and Egypt.",
    author: "Thabo Mokoena",
    date: "2026-01-05",
    category: "Strategy",
    type: "strategy",
    isPremium: false,
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=400&fit=crop",
    downloadUrl: "#",
  },
];

function getTypeIcon(type: ResearchReport["type"]) {
  switch (type) {
    case "equity":
      return <TrendingUp className="h-4 w-4" />;
    case "sector":
      return <Building2 className="h-4 w-4" />;
    case "macro":
      return <Globe className="h-4 w-4" />;
    case "strategy":
      return <FileText className="h-4 w-4" />;
  }
}

export default function ResearchPage() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isPremiumUser = user?.subscription_tier === "professional" || user?.subscription_tier === "enterprise";

  const filteredReports = reports.filter((report) => {
    const matchesCategory = selectedCategory === "all" || report.type === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <FileText className="h-6 w-6 text-brand-orange" />
              Research
            </h1>
            <p className="text-muted-foreground">
              In-depth analysis and reports from our expert research team.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Category Filter */}
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

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors"
            >
              <div className="relative aspect-video">
                <Image
                  src={report.image}
                  alt={report.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-terminal-bg/90 text-foreground flex items-center gap-1">
                    {getTypeIcon(report.type)}
                    {report.category}
                  </span>
                </div>
                {report.isPremium && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-brand-orange text-white flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Premium
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2">{report.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {report.summary}
                </p>

                {report.companies && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {report.companies.map((company) => (
                      <Link
                        key={company}
                        href={`/companies/${company.toLowerCase()}`}
                        className="px-2 py-0.5 text-xs bg-terminal-bg-elevated rounded hover:bg-brand-orange/20 hover:text-brand-orange transition-colors"
                      >
                        {company}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {report.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(report.date).toLocaleDateString("en-ZA", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {report.isPremium && !isPremiumUser ? (
                  <Link
                    href="/subscribe"
                    className="block w-full text-center py-2 border border-brand-orange text-brand-orange rounded-md hover:bg-brand-orange hover:text-white transition-colors text-sm"
                  >
                    Upgrade to Access
                  </Link>
                ) : (
                  <a
                    href={report.downloadUrl}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No reports found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

        {/* Premium CTA */}
        {!isPremiumUser && (
          <div className="mt-12 bg-gradient-to-r from-brand-orange/20 to-brand-orange/5 rounded-lg border border-brand-orange/30 p-8 text-center">
            <Lock className="h-12 w-12 text-brand-orange mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Unlock Premium Research</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Get access to all our research reports, exclusive analysis, and early access to market insights with a Premium subscription.
            </p>
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 px-8 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
            >
              View Plans
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
