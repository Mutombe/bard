"use client";

import Link from "next/link";
import { FileText, ArrowLeft, Clock, Mail, Download } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

const recentReports = [
  { date: "Jan 23, 2025", title: "South African Banking Sector Analysis", type: "Sector Report", pages: 24 },
  { date: "Jan 20, 2025", title: "Nigerian Fintech Landscape 2025", type: "Industry Report", pages: 32 },
  { date: "Jan 15, 2025", title: "MTN Group: Initiation of Coverage", type: "Equity Research", pages: 18 },
  { date: "Jan 12, 2025", title: "African Infrastructure Investment", type: "Thematic Report", pages: 28 },
  { date: "Jan 8, 2025", title: "Naspers: Q3 Preview", type: "Earnings Preview", pages: 12 },
];

export default function ResearchNewsletterPage() {
  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/subscribe" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-brand-orange" />
              Research Alerts
            </h1>
            <p className="text-muted-foreground">Get notified when new research reports are published</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
              <div className="p-4 border-b border-terminal-border">
                <h2 className="font-semibold">Recent Research</h2>
              </div>
              <div className="divide-y divide-terminal-border">
                {recentReports.map((report, idx) => (
                  <div key={idx} className="p-4 hover:bg-terminal-bg-elevated">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <span>{report.date}</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-terminal-bg-elevated">
                            {report.type}
                          </span>
                        </div>
                        <h3 className="font-semibold mb-1">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">{report.pages} pages</p>
                      </div>
                      <button className="p-2 hover:bg-terminal-bg rounded-md text-brand-orange">
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="relative overflow-hidden bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <div className="absolute inset-0 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-[0.07] dark:opacity-[0.10]"><defs><pattern id="research-nl-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(355, 70%, 38%)" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#research-nl-grid)"/></svg></div>
              <h3 className="relative font-semibold mb-4">Subscribe to Research Alerts</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to know when our analysts publish new research reports, sector analyses, and company coverage.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-brand-orange" />
                  <span>Instant notification</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-brand-orange" />
                  <span>Free for all subscribers</span>
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
