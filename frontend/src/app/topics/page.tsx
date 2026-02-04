"use client";

import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

const topicCategories = [
  {
    title: "Markets & Finance",
    topics: [
      { name: "Central Banks", slug: "central-banks" },
      { name: "Interest Rates", slug: "interest-rates" },
      { name: "Inflation", slug: "inflation" },
      { name: "Bond Markets", slug: "bond-markets" },
      { name: "Currency Policy", slug: "currency-policy" },
      { name: "Stock Markets", slug: "stock-markets" },
      { name: "IPOs", slug: "ipos" },
      { name: "M&A", slug: "mergers-acquisitions" },
    ],
  },
  {
    title: "Technology & Innovation",
    topics: [
      { name: "Fintech", slug: "fintech" },
      { name: "Startups", slug: "startups" },
      { name: "Venture Capital", slug: "venture-capital" },
      { name: "Digital Payments", slug: "digital-payments" },
      { name: "Mobile Money", slug: "mobile-money" },
      { name: "E-commerce", slug: "e-commerce" },
      { name: "Telecommunications", slug: "telecommunications" },
      { name: "AI & Data", slug: "ai-data" },
    ],
  },
  {
    title: "Trade & Global",
    topics: [
      { name: "Trade Policy", slug: "trade-policy" },
      { name: "AfCFTA", slug: "afcfta" },
      { name: "Foreign Direct Investment", slug: "foreign-direct-investment" },
      { name: "Geopolitics", slug: "geopolitics" },
      { name: "Sanctions", slug: "sanctions" },
      { name: "Exports", slug: "exports" },
      { name: "Emerging Markets", slug: "emerging-markets" },
      { name: "China-Africa Relations", slug: "china-africa" },
    ],
  },
  {
    title: "Commodities & Resources",
    topics: [
      { name: "Gold", slug: "gold" },
      { name: "Platinum", slug: "platinum" },
      { name: "Oil & Gas", slug: "oil-gas" },
      { name: "Copper", slug: "copper" },
      { name: "Rare Earths", slug: "rare-earths" },
      { name: "Commodities", slug: "commodities" },
      { name: "Mining", slug: "mining" },
      { name: "Diamonds", slug: "diamonds" },
    ],
  },
  {
    title: "Sustainability & Climate",
    topics: [
      { name: "Sustainability", slug: "sustainability" },
      { name: "Climate", slug: "climate" },
      { name: "Green Finance", slug: "green-finance" },
      { name: "ESG", slug: "esg" },
      { name: "Renewables", slug: "renewables" },
      { name: "Carbon Markets", slug: "carbon-markets" },
      { name: "Just Transition", slug: "just-transition" },
      { name: "Energy Transition", slug: "energy-transition" },
    ],
  },
  {
    title: "Infrastructure & Development",
    topics: [
      { name: "Energy", slug: "energy" },
      { name: "Power Generation", slug: "power-generation" },
      { name: "Transport", slug: "transport" },
      { name: "Real Estate", slug: "real-estate" },
      { name: "PPPs", slug: "public-private-partnerships" },
      { name: "Ports & Logistics", slug: "ports-logistics" },
      { name: "Urban Development", slug: "urban-development" },
      { name: "Construction", slug: "construction" },
    ],
  },
];

export default function TopicsPage() {
  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary">Topics</span>
        </nav>

        {/* Header */}
        <header className="mb-12 max-w-3xl">
          <h1 className="headline-xl mb-4">Topics</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Explore our coverage by theme. From monetary policy to climate finance,
            find in-depth analysis on the topics shaping African economies and markets.
          </p>
        </header>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topicCategories.map((category) => (
            <div
              key={category.title}
              className="p-6 rounded-lg bg-terminal-bg-secondary border border-terminal-border"
            >
              <h2 className="headline text-lg mb-4">{category.title}</h2>
              <div className="space-y-2">
                {category.topics.map((topic) => (
                  <Link
                    key={topic.slug}
                    href={`/topics/${topic.slug}`}
                    className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors group"
                  >
                    <span>{topic.name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Regions Section */}
        <section className="mt-16 pt-12 border-t border-terminal-border">
          <h2 className="headline text-2xl mb-6">By Region</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Explore our coverage by geographic region across the African continent.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/regions/southern-africa"
              className="p-4 rounded-lg bg-terminal-bg-elevated hover:bg-terminal-bg-secondary transition-colors text-center"
            >
              <h3 className="font-semibold mb-1">Southern Africa</h3>
              <p className="text-xs text-muted-foreground">SA, Zimbabwe, Botswana...</p>
            </Link>
            <Link
              href="/regions/east-africa"
              className="p-4 rounded-lg bg-terminal-bg-elevated hover:bg-terminal-bg-secondary transition-colors text-center"
            >
              <h3 className="font-semibold mb-1">East Africa</h3>
              <p className="text-xs text-muted-foreground">Kenya, Tanzania, Uganda...</p>
            </Link>
            <Link
              href="/regions/west-africa"
              className="p-4 rounded-lg bg-terminal-bg-elevated hover:bg-terminal-bg-secondary transition-colors text-center"
            >
              <h3 className="font-semibold mb-1">West Africa</h3>
              <p className="text-xs text-muted-foreground">Nigeria, Ghana, Côte d&apos;Ivoire...</p>
            </Link>
            <Link
              href="/regions/north-africa"
              className="p-4 rounded-lg bg-terminal-bg-elevated hover:bg-terminal-bg-secondary transition-colors text-center"
            >
              <h3 className="font-semibold mb-1">North Africa</h3>
              <p className="text-xs text-muted-foreground">Egypt, Morocco, Tunisia...</p>
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
