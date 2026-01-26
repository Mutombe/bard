"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  Sparkles,
  Crown,
  Building2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlanFeature {
  name: string;
  included: boolean;
  description?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  planType: "free" | "premium" | "professional" | "enterprise";
  description: string;
  priceUsd: number;
  billingCycle: "monthly" | "quarterly" | "annual";
  features: PlanFeature[];
  articleLimit: number;
  apiCallsLimit: number;
  portfolioLimit: number;
  watchlistLimit: number;
  alertLimit: number;
  isFeatured: boolean;
  trialDays: number;
}

interface PricingCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
  isLoading?: boolean;
  currency?: "USD" | "ZAR" | "NGN";
}

const planIcons = {
  free: User,
  premium: Sparkles,
  professional: Crown,
  enterprise: Building2,
};

const planColors = {
  free: "from-slate-500 to-slate-600",
  premium: "from-blue-500 to-blue-600",
  professional: "from-purple-500 to-purple-600",
  enterprise: "from-amber-500 to-amber-600",
};

export function PricingCard({
  plan,
  isCurrentPlan = false,
  onSelect,
  isLoading = false,
  currency = "USD",
}: PricingCardProps) {
  const Icon = planIcons[plan.planType];
  const gradientClass = planColors[plan.planType];

  const formatPrice = (cents: number) => {
    const symbols: Record<string, string> = {
      USD: "$",
      ZAR: "R",
      NGN: "₦",
    };
    const symbol = symbols[currency] || "$";
    return `${symbol}${(cents / 100).toFixed(0)}`;
  };

  const getBillingPeriod = () => {
    switch (plan.billingCycle) {
      case "annual":
        return "/year";
      case "quarterly":
        return "/quarter";
      default:
        return "/month";
    }
  };

  const getMonthlyEquivalent = () => {
    const months = {
      monthly: 1,
      quarterly: 3,
      annual: 12,
    };
    const monthlyPrice = plan.priceUsd / months[plan.billingCycle];
    return formatPrice(monthlyPrice);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card overflow-hidden",
        plan.isFeatured && "border-primary shadow-lg shadow-primary/10",
        isCurrentPlan && "ring-2 ring-primary"
      )}
    >
      {/* Featured badge */}
      {plan.isFeatured && (
        <div className="absolute top-0 right-0">
          <div className={cn(
            "bg-gradient-to-r text-white text-xs font-medium px-3 py-1 rounded-bl-lg",
            gradientClass
          )}>
            Most Popular
          </div>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute top-0 left-0">
          <div className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-br-lg">
            Current Plan
          </div>
        </div>
      )}

      {/* Header */}
      <div className={cn(
        "p-6 bg-gradient-to-br",
        gradientClass
      )}>
        <div className="flex items-center gap-3 text-white mb-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-sm text-white/80">{plan.description}</p>
          </div>
        </div>

        {/* Price */}
        <div className="text-white">
          {plan.priceUsd === 0 ? (
            <div className="text-4xl font-bold">Free</div>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  {formatPrice(plan.priceUsd)}
                </span>
                <span className="text-white/80">{getBillingPeriod()}</span>
              </div>
              {plan.billingCycle !== "monthly" && (
                <div className="text-sm text-white/70 mt-1">
                  {getMonthlyEquivalent()}/month equivalent
                </div>
              )}
            </>
          )}
        </div>

        {/* Trial badge */}
        {plan.trialDays > 0 && (
          <div className="mt-3 inline-block bg-white/20 text-white text-xs px-2 py-1 rounded-full">
            {plan.trialDays}-day free trial
          </div>
        )}
      </div>

      {/* Features */}
      <div className="flex-1 p-6">
        <div className="text-sm font-medium text-muted-foreground mb-4">
          What&apos;s included:
        </div>
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <motion.li
              key={feature.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-2"
            >
              {feature.included ? (
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
              )}
              <span className={cn(
                "text-sm",
                !feature.included && "text-muted-foreground/50"
              )}>
                {feature.name}
              </span>
            </motion.li>
          ))}
        </ul>

        {/* Limits */}
        <div className="mt-6 pt-6 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Premium articles</span>
            <span className="font-medium font-mono">
              {plan.articleLimit === 0 ? "Unlimited" : `${plan.articleLimit}/mo`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">API calls</span>
            <span className="font-medium font-mono">
              {plan.apiCallsLimit === 0 ? "Unlimited" : `${plan.apiCallsLimit}/mo`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Portfolios</span>
            <span className="font-medium font-mono">{plan.portfolioLimit}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price alerts</span>
            <span className="font-medium font-mono">{plan.alertLimit}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-6 pt-0">
        <Button
          className={cn(
            "w-full",
            plan.isFeatured && "bg-gradient-to-r from-primary to-primary/80"
          )}
          variant={plan.isFeatured ? "default" : "outline"}
          size="lg"
          disabled={isCurrentPlan || isLoading}
          onClick={() => onSelect(plan)}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <motion.div
                className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Processing...
            </span>
          ) : isCurrentPlan ? (
            "Current Plan"
          ) : plan.priceUsd === 0 ? (
            "Get Started Free"
          ) : (
            `Upgrade to ${plan.name}`
          )}
        </Button>
      </div>
    </motion.div>
  );
}

/**
 * Plan comparison toggle for billing cycle selection.
 */
interface BillingToggleProps {
  value: "monthly" | "annual";
  onChange: (value: "monthly" | "annual") => void;
  savings?: number;
}

export function BillingToggle({ value, onChange, savings = 20 }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        className={cn(
          "text-sm font-medium transition-colors",
          value === "monthly" ? "text-foreground" : "text-muted-foreground"
        )}
        onClick={() => onChange("monthly")}
      >
        Monthly
      </button>

      <button
        className="relative h-7 w-14 rounded-full bg-muted p-1 transition-colors"
        onClick={() => onChange(value === "monthly" ? "annual" : "monthly")}
      >
        <motion.div
          className="h-5 w-5 rounded-full bg-primary"
          animate={{ x: value === "annual" ? 26 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>

      <div className="flex items-center gap-2">
        <button
          className={cn(
            "text-sm font-medium transition-colors",
            value === "annual" ? "text-foreground" : "text-muted-foreground"
          )}
          onClick={() => onChange("annual")}
        >
          Annual
        </button>
        {savings > 0 && (
          <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-medium">
            Save {savings}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Currency selector for pricing display.
 */
interface CurrencySelectorProps {
  value: "USD" | "ZAR" | "NGN";
  onChange: (value: "USD" | "ZAR" | "NGN") => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const currencies = [
    { code: "USD" as const, label: "USD ($)", flag: "🇺🇸" },
    { code: "ZAR" as const, label: "ZAR (R)", flag: "🇿🇦" },
    { code: "NGN" as const, label: "NGN (₦)", flag: "🇳🇬" },
  ];

  return (
    <div className="flex items-center gap-2">
      {currencies.map((currency) => (
        <button
          key={currency.code}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
            value === currency.code
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onChange(currency.code)}
        >
          <span>{currency.flag}</span>
          <span>{currency.code}</span>
        </button>
      ))}
    </div>
  );
}
