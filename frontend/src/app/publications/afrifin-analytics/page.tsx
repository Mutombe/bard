"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DatabaseZap,
  Check,
  ChevronRight,
  Loader2,
  ArrowUpDown,
  Layers,
  Gauge,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import apiClient from "@/services/api/client";
import { toast } from "sonner";

// Teal/Cyan accent
const ACCENT = "text-[#0D7377] dark:text-[#2DD4BF]";
const ACCENT_BG = "bg-[#0D7377]/15 dark:bg-[#2DD4BF]/15";
const ACCENT_BORDER = "border-[#0D7377]/20 dark:border-[#2DD4BF]/20";

const highlights = [
  "Daily data snapshots covering equity indices, FX, and bond yields across Africa",
  "Interactive charts and visualizations tracking market momentum and volatility",
  "Sector heatmaps showing where capital is flowing and where it's leaving",
  "Quantitative screening: top performers, undervalued stocks, and momentum plays",
  "Currency and commodity correlation dashboards",
  "Liquidity and volume analysis for African exchanges",
  "Weekly statistical digest with downloadable datasets",
  "Custom alerts when key metrics cross significant thresholds",
];

const dataProducts = [
  {
    icon: <ArrowUpDown className="h-5 w-5 text-[#0D7377] dark:text-[#2DD4BF]" />,
    title: "Market Dashboards",
    description: "Real-time and historical charts across all major African indices, currencies, and benchmarks.",
  },
  {
    icon: <Layers className="h-5 w-5 text-[#0D7377] dark:text-[#2DD4BF]" />,
    title: "Sector Analytics",
    description: "Breakdown of sector performance, capital flows, and relative valuation metrics.",
  },
  {
    icon: <Gauge className="h-5 w-5 text-[#0D7377] dark:text-[#2DD4BF]" />,
    title: "Volatility Tracker",
    description: "Proprietary volatility and risk indices for frontier and emerging African markets.",
  },
  {
    icon: <SlidersHorizontal className="h-5 w-5 text-[#0D7377] dark:text-[#2DD4BF]" />,
    title: "Quant Screens",
    description: "Systematic screens for momentum, value, and quality factors across listed equities.",
  },
];

// Real Unsplash images — data, tech, fintech, trading
const heroImages = [
  { bg: '#041E1E', url: 'https://images.unsplash.com/photo-1759752394755-1241472b589d?auto=format&fit=crop&w=400&q=80' },
  { bg: '#062828', url: 'https://images.unsplash.com/photo-1748609700323-483a007ed311?auto=format&fit=crop&w=400&q=80' },
  { bg: '#083232', url: 'https://images.unsplash.com/photo-1748609664795-11546ad62000?auto=format&fit=crop&w=400&q=80' },
  { bg: '#0A1F1F', url: 'https://images.unsplash.com/photo-1744782211816-c5224434614f?auto=format&fit=crop&w=400&q=80' },
  { bg: '#052525', url: 'https://images.unsplash.com/photo-1662962602738-ae61aff7c3a7?auto=format&fit=crop&w=400&q=80' },
  { bg: '#041E1E', url: 'https://images.unsplash.com/photo-1768483538267-fce52de424d5?auto=format&fit=crop&w=400&q=80' },
  { bg: '#062828', url: 'https://images.unsplash.com/photo-1744868562210-fffb7fa882d9?auto=format&fit=crop&w=400&q=80' },
  { bg: '#083232', url: 'https://images.unsplash.com/photo-1595134334453-46c042d486f9?auto=format&fit=crop&w=400&q=80' },
];

