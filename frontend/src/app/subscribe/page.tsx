"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Star,
  TrendingUp,
  Bell,
  FileText,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthModal } from "@/contexts/AuthModalContext";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    usd: number;
    zar: number;
    ngn: number;
  };
  period: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

const plans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Essential market data and news",
    price: { usd: 0, zar: 0, ngn: 0 },
    period: "forever",
    features: [
      "Basic market data (15 min delay)",
      "10 articles per month",
      "Daily market summary email",
      "Basic stock screener",
      "Community access",
    ],
    cta: "Get Started",
  },
  {
    id: "premium",
    name: "Premium",
    description: "For active investors",
    price: { usd: 19.99, zar: 349, ngn: 15000 },
    period: "month",
    features: [
      "Real-time market data",
      "Unlimited article access",
      "Advanced stock screener",
      "Price alerts (up to 50)",
      "Portfolio tracking",
      "Earnings calendar",
      "Research reports",
      "Priority email support",
    ],
    highlighted: true,
    cta: "Start Free Trial",
  },
  {
    id: "professional",
    name: "Professional",
    description: "For financial professionals",
    price: { usd: 49.99, zar: 899, ngn: 45000 },
    period: "month",
    features: [
      "Everything in Premium",
      "API access",
      "Advanced analytics",
      "Unlimited price alerts",
      "Custom watchlists",
      "Historical data export",
      "Dedicated account manager",
      "Phone support",
    ],
    cta: "Contact Sales",
  },
];

const currencies = [
  { id: "usd", symbol: "$", label: "USD" },
  { id: "zar", symbol: "R", label: "ZAR" },
  { id: "ngn", symbol: "₦", label: "NGN" },
] as const;

type Currency = (typeof currencies)[number]["id"];

function PricingCard({
  plan,
  currency,
}: {
  plan: PricingPlan;
  currency: Currency;
}) {
  const currencyConfig = currencies.find((c) => c.id === currency)!;
  const price = plan.price[currency];

  return (
    <div
      className={cn(
        "relative p-6 rounded-lg border transition-all",
        plan.highlighted
          ? "border-brand-orange bg-terminal-bg-elevated scale-105 shadow-lg shadow-brand-orange/10"
          : "border-terminal-border bg-terminal-bg-secondary hover:border-brand-orange/50"
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-orange text-white text-xs font-semibold rounded-full">
          Most Popular
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">
            {currencyConfig.symbol}
            {price.toLocaleString()}
          </span>
          {plan.period !== "forever" && (
            <span className="text-muted-foreground">/{plan.period}</span>
          )}
        </div>
        {plan.period === "forever" && (
          <span className="text-sm text-muted-foreground">Free forever</span>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-market-up flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        className={cn(
          "w-full py-3 rounded-md font-medium transition-colors",
          plan.highlighted
            ? "bg-brand-orange text-white hover:bg-brand-orange-dark"
            : "bg-terminal-bg-elevated border border-terminal-border hover:border-brand-orange"
        )}
      >
        {plan.cta}
      </button>
    </div>
  );
}

export default function SubscribePage() {
  const [currency, setCurrency] = useState<Currency>("usd");
  const { openLogin } = useAuthModal();

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Get access to real-time African market data, premium research, and
            powerful tools to make better investment decisions.
          </p>

          {/* Currency Selector */}
          <div className="inline-flex items-center gap-1 p-1 bg-terminal-bg-elevated rounded-lg border border-terminal-border">
            {currencies.map((curr) => (
              <button
                key={curr.id}
                onClick={() => setCurrency(curr.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  currency === curr.id
                    ? "bg-brand-orange text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {curr.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} currency={currency} />
          ))}
        </div>

        {/* Features Grid */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <TrendingUp className="h-8 w-8 text-brand-orange mb-3" />
              <h3 className="font-semibold mb-2">Real-Time Data</h3>
              <p className="text-sm text-muted-foreground">
                Live market data from JSE, NGX, and other African exchanges.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <Bell className="h-8 w-8 text-brand-orange mb-3" />
              <h3 className="font-semibold mb-2">Price Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Set custom alerts and never miss a trading opportunity.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <FileText className="h-8 w-8 text-brand-orange mb-3" />
              <h3 className="font-semibold mb-2">Research Reports</h3>
              <p className="text-sm text-muted-foreground">
                In-depth analysis from our team of financial experts.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <Users className="h-8 w-8 text-brand-orange mb-3" />
              <h3 className="font-semibold mb-2">Expert Community</h3>
              <p className="text-sm text-muted-foreground">
                Connect with investors and analysts across Africa.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="group p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <summary className="flex items-center justify-between cursor-pointer font-medium">
                Can I cancel my subscription anytime?
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time. Your access
                will continue until the end of your current billing period.
              </p>
            </details>
            <details className="group p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <summary className="flex items-center justify-between cursor-pointer font-medium">
                What payment methods do you accept?
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, Amex) as
                well as PayPal. For African users, we also support mobile money
                and local bank transfers through Paystack.
              </p>
            </details>
            <details className="group p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <summary className="flex items-center justify-between cursor-pointer font-medium">
                Is there a free trial?
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Yes! Premium plans come with a 14-day free trial. No credit card
                required to start.
              </p>
            </details>
            <details className="group p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <summary className="flex items-center justify-between cursor-pointer font-medium">
                Do you offer team or enterprise plans?
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Yes, we offer custom enterprise plans for teams and
                organizations. Contact our sales team for a personalized quote.
              </p>
            </details>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center">
          <div className="p-8 rounded-lg bg-terminal-bg-elevated border border-brand-orange/30">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Start Investing Smarter?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join thousands of investors across Africa who trust Bard Global Finance Institute
              for their market intelligence needs.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={openLogin}
                className="px-6 py-3 border border-terminal-border rounded-md font-medium hover:bg-terminal-bg-elevated transition-colors"
              >
                Sign In
              </button>
              <button className="px-6 py-3 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-orange-dark transition-colors">
                Start Free Trial
              </button>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
