"use client";

import Link from "next/link";
import { LineChart, ArrowLeft, TrendingUp, TrendingDown, Calendar, CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const marketAnalysis = [
  {
    title: "JSE Technical Analysis: Key Levels to Watch",
    author: "John Smith",
    date: "Jan 24, 2025",
    type: "Technical",
    sentiment: "bullish",
    preview: "The JSE All Share Index is approaching a critical resistance level at 81,500. A breakout could signal further upside..."
  },
  {
    title: "NGX Banking Index: Fundamental Overview",
    author: "Sarah Okonkwo",
    date: "Jan 23, 2025",
    type: "Fundamental",
    sentiment: "neutral",
    preview: "Nigerian banking stocks have rallied significantly in 2024. We examine valuations and growth prospects..."
  },
  {
    title: "Gold & Commodities: African Producers to Benefit",
    author: "Michael Chen",
    date: "Jan 22, 2025",
    type: "Sector",
    sentiment: "bullish",
    preview: "With gold prices near all-time highs, African gold producers are well-positioned for strong earnings..."
  },
  {
    title: "Rand Outlook: Volatility Ahead",
    author: "Anna van der Berg",
    date: "Jan 21, 2025",
    type: "Currency",
    sentiment: "bearish",
    preview: "The South African rand faces headwinds from global risk sentiment and local political uncertainty..."
  },
  {
    title: "NSE Kenya: Value Opportunities Emerging",
    author: "David Kamau",
    date: "Jan 20, 2025",
    type: "Fundamental",
    sentiment: "bullish",
    preview: "Kenyan equities are trading at attractive valuations following recent rate cuts by the CBK..."
  },
];

function getSentimentColor(sentiment: string) {
  switch (sentiment) {
    case "bullish":
      return "bg-market-up/20 text-market-up";
    case "bearish":
      return "bg-market-down/20 text-market-down";
    default:
      return "bg-terminal-bg-elevated text-muted-foreground";
  }
}

export default function MarketAnalysisPage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/analysis" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LineChart className="h-6 w-6 text-brand-orange" />
              Market Analysis
            </h1>
            <p className="text-muted-foreground">Technical and fundamental market analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
              <div className="p-4 border-b border-terminal-border flex items-center justify-between">
                <h2 className="font-semibold">Latest Analysis</h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm rounded-md bg-brand-orange text-white">All</button>
                  <button className="px-3 py-1 text-sm rounded-md hover:bg-terminal-bg-elevated">Technical</button>
                  <button className="px-3 py-1 text-sm rounded-md hover:bg-terminal-bg-elevated">Fundamental</button>
                </div>
              </div>
              <div className="divide-y divide-terminal-border">
                {marketAnalysis.map((analysis, idx) => (
                  <article key={idx} className="p-4 hover:bg-terminal-bg-elevated cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-terminal-bg-elevated">
                        {analysis.type}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs capitalize inline-flex items-center gap-1",
                        getSentimentColor(analysis.sentiment)
                      )}>
                        {analysis.sentiment === "bullish" ? <TrendingUp className="h-3 w-3" /> :
                         analysis.sentiment === "bearish" ? <TrendingDown className="h-3 w-3" /> : null}
                        {analysis.sentiment}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-2">{analysis.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{analysis.preview}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CircleUserRound className="h-3 w-3" />
                        {analysis.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {analysis.date}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4">Market Sentiment</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">JSE</span>
                  <span className="text-sm text-market-up">Bullish</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">NGX</span>
                  <span className="text-sm text-market-up">Bullish</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">EGX</span>
                  <span className="text-sm text-muted-foreground">Neutral</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">NSE Kenya</span>
                  <span className="text-sm text-market-up">Bullish</span>
                </div>
              </div>
            </div>

            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs rounded bg-terminal-bg-elevated hover:bg-brand-orange/20 cursor-pointer">Technical Analysis</span>
                <span className="px-2 py-1 text-xs rounded bg-terminal-bg-elevated hover:bg-brand-orange/20 cursor-pointer">JSE</span>
                <span className="px-2 py-1 text-xs rounded bg-terminal-bg-elevated hover:bg-brand-orange/20 cursor-pointer">NGX</span>
                <span className="px-2 py-1 text-xs rounded bg-terminal-bg-elevated hover:bg-brand-orange/20 cursor-pointer">Banking</span>
                <span className="px-2 py-1 text-xs rounded bg-terminal-bg-elevated hover:bg-brand-orange/20 cursor-pointer">Gold</span>
                <span className="px-2 py-1 text-xs rounded bg-terminal-bg-elevated hover:bg-brand-orange/20 cursor-pointer">Forex</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
