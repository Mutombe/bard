"use client";

import { useState } from "react";
import {
  Mail,
  Check,
  Clock,
  Users,
  TrendingUp,
  Globe,
  Briefcase,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Newsletter {
  id: string;
  title: string;
  description: string;
  frequency: string;
  subscribers: string;
  icon: React.ReactNode;
  sample: string[];
}

const newsletters: Newsletter[] = [
  {
    id: "daily-brief",
    title: "Daily Market Brief",
    description: "Start your day with a comprehensive overview of African markets. Key moves, breaking news, and what to watch.",
    frequency: "Every weekday at 6:00 AM",
    subscribers: "45,000+",
    icon: <TrendingUp className="h-6 w-6" />,
    sample: [
      "Market summary across all African exchanges",
      "Top movers and breaking stories",
      "Currency and commodity updates",
      "Economic calendar for the day",
    ],
  },
  {
    id: "weekly-digest",
    title: "Weekly Digest",
    description: "A curated selection of the week's most important stories, analysis, and market performance summaries.",
    frequency: "Every Saturday at 9:00 AM",
    subscribers: "68,000+",
    icon: <BarChart3 className="h-6 w-6" />,
    sample: [
      "Week in review: Top 10 stories",
      "Market performance recap",
      "Featured analysis and opinions",
      "Upcoming events to watch",
    ],
  },
  {
    id: "global-africa",
    title: "Global Africa",
    description: "How global events impact African markets. Coverage of international trade, policy, and investment flows.",
    frequency: "Twice weekly",
    subscribers: "32,000+",
    icon: <Globe className="h-6 w-6" />,
    sample: [
      "Global macro trends affecting Africa",
      "Foreign investment updates",
      "Trade policy analysis",
      "Currency outlook",
    ],
  },
  {
    id: "ceo-weekly",
    title: "CEO Weekly",
    description: "Executive insights, leadership changes, and strategic moves from Africa's top companies.",
    frequency: "Every Monday",
    subscribers: "28,000+",
    icon: <Briefcase className="h-6 w-6" />,
    sample: [
      "Executive appointments and departures",
      "Strategic announcements",
      "M&A activity",
      "Exclusive CEO interviews",
    ],
  },
];

export default function NewslettersPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubscribe = (id: string) => {
    if (subscribed.includes(id)) {
      setSubscribed(subscribed.filter((s) => s !== id));
    } else {
      setSubscribed([...subscribed, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && subscribed.length > 0) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Mail className="h-12 w-12 text-brand-orange mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Newsletters</h1>
          <p className="text-muted-foreground text-lg">
            Get African market intelligence delivered straight to your inbox. Choose the newsletters that match your interests.
          </p>
        </div>

        {/* Newsletter Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {newsletters.map((newsletter) => (
            <div
              key={newsletter.id}
              className={cn(
                "bg-terminal-bg-secondary rounded-lg border p-6 transition-colors cursor-pointer",
                subscribed.includes(newsletter.id)
                  ? "border-brand-orange"
                  : "border-terminal-border hover:border-terminal-border-light"
              )}
              onClick={() => handleSubscribe(newsletter.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-brand-orange/20 text-brand-orange flex items-center justify-center">
                    {newsletter.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{newsletter.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {newsletter.frequency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {newsletter.subscribers}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    subscribed.includes(newsletter.id)
                      ? "bg-brand-orange border-brand-orange"
                      : "border-terminal-border"
                  )}
                >
                  {subscribed.includes(newsletter.id) && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">{newsletter.description}</p>
              <div className="border-t border-terminal-border pt-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  What you&apos;ll receive:
                </div>
                <ul className="grid grid-cols-2 gap-2">
                  {newsletter.sample.map((item, index) => (
                    <li
                      key={index}
                      className="text-xs text-muted-foreground flex items-start gap-2"
                    >
                      <Check className="h-3 w-3 text-market-up mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Subscribe Form */}
        <div className="max-w-xl mx-auto bg-terminal-bg-secondary rounded-lg border border-terminal-border p-8">
          <h2 className="text-xl font-semibold text-center mb-6">
            Subscribe to Selected Newsletters
          </h2>

          {showSuccess ? (
            <div className="bg-market-up/10 border border-market-up/30 rounded-lg p-4 text-center">
              <Check className="h-8 w-8 text-market-up mx-auto mb-2" />
              <p className="text-market-up font-medium">Successfully subscribed!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check your email to confirm your subscription.
              </p>
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
                  className="w-full px-4 py-3 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="mb-6">
                <div className="text-sm text-muted-foreground mb-2">
                  Selected newsletters ({subscribed.length}):
                </div>
                {subscribed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Click on a newsletter above to select it.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subscribed.map((id) => {
                      const newsletter = newsletters.find((n) => n.id === id);
                      return (
                        <span
                          key={id}
                          className="px-2 py-1 text-xs bg-brand-orange/20 text-brand-orange rounded"
                        >
                          {newsletter?.title}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={subscribed.length === 0}
                className="w-full py-3 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Subscribe Now
              </button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                You can unsubscribe at any time. By subscribing, you agree to our{" "}
                <a href="/privacy" className="text-brand-orange hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
