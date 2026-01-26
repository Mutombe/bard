"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Globe2, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-terminal py-16 md:py-24">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,107,0,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,107,0,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Real-time African Market Data
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              The{" "}
              <span className="text-brand-orange">Bloomberg</span>
              <br />
              of Africa
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
              Professional-grade market intelligence for African equities.
              Real-time data, institutional research, and breaking news
              from JSE, ZSE, BSE and more.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/markets">
                <Button variant="outline" size="lg">
                  Explore Markets
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 pt-8 border-t border-terminal-border">
              <p className="text-sm text-muted-foreground mb-4">
                Trusted by institutional investors across Africa
              </p>
              <div className="flex items-center gap-8 text-muted-foreground">
                <div>
                  <div className="text-2xl font-bold text-foreground">50K+</div>
                  <div className="text-xs">Active Users</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">7</div>
                  <div className="text-xs">Exchanges</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">2K+</div>
                  <div className="text-xs">Securities</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {/* Feature Card 1 */}
            <div className="card-terminal p-6 hover:border-brand-orange/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-market-up-bg flex items-center justify-center mb-4">
                <TrendingUp className="h-5 w-5 text-market-up" />
              </div>
              <h3 className="font-semibold mb-2">Real-Time Data</h3>
              <p className="text-sm text-muted-foreground">
                Live price feeds updated every 5 seconds during market hours
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="card-terminal p-6 hover:border-brand-orange/50 transition-colors mt-8">
              <div className="h-10 w-10 rounded-lg bg-brand-orange/10 flex items-center justify-center mb-4">
                <Globe2 className="h-5 w-5 text-brand-orange" />
              </div>
              <h3 className="font-semibold mb-2">Pan-African Coverage</h3>
              <p className="text-sm text-muted-foreground">
                JSE, ZSE, BSE, NSE, NGX, GSE, and EGX all in one platform
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="card-terminal p-6 hover:border-brand-orange/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <svg
                  className="h-5 w-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Advanced Charts</h3>
              <p className="text-sm text-muted-foreground">
                Professional charting with technical indicators and drawing tools
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="card-terminal p-6 hover:border-brand-orange/50 transition-colors mt-8">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <svg
                  className="h-5 w-5 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Smart Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Price alerts, breaking news, and earnings notifications
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
