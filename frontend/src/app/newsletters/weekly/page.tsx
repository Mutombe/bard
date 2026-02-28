"use client";

import Link from "next/link";
import { Mail, ArrowLeft, Clock, Calendar } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

const recentIssues = [
  { date: "Jan 24, 2025", subject: "Week in Review: Markets End Strong", preview: "African markets posted solid gains this week with the JSE leading..." },
  { date: "Jan 17, 2025", subject: "Central Banks in Focus", preview: "Multiple African central banks signaled potential rate cuts as inflation..." },
  { date: "Jan 10, 2025", subject: "New Year Rally Continues", preview: "The new year rally extended into its second week with investors..." },
  { date: "Jan 3, 2025", subject: "2025 Outlook: What to Watch", preview: "Our analysts share their top picks and key themes for 2025..." },
];

export default function WeeklyNewsletterPage() {
  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/subscribe" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6 text-brand-orange" />
              Weekly Digest
            </h1>
            <p className="text-muted-foreground">Comprehensive week in review delivered every Friday</p>
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
            <div className="relative overflow-hidden bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <div className="absolute inset-0 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-[0.07] dark:opacity-[0.10]"><defs><pattern id="weekly-sub-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(355, 70%, 38%)" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#weekly-sub-grid)"/></svg></div>
              <h3 className="relative font-semibold mb-4">Subscribe to Weekly Digest</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get a comprehensive summary of the week&apos;s market activity, top stories, and expert analysis.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-brand-orange" />
                  <span>Delivered Friday at 4:00 PM SAST</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-brand-orange" />
                  <span>Weekly</span>
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
