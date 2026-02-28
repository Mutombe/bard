"use client";

import Link from "next/link";
import {
  ChevronRight,
  Landmark,
  Pickaxe,
  Cpu,
  Wheat,
  Building2,
  Globe,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const industries = [
  {
    name: "Banking & Finance",
    slug: "banking",
    icon: Landmark,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Central banks, commercial banking, fintech, insurance, and financial services across Africa.",
    articleCount: 234,
  },
  {
    name: "Mining & Resources",
    slug: "mining",
    icon: Pickaxe,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: "Gold, platinum, copper, and other mineral extraction driving African economies.",
    articleCount: 189,
  },
  {
    name: "Technology",
    slug: "technology",
    icon: Cpu,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Startups, digital transformation, telecommunications, and tech innovation.",
    articleCount: 156,
  },
  {
    name: "Agriculture",
    slug: "agriculture",
    icon: Wheat,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "Agribusiness, food security, sustainable farming, and agricultural commodities.",
    articleCount: 143,
  },
  {
    name: "Infrastructure",
    slug: "infrastructure",
    icon: Building2,
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
    description: "Construction, energy, transport, real estate, and public-private partnerships.",
    articleCount: 167,
  },
  {
    name: "Global Markets",
    slug: "global",
    icon: Globe,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    description: "International trade, FDI flows, geopolitics, and global economic impact on Africa.",
    articleCount: 198,
  },
];

export default function IndustriesPage() {
  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary">Industries</span>
        </nav>

        {/* Header */}
        <header className="mb-12 max-w-3xl">
          <h1 className="headline-xl mb-4">Industries</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Explore our in-depth coverage of key sectors driving African economic growth.
            From traditional industries to emerging technologies, we provide analysis
            and insights across the continent&apos;s most dynamic markets.
          </p>
        </header>

        {/* Industries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry) => {
            const Icon = industry.icon;
            return (
              <Link
                key={industry.slug}
                href={`/industries/${industry.slug}`}
                className="group p-6 rounded-lg bg-terminal-bg-secondary border border-terminal-border hover:border-primary/50 transition-all"
              >
                <div className={cn("inline-flex p-3 rounded-lg mb-4", industry.bgColor)}>
                  <Icon className={cn("h-6 w-6", industry.color)} />
                </div>
                <h2 className="headline text-xl mb-2 group-hover:text-primary transition-colors">
                  {industry.name}
                </h2>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {industry.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {industry.articleCount} articles
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Cross-Industry Section */}
        <section className="mt-16 pt-12 border-t border-terminal-border">
          <h2 className="headline text-2xl mb-6">Cross-Industry Analysis</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Many of Africa&apos;s most significant economic developments span multiple
            sectors. Explore our thematic coverage that connects the dots across industries.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/topics/economic-policy"
              className="p-4 rounded-lg bg-terminal-bg-elevated hover:bg-terminal-bg-secondary transition-colors"
            >
              <h3 className="font-semibold mb-1">Economic Policy</h3>
              <p className="text-sm text-muted-foreground">
                Fiscal and monetary policy impact across sectors
              </p>
            </Link>
            <Link
              href="/topics/sustainability"
              className="p-4 rounded-lg bg-terminal-bg-elevated hover:bg-terminal-bg-secondary transition-colors"
            >
              <h3 className="font-semibold mb-1">Sustainability</h3>
              <p className="text-sm text-muted-foreground">
                ESG, climate action, and green finance
              </p>
            </Link>
            <Link
              href="/topics/infrastructure-development"
              className="p-4 rounded-lg bg-terminal-bg-elevated hover:bg-terminal-bg-secondary transition-colors"
            >
              <h3 className="font-semibold mb-1">Infrastructure Development</h3>
              <p className="text-sm text-muted-foreground">
                Continental connectivity and development
              </p>
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
