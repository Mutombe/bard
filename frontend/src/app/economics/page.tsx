"use client";

import Link from "next/link";
import {
  ChartBar,
  TrendUp,
  Calculator,
  Users,
  Globe,
  Bank,
  Calendar,
  CaretRight,
} from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";

const economicCategories = [
  {
    title: "Macro Indicators",
    items: [
      { label: "GDP Data", href: "/economics/gdp", icon: ChartBar, description: "Gross Domestic Product figures" },
      { label: "Inflation", href: "/economics/inflation", icon: TrendUp, description: "CPI and inflation rates" },
      { label: "Interest Rates", href: "/economics/rates", icon: Calculator, description: "Central bank rates" },
      { label: "Employment", href: "/economics/employment", icon: Users, description: "Jobs and unemployment" },
      { label: "Trade Balance", href: "/economics/trade", icon: Globe, description: "Import/export data" },
    ],
  },
  {
    title: "Central Banks",
    items: [
      { label: "SARB", href: "/economics/sarb", icon: Bank, description: "South African Reserve Bank" },
      { label: "CBN", href: "/economics/cbn", icon: Bank, description: "Central Bank of Nigeria" },
      { label: "Fed Watch", href: "/economics/fed", icon: Bank, description: "US Federal Reserve" },
      { label: "ECB", href: "/economics/ecb", icon: Bank, description: "European Central Bank" },
    ],
  },
  {
    title: "Calendar & Events",
    items: [
      { label: "Economic Calendar", href: "/economics/calendar", icon: Calendar, description: "Upcoming economic events" },
      { label: "Earnings Calendar", href: "/economics/earnings", icon: Calculator, description: "Company earnings releases" },
      { label: "IPO Calendar", href: "/economics/ipo", icon: TrendUp, description: "Upcoming IPOs" },
    ],
  },
];

export default function EconomicsPage() {
  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Economics</h1>
          <p className="text-muted-foreground">Economic data, indicators, and central bank updates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {economicCategories.map((category) => (
            <div key={category.title} className="bg-terminal-bg-secondary rounded-lg border border-terminal-border">
              <div className="p-4 border-b border-terminal-border">
                <h2 className="font-semibold">{category.title}</h2>
              </div>
              <div className="divide-y divide-terminal-border">
                {category.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-brand-orange/20 text-brand-orange flex items-center justify-center">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </div>
                    <CaretRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
