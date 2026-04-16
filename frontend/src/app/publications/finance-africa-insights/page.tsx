"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { researchService, type ResearchReport } from "@/services/api/research";
import { newsService } from "@/services/api/news";
import { PublicationListItem } from "@/components/publications/PublicationListItem";
import {
  Feather,
  Check,
  CaretRight,
  CircleNotch,
  Quotes,
  Scales,
  Compass,
  ChatCircle,
  Sparkle,
} from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { publicClient } from "@/services/api/client";
import { toast } from "sonner";

// Warm Amber accent
const ACCENT = "text-[#B45309] dark:text-[#F59E0B]";
const ACCENT_BG = "bg-[#B45309]/15 dark:bg-[#F59E0B]/15";
const ACCENT_BORDER = "border-[#B45309]/20 dark:border-[#F59E0B]/20";

const highlights = [
  "Curated editorial commentary on Africa's most important market developments",
  "Expert opinion pieces from economists, fund managers, and policy analysts",
  "Thematic deep-dives: governance, ESG, frontier markets, and monetary policy",
  "Cross-border investment analysis and regional integration updates",
  "Earnings season previews and post-results takeaways",
  "Central bank policy watch and interest rate analysis",
  "IPO and capital raise coverage across African exchanges",
];

const focusAreas = [
  {
    icon: <Quotes className="h-5 w-5 text-[#B45309] dark:text-[#F59E0B]" />,
    title: "Editorial Commentary",
    description: "Sharp, opinionated analysis that goes beyond the headlines to explain why markets are moving.",
  },
  {
    icon: <Scales className="h-5 w-5 text-[#B45309] dark:text-[#F59E0B]" />,
    title: "Macro & Policy",
    description: "Central bank decisions, fiscal policy shifts, and their impact on African asset classes.",
  },
  {
    icon: <Compass className="h-5 w-5 text-[#B45309] dark:text-[#F59E0B]" />,
    title: "Market Strategy",
    description: "Tactical insights on sector rotation, valuation opportunities, and risk management.",
  },
  {
    icon: <ChatCircle className="h-5 w-5 text-[#B45309] dark:text-[#F59E0B]" />,
    title: "Expert Voices",
    description: "Perspectives from Africa's leading investors, regulators, and corporate leaders.",
  },
];

// Real Unsplash images — African people, editorial, cities
const heroImages = [
  { flex: 1.6, height: '90%', bg: '#1A1008', url: 'https://images.unsplash.com/photo-1573164574511-73c773193279?auto=format&fit=crop&w=400&q=80' },
  { flex: 0.3, height: '50%', bg: '#241709', url: 'https://images.unsplash.com/photo-1669587918361-4b5e71fc9d43?auto=format&fit=crop&w=400&q=80' },
  { flex: 1.4, height: '100%', bg: '#2D1D0A', url: 'https://images.unsplash.com/photo-1655720357872-ce227e4164ba?auto=format&fit=crop&w=400&q=80' },
  { flex: 0.4, height: '55%', bg: '#1F1407', url: 'https://images.unsplash.com/photo-1672537638328-b80eefcf3e30?auto=format&fit=crop&w=400&q=80' },
  { flex: 1.8, height: '85%', bg: '#33220E', url: 'https://images.unsplash.com/photo-1687986261123-b17f08f2796c?auto=format&fit=crop&w=400&q=80' },
  { flex: 0.3, height: '48%', bg: '#1A1008', url: 'https://images.unsplash.com/photo-1634154955201-e7c93fd2a180?auto=format&fit=crop&w=400&q=80' },
  { flex: 1.2, height: '95%', bg: '#241709', url: 'https://images.unsplash.com/photo-1708772565599-2c4e4b3ed9db?auto=format&fit=crop&w=400&q=80' },
  { flex: 0.4, height: '60%', bg: '#2D1D0A', url: 'https://images.unsplash.com/photo-1550305080-4e029753abcf?auto=format&fit=crop&w=400&q=80' },
];

export default function FinanceAfricaInsightsPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [insightsArticles, setInsightsArticles] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      researchService.getReports({ report_type: "analysis", page_size: 20, ordering: "-published_at" }),
      newsService.getArticles({ content_type: "insights", page_size: 20 } as any),
    ])
      .then(([researchRes, newsRes]) => {
        if (researchRes.status === "fulfilled") {
          setReports(researchRes.value.results || []);
        }
        if (newsRes.status === "fulfilled") {
          setInsightsArticles((newsRes.value as any).results || []);
        }
      })
      .finally(() => setLoadingReports(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError("");

    try {
      await publicClient.post("/engagement/newsletters/", {
        email,
        newsletter_type: "finance_africa_insights",
      });
      setShowSuccess(true);
      toast.success("Subscribed to Finance Africa Insights!");
      setEmail("");
    } catch {
      setShowSuccess(true);
      toast.success("You're already subscribed!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <CaretRight className="h-3 w-3" />
          <span>Publications</span>
          <CaretRight className="h-3 w-3" />
          <span className="text-foreground">Finance Africa Insights</span>
        </nav>

        {/* Hero — The Letterpress: alternating wide/narrow strips, warm amber wash */}
        <section className="relative overflow-hidden mb-12" style={{ height: '420px' }}>
          <div className="absolute inset-0 flex items-start gap-[3px]">
            {heroImages.map((strip, i) => (
              <div key={i} className="relative overflow-hidden" style={{ flex: strip.flex, height: strip.height }}>
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundColor: strip.bg, backgroundImage: `url(${strip.url})` }}
                />
                <div className="absolute inset-0 bg-black/15" />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 bg-[#B45309]/[0.07] dark:bg-[#F59E0B]/[0.05] pointer-events-none" />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 12%, hsl(var(--background) / 0.92) 24%, hsl(var(--background) / 0.6) 42%, hsl(var(--background) / 0.2) 65%, transparent 100%)`,
            }}
          />

          <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-12 w-12 ${ACCENT_BG} backdrop-blur-sm flex items-center justify-center`}>
                <Feather className={`h-6 w-6 ${ACCENT}`} />
              </div>
              <span className={`px-3 py-1 ${ACCENT_BG} backdrop-blur-sm ${ACCENT} text-xs font-semibold uppercase tracking-wider border ${ACCENT_BORDER}`}>
                Weekly
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 font-serif">Finance Africa Insights</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Curated analysis and editorial commentary from Africa&apos;s sharpest financial minds. Every week, we distill the noise into the signal that matters for your portfolio.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="text-2xl font-bold mb-6">Content Focus Areas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {focusAreas.map((area) => (
                  <div key={area.title} className="p-5 bg-terminal-bg-secondary border border-terminal-border relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#B45309] dark:bg-[#F59E0B]" />
                    <div className="flex items-center gap-3 mb-3">
                      {area.icon}
                      <h3 className="font-semibold">{area.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{area.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6">What You&apos;ll Get</h2>
              <ul className="space-y-3">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CaretRight className={`h-4 w-4 ${ACCENT} flex-shrink-0 mt-0.5`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Insights articles — editorial pieces tagged content_type=insights */}
            {!loadingReports && insightsArticles.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-6">
                  <h2 className="text-2xl font-bold">Recent Insights</h2>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {insightsArticles.length} {insightsArticles.length === 1 ? "piece" : "pieces"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {insightsArticles.map((article) => (
                    <Link key={article.id} href={`/news/${article.slug}`} className="group">
                      <article className="bg-terminal-bg-secondary border border-terminal-border h-full hover:border-brand-violet/40 transition-colors overflow-hidden">
                        {(article.featured_image_url || article.featured_image) && (
                          <div className="relative aspect-[16/10] bg-terminal-bg-elevated overflow-hidden">
                            <Image
                              src={article.featured_image_url || article.featured_image}
                              alt={article.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="text-xs font-medium uppercase tracking-wider text-brand-violet mb-2">
                            {article.category?.name || "Insights"}
                          </div>
                          <h3 className="font-serif text-lg font-bold mb-2 leading-snug group-hover:text-brand-coral transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 font-serif-body">
                            {article.excerpt}
                          </p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Long-form research reports if any */}
            {!loadingReports && reports.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-6">
                  <h2 className="text-2xl font-bold">Research Reports</h2>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {reports.length} {reports.length === 1 ? "report" : "reports"}
                  </span>
                </div>
                <div className="space-y-6">
                  <PublicationListItem report={reports[0]} featured />
                  {reports.length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      {reports.slice(1).map((r) => (
                        <PublicationListItem key={r.id} report={r} />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <div>
            <div className="sticky top-24 space-y-6">
              <div className="relative overflow-hidden bg-terminal-bg-secondary border border-terminal-border p-6">
                <div className="absolute inset-0 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-[0.07] dark:opacity-[0.10]"><defs><pattern id="fai-sub-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(355, 70%, 38%)" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#fai-sub-grid)"/></svg></div>
                <h3 className="relative text-lg font-semibold mb-2">Subscribe to Finance Africa Insights</h3>
                <p className="text-sm text-muted-foreground mb-6">Weekly editorial and analysis, delivered every Monday morning.</p>

                {showSuccess ? (
                  <div className="bg-market-up/10 border border-market-up/30 p-5 text-center">
                    <Check className="h-8 w-8 text-market-up mx-auto mb-2" />
                    <p className="text-market-up font-semibold">You&apos;re subscribed!</p>
                    <p className="text-xs text-muted-foreground mt-1">Your first edition arrives next Monday.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full px-4 py-3 bg-terminal-bg-elevated border border-terminal-border focus:outline-none focus:border-[#B45309] dark:focus:border-[#F59E0B]" />
                    </div>
                    {error && <div className="mb-4 p-3 bg-market-down/10 border border-market-down/30 text-market-down text-sm">{error}</div>}
                    <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#B45309] dark:bg-[#F59E0B] text-white dark:text-black font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {isSubmitting ? (<><CircleNotch className="h-4 w-4 animate-spin" />Subscribing...</>) : "Subscribe Free"}
                    </button>
                    <p className="text-xs text-muted-foreground text-center mt-3">Free email delivery. Unsubscribe anytime.</p>
                  </form>
                )}
              </div>

              <div className={`relative overflow-hidden bg-terminal-bg-elevated border ${ACCENT_BORDER} p-6 text-center`}>
                <div className="absolute inset-0 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-[0.07] dark:opacity-[0.10]"><defs><pattern id="fai-cta-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(355, 70%, 38%)" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#fai-cta-grid)"/></svg></div>
                <Sparkle className={`relative h-6 w-6 ${ACCENT} mx-auto mb-3`} />
                <p className="text-sm font-semibold mb-2">Want the full platform?</p>
                <p className="text-xs text-muted-foreground mb-4">Get all three publications plus breaking news alerts and weekly digests — free.</p>
                <Link href="/subscribe" className={`inline-block w-full py-2 border border-[#B45309] dark:border-[#F59E0B] ${ACCENT} text-sm font-medium hover:bg-[#B45309] hover:text-white dark:hover:bg-[#F59E0B] dark:hover:text-black transition-colors`}>
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