export default function AfriFinAnalyticsPage() {
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
        newsletter_type: "afrifin_analytics",
      });
      setShowSuccess(true);
      toast.success("Subscribed to AfriFin Analytics!");
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
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Publications</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">AfriFin Analytics</span>
        </nav>

        {/* Hero — The Terminal: rigid 8-column grid, dot-grid overlay */}
        <section className="relative overflow-hidden mb-12" style={{ height: '360px' }}>
          <div className="absolute inset-0 grid grid-cols-8 gap-[2px]">
            {heroImages.map((img, i) => (
              <div key={i} className="relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundColor: img.bg, backgroundImage: `url(${img.url})` }}
                />
                <div className="absolute inset-0 bg-[#0D7377]/20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            ))}
          </div>

          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.08]"
            style={{ backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, backgroundSize: '16px 16px' }}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 12%, hsl(var(--background) / 0.92) 24%, hsl(var(--background) / 0.6) 42%, hsl(var(--background) / 0.2) 65%, transparent 100%)`,
            }}
          />

          <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-12 w-12 ${ACCENT_BG} backdrop-blur-sm flex items-center justify-center`}>
                <DatabaseZap className={`h-6 w-6 ${ACCENT}`} />
              </div>
              <span className={`px-3 py-1 ${ACCENT_BG} backdrop-blur-sm ${ACCENT} text-xs font-semibold uppercase tracking-wider border ${ACCENT_BORDER}`}>
                Daily
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 font-serif">AfriFin Analytics</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Data-driven market intelligence for quantitative and systematic investors. Charts, metrics, and screens that cut through the noise with numbers, not narratives.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="text-2xl font-bold mb-6">What Subscribers Get</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dataProducts.map((product, index) => (
                  <div key={product.title} className="p-4 bg-terminal-bg-secondary border border-terminal-border relative">
                    <span className="absolute top-3 right-3 text-xs font-mono text-[#0D7377]/40 dark:text-[#2DD4BF]/30">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-3 mb-2">
                      {product.icon}
                      <h3 className="font-semibold">{product.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6">What You&apos;ll Get</h2>
              <ul className="space-y-3">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="mt-2 h-1.5 w-1.5 bg-[#0D7377] dark:bg-[#2DD4BF] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div>
            <div className="sticky top-24 space-y-6">
              <div className="bg-terminal-bg-secondary border border-terminal-border p-6">
                <h3 className="text-lg font-semibold mb-2">Subscribe to AfriFin Analytics</h3>
                <p className="text-sm text-muted-foreground mb-6">Daily data snapshots and weekly statistical digests, straight to your inbox.</p>

                {showSuccess ? (
                  <div className="bg-market-up/10 border border-market-up/30 p-5 text-center">
                    <Check className="h-8 w-8 text-market-up mx-auto mb-2" />
                    <p className="text-market-up font-semibold">You&apos;re subscribed!</p>
                    <p className="text-xs text-muted-foreground mt-1">Your first data snapshot arrives tomorrow.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full px-4 py-3 bg-terminal-bg-elevated border border-terminal-border focus:outline-none focus:border-[#0D7377] dark:focus:border-[#2DD4BF]" />
                    </div>
                    {error && <div className="mb-4 p-3 bg-market-down/10 border border-market-down/30 text-market-down text-sm">{error}</div>}
                    <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#0D7377] dark:bg-[#2DD4BF] text-white dark:text-black font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" />Subscribing...</>) : "Subscribe Free"}
                    </button>
                    <p className="text-xs text-muted-foreground text-center mt-3">Free email delivery. Unsubscribe anytime.</p>
                  </form>
                )}
              </div>

              <div className={`bg-terminal-bg-elevated border ${ACCENT_BORDER} p-6 text-center`}>
                <Zap className={`h-6 w-6 ${ACCENT} mx-auto mb-3`} />
                <p className="text-sm font-semibold mb-2">Want the full platform?</p>
                <p className="text-xs text-muted-foreground mb-4">Get all three publications plus breaking news alerts and weekly digests — free.</p>
                <Link href="/subscribe" className={`inline-block w-full py-2 border border-[#0D7377] dark:border-[#2DD4BF] ${ACCENT} text-sm font-medium hover:bg-[#0D7377] hover:text-white dark:hover:bg-[#2DD4BF] dark:hover:text-black transition-colors`}>
                  Subscribe Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
