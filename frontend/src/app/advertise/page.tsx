"use client";

import Link from "next/link";
import {
  BarChart3,
  Users,
  Globe,
  Mail,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Target,
  Newspaper,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const stats = [
  { value: "2.5M+", label: "Monthly Pageviews" },
  { value: "450K+", label: "Newsletter Subscribers" },
  { value: "120K+", label: "Social Followers" },
  { value: "45+", label: "African Countries" },
];

const audienceSegments = [
  { segment: "C-Suite Executives", percentage: 28 },
  { segment: "Investment Professionals", percentage: 24 },
  { segment: "Business Owners", percentage: 18 },
  { segment: "Financial Analysts", percentage: 15 },
  { segment: "Other Professionals", percentage: 15 },
];

const adFormats = [
  {
    name: "Display Advertising",
    description: "Premium banner placements across our platform with targeting options.",
    icon: BarChart3,
    features: ["Leaderboard", "Rectangle", "Skyscraper", "Mobile banners"],
  },
  {
    name: "Sponsored Content",
    description: "Native articles and thought leadership pieces that engage our audience.",
    icon: Newspaper,
    features: ["Native articles", "Research reports", "Whitepapers", "Case studies"],
  },
  {
    name: "Newsletter Sponsorship",
    description: "Reach our engaged email audience with dedicated or shared sponsorships.",
    icon: Mail,
    features: ["Daily briefing", "Weekly digest", "Dedicated sends", "Section sponsorship"],
  },
  {
    name: "Podcast & Video",
    description: "Audio and video sponsorships across our multimedia content.",
    icon: Radio,
    features: ["Pre-roll", "Mid-roll", "Host reads", "Branded segments"],
  },
];

const packages = [
  {
    name: "Standard",
    price: "From $2,500/month",
    description: "Ideal for targeted brand awareness",
    features: [
      "Display advertising (100K impressions)",
      "Basic audience targeting",
      "Monthly performance report",
      "Standard ad placements",
    ],
  },
  {
    name: "Premium",
    price: "From $7,500/month",
    description: "Comprehensive multi-channel presence",
    features: [
      "Display advertising (500K impressions)",
      "Newsletter sponsorship",
      "1 sponsored article",
      "Advanced audience targeting",
      "Weekly performance reports",
      "Premium ad placements",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom pricing",
    description: "Full-scale partnership opportunities",
    features: [
      "Unlimited impressions",
      "Exclusive sponsorships",
      "Multiple sponsored articles",
      "Webinar partnerships",
      "Custom integrations",
      "Dedicated account manager",
      "Real-time analytics",
    ],
  },
];

export default function AdvertisePage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="bg-terminal-bg-secondary border-b border-terminal-border">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Reach Africa's <span className="text-brand-orange">Financial Elite</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Connect your brand with decision-makers, investors, and business leaders
              across the African continent through Bard Global Finance Institute's trusted platform.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="mailto:advertising@Bard Global Finance Institute.com"
                className="px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors font-medium"
              >
                Contact Sales
              </a>
              <a
                href="#packages"
                className="px-6 py-3 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
              >
                View Packages
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-brand-orange mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Audience Section */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-4">Our Audience</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Bard Global Finance Institute attracts Africa's most influential business and financial professionals,
              offering advertisers access to high-value decision makers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Audience Breakdown */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-orange" />
                Audience Breakdown
              </h3>
              <div className="space-y-4">
                {audienceSegments.map((item) => (
                  <div key={item.segment}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.segment}</span>
                      <span className="font-mono">{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-terminal-bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-orange rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Demographics */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-brand-orange" />
                Key Demographics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-terminal-bg-elevated rounded-md">
                  <TrendingUp className="h-5 w-5 text-market-up" />
                  <div>
                    <div className="font-medium">Average Income</div>
                    <div className="text-sm text-muted-foreground">$150,000+ annually</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-terminal-bg-elevated rounded-md">
                  <Globe className="h-5 w-5 text-blue-400" />
                  <div>
                    <div className="font-medium">Geographic Reach</div>
                    <div className="text-sm text-muted-foreground">45+ African countries</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-terminal-bg-elevated rounded-md">
                  <Users className="h-5 w-5 text-purple-400" />
                  <div>
                    <div className="font-medium">Age Range</div>
                    <div className="text-sm text-muted-foreground">78% between 30-55 years</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-terminal-bg-elevated rounded-md">
                  <BarChart3 className="h-5 w-5 text-brand-orange" />
                  <div>
                    <div className="font-medium">Investment Activity</div>
                    <div className="text-sm text-muted-foreground">85% active investors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ad Formats */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-4">Advertising Solutions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from a variety of formats designed to achieve your marketing objectives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adFormats.map((format) => (
              <div key={format.name} className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-brand-orange/20 flex items-center justify-center">
                    <format.icon className="h-5 w-5 text-brand-orange" />
                  </div>
                  <h3 className="font-semibold">{format.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{format.description}</p>
                <div className="flex flex-wrap gap-2">
                  {format.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 bg-terminal-bg-elevated rounded text-xs"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Packages */}
        <div id="packages" className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-4">Advertising Packages</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Flexible packages to suit businesses of all sizes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={cn(
                  "bg-terminal-bg-secondary rounded-lg border p-6 flex flex-col",
                  pkg.highlighted
                    ? "border-brand-orange"
                    : "border-terminal-border"
                )}
              >
                {pkg.highlighted && (
                  <span className="px-3 py-1 bg-brand-orange text-white text-xs font-medium rounded self-start mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <div className="text-2xl font-bold text-brand-orange mb-2">{pkg.price}</div>
                <p className="text-sm text-muted-foreground mb-6">{pkg.description}</p>
                <ul className="space-y-3 mb-6 flex-1">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-market-up mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:advertising@Bard Global Finance Institute.com"
                  className={cn(
                    "block text-center py-3 rounded-md font-medium transition-colors",
                    pkg.highlighted
                      ? "bg-brand-orange text-white hover:bg-brand-orange-dark"
                      : "border border-terminal-border hover:bg-terminal-bg-elevated"
                  )}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Reach Your Audience?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our advertising team is ready to help you create a customized campaign
            that meets your business objectives.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:advertising@Bard Global Finance Institute.com"
              className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors font-medium"
            >
              <Mail className="h-4 w-4" />
              advertising@Bard Global Finance Institute.com
            </a>
            <Link
              href="/contact"
              className="flex items-center gap-2 px-6 py-3 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
            >
              Contact Us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
