"use client";

import Link from "next/link";
import { Mail, ArrowLeft, Clock, Calendar } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

const recentIssues = [
  { date: "Jan 24, 2025", subject: "Markets Rally on Rate Cut Hopes", preview: "African markets closed higher across the board as investors..." },
  { date: "Jan 23, 2025", subject: "JSE Top 40 Breaks Key Resistance", preview: "The JSE All Share Index climbed 1.2% to breach the 80,000 level..." },
  { date: "Jan 22, 2025", subject: "Nigeria Banking Stocks Lead Gains", preview: "Nigerian banking stocks posted strong gains following positive..." },
  { date: "Jan 21, 2025", subject: "Gold Prices Surge on Safe Haven Demand", preview: "Gold prices hit a two-week high as investors sought safety..." },
  { date: "Jan 20, 2025", subject: "Rand Strengthens Against Dollar", preview: "The South African rand gained 0.8% against the US dollar..." },
];

export default function DailyNewsletterPage() {
  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/newsletters" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6 text-brand-orange" />
              Daily Briefing
            </h1>
            <p className="text-muted-foreground">Your morning market wrap delivered daily at 6:00 AM</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
              <div className="p-4 border-b border-terminal-border">
                <h2 className="font-semibold">Recent Issues</h2>
              </div>
              <div className="divide-y divide-terminal-border">
                {recentIssues.map((issue, idx) => (
                  <div key={idx} className="p-4 hover:bg-terminal-bg-elevated cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      {issue.date}
                    </div>
                    <h3 className="font-semibold mb-2">{issue.subject}</h3>
                    <p className="text-sm text-muted-foreground">{issue.preview}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4">Subscribe to Daily Briefing</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get the most important market news delivered to your inbox every morning before the markets open.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-brand-orange" />
                  <span>Delivered at 6:00 AM SAST</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-brand-orange" />
                  <span>Monday - Friday</span>
                </div>
              </div>
              <Link
                href="/subscribe"
                className="block w-full mt-6 px-4 py-2 bg-brand-orange text-white text-center rounded-md hover:bg-brand-orange/90 transition-colors"
              >
                Subscribe Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
