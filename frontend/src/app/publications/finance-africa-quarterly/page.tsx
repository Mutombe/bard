"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronRight,
  Loader2,
  Calendar,
  Globe,
  TrendingUp,
  FileText,
  BarChart3,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import apiClient from "@/services/api/client";
import { toast } from "sonner";

const highlights = [
  "In-depth quarterly analysis of African equity, fixed income, and commodity markets",
  "Country-specific economic outlook reports across 15+ African economies",
  "Sector deep-dives: banking, telecoms, mining, agriculture, and fintech",
  "Exclusive interviews with central bank officials, fund managers, and CEOs",
  "Capital flows tracker: FDI, portfolio investment, and remittance trends",
  "Regulatory and policy change impact assessments",
  "Long-form investigative features on emerging market themes",
  "Data appendix with key macroeconomic indicators and forecasts",
];

const pastIssues = [
  {
    title: "Q4 2025: Africa's Fintech Consolidation Wave",
    description:
      "How M&A activity is reshaping the continent's digital finance landscape.",
  },
  {
    title: "Q3 2025: Commodity Supercycle Revisited",
    description:
      "Critical minerals, energy transition, and what it means for African producers.",
  },
  {
    title: "Q2 2025: The Rise of African Sovereign Wealth",
    description:
      "New sovereign funds, shifting allocations, and the race for domestic capital markets.",
  },
];

export default function FinanceAfricaQuarterlyPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError("");

    try {
      await apiClient.post("/engagement/newsletters/", {
        email,
        newsletter_type: "finance_africa_quarterly",
      });
      setShowSuccess(true);
      toast.success("Subscribed to Finance Africa Quarterly!");
      setEmail("");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Failed to subscribe. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span>Publications</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Finance Africa Quarterly</span>
        </nav>

        {/* Hero with image strip grid */}
        <section className="relative overflow-hidden rounded-lg mb-12" style={{ height: '420px' }}>
          {/* Image strips */}
          <div className="absolute inset-0 flex items-start gap-[3px]">
            {[
              { flex: 0.7, height: '68%', bg: '#0f172a', img: 'photo-1486406146926-c627a92ad1ab' },
              { flex: 1.1, height: '88%', bg: '#1e293b', img: 'photo-1449824913935-59a10b8d2000' },
              { flex: 0.8, height: '62%', bg: '#14243d', img: 'photo-1462899006636-339e08d1844e' },
              { flex: 1.4, height: '100%', bg: '#0c1a2e', img: 'photo-1480714378408-67cf0d13bc1b' },
              { flex: 1.0, height: '78%', bg: '#1a1a2e', img: 'photo-1526304640581-d334cdbbf45e' },
              { flex: 0.6, height: '58%', bg: '#162032', img: 'photo-1444628838545-ac4016a5418a' },
              { flex: 1.2, height: '92%', bg: '#0f172a', img: 'photo-1497366216548-37526070297c' },
              { flex: 0.9, height: '72%', bg: '#1e293b', img: 'photo-1454165804606-c3d57bc86b40' },
              { flex: 0.7, height: '65%', bg: '#14243d', img: 'photo-1497366811353-6870744d04b2' },
              { flex: 1.0, height: '85%', bg: '#0c1a2e', img: 'photo-1560472354-b33ff0c44a43' },
            ].map((strip, i) => (
              <div
                key={i}
                className="relative overflow-hidden"
                style={{ flex: strip.flex, height: strip.height }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundColor: strip.bg,
                    backgroundImage: `url(https://images.unsplash.com/${strip.img}?auto=format&fit=crop&w=400&q=80)`,
                  }}
                />
                <div className="absolute inset-0 bg-black/15" />
              </div>
            ))}
          </div>

          {/* Bottom fade overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 12%, hsl(var(--background) / 0.92) 24%, hsl(var(--background) / 0.6) 42%, hsl(var(--background) / 0.2) 65%, transparent 100%)`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-lg bg-brand-orange/20 backdrop-blur-sm flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-brand-orange" />
              </div>
              <span className="px-3 py-1 bg-brand-orange/20 backdrop-blur-sm text-brand-orange text-xs font-semibold rounded-full uppercase tracking-wider">
                Quarterly
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 font-serif">
              Finance Africa Quarterly
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Our flagship journal delivering comprehensive, quarterly deep-dive
              reports on African financial markets. Rigorous analysis, original
              research, and actionable intelligence for serious investors.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* What You'll Get */}
            <section>
              <h2 className="text-2xl font-bold mb-6">
                What You&apos;ll Get
              </h2>
              <ul className="space-y-3">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-market-up flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Past Issues */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Recent Issues</h2>
              <div className="space-y-4">
                {pastIssues.map((issue) => (
                  <div
                    key={issue.title}
                    className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-brand-orange flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {issue.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* At a Glance */}
            <section>
              <h2 className="text-2xl font-bold mb-6">At a Glance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border text-center">
                  <Calendar className="h-6 w-6 text-brand-orange mx-auto mb-2" />
                  <div className="text-sm font-semibold">Quarterly</div>
                  <div className="text-xs text-muted-foreground">
                    4 issues per year
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border text-center">
                  <Globe className="h-6 w-6 text-brand-orange mx-auto mb-2" />
                  <div className="text-sm font-semibold">Pan-African</div>
                  <div className="text-xs text-muted-foreground">
                    15+ economies covered
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border text-center">
                  <BarChart3 className="h-6 w-6 text-brand-orange mx-auto mb-2" />
                  <div className="text-sm font-semibold">100+ Pages</div>
                  <div className="text-xs text-muted-foreground">
                    Per issue, data-rich
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Subscribe Form */}
          <div>
            <div className="sticky top-24 space-y-6">
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                <h3 className="text-lg font-semibold mb-2">
                  Subscribe to Finance Africa Quarterly
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Get each issue delivered to your inbox the day it publishes.
                </p>

                {showSuccess ? (
                  <div className="bg-market-up/10 border border-market-up/30 rounded-lg p-5 text-center">
                    <Check className="h-8 w-8 text-market-up mx-auto mb-2" />
                    <p className="text-market-up font-semibold">
                      You&apos;re subscribed!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Look out for the next issue in your inbox.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-4 py-3 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                      />
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-market-down/10 border border-market-down/30 rounded-md text-market-down text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        "Subscribe Free"
                      )}
                    </button>

                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Free email delivery. Unsubscribe anytime.
                    </p>
                  </form>
                )}
              </div>

              {/* CTA to full platform */}
              <div className="bg-terminal-bg-elevated rounded-lg border border-brand-orange/30 p-6 text-center">
                <TrendingUp className="h-6 w-6 text-brand-orange mx-auto mb-3" />
                <p className="text-sm font-semibold mb-2">
                  Want the full platform?
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Get real-time data, analytics, and all three publications with
                  a BGFI subscription.
                </p>
                <Link
                  href="/subscribe"
                  className="inline-block w-full py-2 border border-brand-orange text-brand-orange text-sm font-medium rounded-md hover:bg-brand-orange hover:text-white transition-colors"
                >
                  View Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
