"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Library,
  Check,
  ChevronRight,
  Loader2,
  CalendarRange,
  MapPin,
  BookMarked,
  ScrollText,
  Landmark,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import apiClient from "@/services/api/client";
import { toast } from "sonner";

// Deep Indigo accent: #2D3A8C light, #6272C1 dark
const ACCENT = "text-[#2D3A8C] dark:text-[#6272C1]";
const ACCENT_BG = "bg-[#2D3A8C]/15 dark:bg-[#6272C1]/15";
const ACCENT_BORDER = "border-[#2D3A8C]/20 dark:border-[#6272C1]/20";

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

// Real Unsplash images — African cities & institutions
const heroImages = [
  { flex: 1.2, height: '85%', bg: '#0D0F24', url: 'https://images.unsplash.com/photo-1735837836882-559fd3ab1a8e?auto=format&fit=crop&w=500&q=80' },
  { flex: 1.6, height: '100%', bg: '#131738', url: 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?auto=format&fit=crop&w=500&q=80' },
  { flex: 1.0, height: '72%', bg: '#0A0D1F', url: 'https://images.unsplash.com/photo-1648023195395-5df442315442?auto=format&fit=crop&w=500&q=80' },
  { flex: 1.8, height: '95%', bg: '#181E4A', url: 'https://images.unsplash.com/photo-1523963288448-9a82c7c9049f?auto=format&fit=crop&w=500&q=80' },
  { flex: 1.1, height: '80%', bg: '#10133B', url: 'https://images.unsplash.com/photo-1596005554384-d293674c91d7?auto=format&fit=crop&w=500&q=80' },
  { flex: 1.4, height: '90%', bg: '#0D0F24', url: 'https://images.unsplash.com/photo-1654575998971-4f467c8a89c1?auto=format&fit=crop&w=500&q=80' },
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
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
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

        {/* Hero — The Monograph: 6 wider strips, indigo tint, diagonal lines */}
        <section className="relative overflow-hidden mb-12" style={{ height: '480px' }}>
          {/* Image strips */}
          <div className="absolute inset-0 flex items-start gap-[3px]">
            {heroImages.map((strip, i) => (
              <div
                key={i}
                className="relative overflow-hidden"
                style={{ flex: strip.flex, height: strip.height }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundColor: strip.bg,
                    backgroundImage: `url(${strip.url})`,
                  }}
                />
                <div className="absolute inset-0 bg-[#2D3A8C]/20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-black/15" />
              </div>
            ))}
          </div>

          {/* Diagonal lines overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.06]"
            style={{
              backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 4px, currentColor 4px, currentColor 5px)`,
            }}
          />

          {/* Bottom fade with indigo tint */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 15%, hsl(var(--background) / 0.9) 30%, hsl(232 52% 36% / 0.15) 60%, hsl(232 52% 36% / 0.08) 80%, transparent 100%)`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-12 w-12 ${ACCENT_BG} backdrop-blur-sm flex items-center justify-center`}>
                <Library className={`h-6 w-6 ${ACCENT}`} />
              </div>
              <span className={`px-3 py-1 ${ACCENT_BG} backdrop-blur-sm ${ACCENT} text-xs font-semibold uppercase tracking-wider border ${ACCENT_BORDER}`}>
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
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="text-2xl font-bold mb-6">What You&apos;ll Get</h2>
              <ul className="space-y-3">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check className={`h-4 w-4 ${ACCENT} flex-shrink-0 mt-0.5`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6">Recent Issues</h2>
              <div className="space-y-4">
                {pastIssues.map((issue) => (
                  <div
                    key={issue.title}
                    className="p-4 bg-terminal-bg-secondary border border-terminal-border border-l-[3px] border-l-[#2D3A8C] dark:border-l-[#6272C1]"
                  >
                    <div className="flex items-start gap-3">
                      <ScrollText className={`h-5 w-5 ${ACCENT} flex-shrink-0 mt-0.5`} />
                      <div>
                        <h3 className="font-semibold mb-1">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6">At a Glance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-terminal-bg-secondary border border-terminal-border text-center">
                  <div className={`text-3xl font-mono font-bold ${ACCENT} mb-1`}>4</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Issues Per Year</div>
                </div>
                <div className="p-5 bg-terminal-bg-secondary border border-terminal-border text-center">
                  <div className={`text-3xl font-mono font-bold ${ACCENT} mb-1`}>15+</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Economies Covered</div>
                </div>
                <div className="p-5 bg-terminal-bg-secondary border border-terminal-border text-center">
                  <div className={`text-3xl font-mono font-bold ${ACCENT} mb-1`}>100+</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pages Per Issue</div>
                </div>
              </div>
            </section>
          </div>

          <div>
            <div className="sticky top-24 space-y-6">
              <div className="bg-terminal-bg-secondary border border-terminal-border p-6">
                <h3 className="text-lg font-semibold mb-2">Subscribe to Finance Africa Quarterly</h3>
                <p className="text-sm text-muted-foreground mb-6">Get each issue delivered to your inbox the day it publishes.</p>

                {showSuccess ? (
                  <div className="bg-market-up/10 border border-market-up/30 p-5 text-center">
                    <Check className="h-8 w-8 text-market-up mx-auto mb-2" />
                    <p className="text-market-up font-semibold">You&apos;re subscribed!</p>
                    <p className="text-xs text-muted-foreground mt-1">Look out for the next issue in your inbox.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-4 py-3 bg-terminal-bg-elevated border border-terminal-border focus:outline-none focus:border-[#2D3A8C] dark:focus:border-[#6272C1]"
                      />
                    </div>
                    {error && (
                      <div className="mb-4 p-3 bg-market-down/10 border border-market-down/30 text-market-down text-sm">{error}</div>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[#2D3A8C] dark:bg-[#6272C1] text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" />Subscribing...</>) : "Subscribe Free"}
                    </button>
                    <p className="text-xs text-muted-foreground text-center mt-3">Free email delivery. Unsubscribe anytime.</p>
                  </form>
                )}
              </div>

              <div className={`bg-terminal-bg-elevated border ${ACCENT_BORDER} p-6 text-center`}>
                <Landmark className={`h-6 w-6 ${ACCENT} mx-auto mb-3`} />
                <p className="text-sm font-semibold mb-2">Want the full platform?</p>
                <p className="text-xs text-muted-foreground mb-4">Get real-time data, analytics, and all three publications with a BGFI subscription.</p>
                <Link
                  href="/subscribe"
                  className={`inline-block w-full py-2 border border-[#2D3A8C] dark:border-[#6272C1] ${ACCENT} text-sm font-medium hover:bg-[#2D3A8C] hover:text-white dark:hover:bg-[#6272C1] transition-colors`}
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
