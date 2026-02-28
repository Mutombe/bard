"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Mail,
  Bell,
  FileText,
  ArrowRight,
  Library,
  Feather,
  DatabaseZap,
  Loader2,
  Newspaper,
  TrendingUp,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import apiClient from "@/services/api/client";
import { toast } from "sonner";

const newsletters = [
  {
    id: "morning_brief",
    name: "Morning Brief",
    description: "Daily market summary and top stories delivered before the opening bell.",
    frequency: "Daily",
    icon: <Mail className="h-5 w-5" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  {
    id: "finance_africa_quarterly",
    name: "Finance Africa Quarterly",
    description: "Flagship journal with deep-dive reports on African financial markets.",
    frequency: "Quarterly",
    icon: <Library className="h-5 w-5" />,
    color: "text-[#2D3A8C] dark:text-[#6272C1]",
    bgColor: "bg-[#2D3A8C]/10 dark:bg-[#6272C1]/10",
    borderColor: "border-[#2D3A8C]/20 dark:border-[#6272C1]/20",
    href: "/publications/finance-africa-quarterly",
  },
  {
    id: "finance_africa_insights",
    name: "Finance Africa Insights",
    description: "Curated editorial commentary and expert analysis every week.",
    frequency: "Weekly",
    icon: <Feather className="h-5 w-5" />,
    color: "text-[#B45309] dark:text-[#F59E0B]",
    bgColor: "bg-[#B45309]/10 dark:bg-[#F59E0B]/10",
    borderColor: "border-[#B45309]/20 dark:border-[#F59E0B]/20",
    href: "/publications/finance-africa-insights",
  },
  {
    id: "afrifin_analytics",
    name: "AfriFin Analytics",
    description: "Data-driven market intelligence with charts, metrics, and quant screens.",
    frequency: "Daily",
    icon: <DatabaseZap className="h-5 w-5" />,
    color: "text-[#0D7377] dark:text-[#2DD4BF]",
    bgColor: "bg-[#0D7377]/10 dark:bg-[#2DD4BF]/10",
    borderColor: "border-[#0D7377]/20 dark:border-[#2DD4BF]/20",
    href: "/publications/afrifin-analytics",
  },
  {
    id: "breaking_news",
    name: "Breaking News Alerts",
    description: "Instant notifications when major market events or breaking news occur.",
    frequency: "As it happens",
    icon: <Bell className="h-5 w-5" />,
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    id: "weekly_digest",
    name: "Weekly Digest",
    description: "A comprehensive roundup of the week's most important stories and data.",
    frequency: "Weekly",
    icon: <Newspaper className="h-5 w-5" />,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
  },
];

const benefits = [
  { icon: <TrendingUp className="h-6 w-6 text-primary" />, title: "Market Intelligence", description: "Stay ahead with real-time African market analysis and insights delivered to your inbox." },
  { icon: <Globe className="h-6 w-6 text-primary" />, title: "Pan-African Coverage", description: "15+ economies covered across Southern, East, West, and North Africa." },
  { icon: <FileText className="h-6 w-6 text-primary" />, title: "Expert Research", description: "Original research reports, sector deep-dives, and macro analysis from our team." },
  { icon: <Bell className="h-6 w-6 text-primary" />, title: "Never Miss a Beat", description: "Custom alerts and breaking news notifications for the events that matter most." },
];

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [selectedNewsletters, setSelectedNewsletters] = useState<string[]>(["morning_brief"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleNewsletter = (id: string) => {
    setSelectedNewsletters((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (selectedNewsletters.length === 0) {
      toast.error("Please select at least one newsletter");
      return;
    }

    setIsSubmitting(true);
    try {
      // Subscribe to each selected newsletter
      await Promise.all(
        selectedNewsletters.map((type) =>
          apiClient.post("/engagement/newsletters/", {
            email,
            newsletter_type: type,
          })
        )
      );
      setShowSuccess(true);
      toast.success(`Subscribed to ${selectedNewsletters.length} newsletter${selectedNewsletters.length > 1 ? "s" : ""}!`);
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.email) {
        toast.error("This email is already subscribed");
      } else {
        toast.error("Failed to subscribe. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12">
        {/* Hero */}
        <div className="relative text-center mb-16">
          {/* Grid pattern background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -mx-4 md:-mx-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-[0.08] dark:opacity-[0.10]">
              <defs>
                <pattern id="sub-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(355, 70%, 38%)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#sub-grid)" />
            </svg>
          </div>

          <div className="relative py-8">
            <div className="w-8 h-0.5 bg-primary mx-auto mb-6" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4 font-serif">
              Stay Informed. Stay Ahead.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
              Subscribe to our free newsletters and get African market intelligence,
              expert analysis, and breaking news delivered straight to your inbox.
            </p>
            <p className="text-sm text-primary font-medium">
              100% free. No credit card required. Unsubscribe anytime.
            </p>
          </div>
        </div>

        {showSuccess ? (
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="bg-terminal-bg-secondary border border-terminal-border p-8">
              <div className="w-16 h-16 bg-market-up/20 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-market-up" />
              </div>
              <h2 className="text-2xl font-bold mb-2 font-serif">You&apos;re All Set!</h2>
              <p className="text-muted-foreground mb-6">
                You&apos;ve been subscribed to {selectedNewsletters.length} newsletter{selectedNewsletters.length > 1 ? "s" : ""}.
                Check your inbox for a confirmation email.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/" className="px-6 py-3 bg-primary text-white font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                  Explore Content <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setEmail("");
                    setSelectedNewsletters(["morning_brief"]);
                  }}
                  className="px-6 py-3 border border-terminal-border font-medium hover:bg-terminal-bg-elevated transition-colors"
                >
                  Subscribe Another Email
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Main subscribe form + newsletter selection */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
              {/* Newsletter Selection */}
              <div className="lg:col-span-7">
                <h2 className="text-xl font-bold mb-2">Choose Your Newsletters</h2>
                <p className="text-sm text-muted-foreground mb-6">Select the publications you want to receive. You can change these anytime.</p>

                <div className="space-y-3">
                  {newsletters.map((nl) => (
                    <button
                      key={nl.id}
                      type="button"
                      onClick={() => toggleNewsletter(nl.id)}
                      className={cn(
                        "w-full text-left p-4 border transition-all",
                        selectedNewsletters.includes(nl.id)
                          ? `bg-terminal-bg-secondary ${nl.borderColor} border-2`
                          : "bg-terminal-bg border-terminal-border hover:border-muted-foreground/30"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn("h-10 w-10 flex items-center justify-center flex-shrink-0", nl.bgColor, nl.color)}>
                          {nl.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{nl.name}</h3>
                            <span className={cn("text-xs font-medium px-2 py-0.5", nl.bgColor, nl.color)}>
                              {nl.frequency}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{nl.description}</p>
                          {nl.href && (
                            <Link
                              href={nl.href}
                              onClick={(e) => e.stopPropagation()}
                              className={cn("inline-flex items-center gap-1 text-xs font-medium mt-1 hover:underline", nl.color)}
                            >
                              Learn more <ChevronRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                        <div className={cn(
                          "h-5 w-5 border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors",
                          selectedNewsletters.includes(nl.id)
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        )}>
                          {selectedNewsletters.includes(nl.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscribe Form (sticky sidebar) */}
              <div className="lg:col-span-5">
                <div className="sticky top-24">
                  <div className="bg-terminal-bg-secondary border border-terminal-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Subscribe for Free</h3>
                        <p className="text-xs text-muted-foreground">No payment required</p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          className="w-full px-4 py-3 bg-terminal-bg-elevated border border-terminal-border focus:outline-none focus:border-primary text-base"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || selectedNewsletters.length === 0}
                        className="w-full py-3 bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-press"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Subscribing...</>
                        ) : (
                          <>
                            Subscribe to {selectedNewsletters.length} Newsletter{selectedNewsletters.length !== 1 ? "s" : ""}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>

                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-muted-foreground text-center">
                          Free forever. No spam. Unsubscribe with one click.
                        </p>
                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-market-up" /> No credit card
                          </span>
                          <span className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-market-up" /> Instant delivery
                          </span>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Selected summary */}
                  {selectedNewsletters.length > 0 && (
                    <div className="mt-4 p-4 bg-terminal-bg-elevated border border-terminal-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Selected</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedNewsletters.map((id) => {
                          const nl = newsletters.find((n) => n.id === id);
                          if (!nl) return null;
                          return (
                            <span key={id} className={cn("text-xs px-2 py-1 font-medium", nl.bgColor, nl.color)}>
                              {nl.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Why Subscribe */}
            <section className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold font-serif">Why Subscribe?</h2>
                <p className="text-muted-foreground mt-2">Everything you need to navigate African financial markets.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="p-5 bg-terminal-bg-secondary border border-terminal-border">
                    <div className="mb-3">{benefit.icon}</div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8 font-serif">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <details className="group p-4 bg-terminal-bg-secondary border border-terminal-border">
                  <summary className="flex items-center justify-between cursor-pointer font-medium">
                    Is this really free?
                    <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Yes, all our email newsletters are completely free. We believe in making African market intelligence accessible to everyone.
                  </p>
                </details>
                <details className="group p-4 bg-terminal-bg-secondary border border-terminal-border">
                  <summary className="flex items-center justify-between cursor-pointer font-medium">
                    How often will I receive emails?
                    <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">
                    It depends on which newsletters you subscribe to. The Morning Brief and AfriFin Analytics are daily, Finance Africa Insights is weekly, and Finance Africa Quarterly is once per quarter. Breaking news alerts are sent as events occur.
                  </p>
                </details>
                <details className="group p-4 bg-terminal-bg-secondary border border-terminal-border">
                  <summary className="flex items-center justify-between cursor-pointer font-medium">
                    Can I unsubscribe anytime?
                    <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Absolutely. Every email includes a one-click unsubscribe link. You can also manage your preferences from your profile settings.
                  </p>
                </details>
                <details className="group p-4 bg-terminal-bg-secondary border border-terminal-border">
                  <summary className="flex items-center justify-between cursor-pointer font-medium">
                    Can I subscribe to multiple newsletters?
                    <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Yes! Select as many newsletters as you like. Each one covers different aspects of African markets, so subscribing to multiple gives you the most comprehensive coverage.
                  </p>
                </details>
              </div>
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}
