"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Check,
  ChevronRight,
  Loader2,
  TrendingUp,
  LineChart,
  PieChart,
  Activity,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import apiClient from "@/services/api/client";
import { toast } from "sonner";

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
    icon: <LineChart className="h-5 w-5 text-brand-orange" />,
    title: "Market Dashboards",
    description:
      "Real-time and historical charts across all major African indices, currencies, and benchmarks.",
  },
  {
    icon: <PieChart className="h-5 w-5 text-brand-orange" />,
    title: "Sector Analytics",
    description:
      "Breakdown of sector performance, capital flows, and relative valuation metrics.",
  },
  {
    icon: <Activity className="h-5 w-5 text-brand-orange" />,
    title: "Volatility Tracker",
    description:
      "Proprietary volatility and risk indices for frontier and emerging African markets.",
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-brand-orange" />,
    title: "Quant Screens",
    description:
      "Systematic screens for momentum, value, and quality factors across listed equities.",
  },
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
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span>Publications</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">AfriFin Analytics</span>
        </nav>

        {/* Hero */}
        <section className="bg-terminal-bg-elevated rounded-lg p-8 md:p-12 mb-12 border border-terminal-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-brand-orange/20 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-brand-orange" />
            </div>
            <span className="px-3 py-1 bg-brand-orange/20 text-brand-orange text-xs font-semibold rounded-full uppercase tracking-wider">
              Daily
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 font-serif">
            AfriFin Analytics
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Data-driven market intelligence for quantitative and systematic
            investors. Charts, metrics, and screens that cut through the noise
            with numbers, not narratives.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Data Products */}
            <section>
              <h2 className="text-2xl font-bold mb-6">
                What Subscribers Get
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dataProducts.map((product) => (
                  <div
                    key={product.title}
                    className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {product.icon}
                      <h3 className="font-semibold">{product.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Highlights */}
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
          </div>

          {/* Sidebar - Subscribe Form */}
          <div>
            <div className="sticky top-24 space-y-6">
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                <h3 className="text-lg font-semibold mb-2">
                  Subscribe to AfriFin Analytics
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Daily data snapshots and weekly statistical digests, straight
                  to your inbox.
                </p>

                {showSuccess ? (
                  <div className="bg-market-up/10 border border-market-up/30 rounded-lg p-5 text-center">
                    <Check className="h-8 w-8 text-market-up mx-auto mb-2" />
                    <p className="text-market-up font-semibold">
                      You&apos;re subscribed!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your first data snapshot arrives tomorrow.
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
