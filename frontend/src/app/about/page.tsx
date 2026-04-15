"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  Users,
  TrendUp,
  Target,
  BookOpen,
  FileText,
  Envelope,
  Shield,
  Lightbulb,
  Scales,
  ChartLineUp,
  Briefcase,
  MapPin,
  Phone,
} from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";

const publications = [
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Finance Africa Quarterly",
    tagline: "Flagship quarterly journal",
    description:
      "In-depth quarterly analysis of African markets, featuring long-form investigative pieces, sector deep-dives, and economic outlook reports. The journal through which we interpret investable frontiers.",
    href: "/publications/finance-africa-quarterly",
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: "Africa Finance Insights",
    tagline: "Editorial & thematic analysis",
    description:
      "Focused commentary and deep dives into specific investment themes shaping capital flows across African jurisdictions.",
    href: "/publications/finance-africa-insights",
  },
  {
    icon: <ChartLineUp className="h-6 w-6" />,
    title: "AfriFin Analytics",
    tagline: "Rigorous econometric & fundamental analysis",
    description:
      "Data-driven intelligence: proprietary models, fundamental analysis, and econometric research for institutional decision-makers.",
    href: "/publications/afrifin-analytics",
  },
];

const values = [
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Deep, Reliable Research",
    description:
      "Fundamental and technical interpretations that help readers make strategic, high-yield investment decisions grounded in the realities of African markets.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Africa-Based, Globally Minded",
    description:
      "We are rooted on the continent and speak to both global capital seeking emerging-market exposure and African entities expanding across jurisdictions.",
  },
  {
    icon: <Scales className="h-6 w-6" />,
    title: "Editorial Independence",
    description:
      "Our research sits independent of commercial interests. Our mandate is to surface opportunities, not to promote them.",
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: "Contextualised Risk",
    description:
      "We do not minimise frontier-market risks — we contextualise them. Informed capital is transformative capital.",
  },
];

const team = [
  { name: "Shep Mpambela", role: "Founder, Publisher & Editor-in-Chief", email: "shephard@bgfi.global" },
  { name: "Chris Muronzi", role: "Editor", email: "chris@bgfi.global" },
  { name: "Mollen Chamisa", role: "Sub Editor · Production & Layout", email: "mollen@bgfi.global" },
  { name: "Farai Mabeza", role: "Contributor", email: "farai@bgfi.global" },
  { name: "Belinda Chiroodza", role: "Contributor", email: "belinda@bgfi.global" },
  { name: "Tinashe Kaduwo", role: "Contributor", email: "tinashe@bgfi.global" },
];

const serves = [
  {
    title: "Offshore Institutional Investors",
    description:
      "Funds, pension plans, and sovereign wealth vehicles seeking exposure to emerging and frontier African markets need nuanced, sector-specific intelligence — not generalised risk narratives.",
  },
  {
    title: "Continental Entities",
    description:
      "African corporates, family offices, and financial institutions expanding across jurisdictions on the continent need specialist macroeconomic advisory to navigate differing regulatory, tax, and market conditions.",
  },
  {
    title: "Policy Makers & Development Partners",
    description:
      "Decision-makers shaping continental policy — AfCFTA implementation, monetary policy, industrialisation strategy — benefit from rigorous, impartial research into outcomes across jurisdictions.",
  },
];

export default function AboutPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-brand-plum text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-plum via-brand-plum/95 to-brand-plum/70" />
          <Image
            src="https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1920&h=800&fit=crop"
            alt="Africa's financial horizon"
            fill
            className="object-cover opacity-20"
            unoptimized
            priority
          />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-brand-coral mb-5">
              Bard Global Finance Institute · BGFI
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The Imperative of <span className="text-brand-coral">Informed Capital</span>
            </h1>
            <p className="text-lg md:text-xl text-white/85 mb-8 leading-relaxed font-serif-body">
              BGFI is an Africa-based global finance research and consulting institute. Our mandate: to interpret African economic conditions and surface actionable investment opportunities for the global investor.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/publications/finance-africa-quarterly"
                className="inline-flex items-center gap-2 px-5 py-3 bg-brand-coral text-white text-sm font-semibold uppercase tracking-wider hover:bg-brand-coral-dark transition-colors"
              >
                <FileText className="h-4 w-4" />
                Read Finance Africa Quarterly
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-3 border border-white/30 text-white text-sm font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors"
              >
                <Envelope className="h-4 w-4" />
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        {/* Why We Exist */}
        <section className="py-16 md:py-20 border-b border-terminal-border">
          <div className="max-w-4xl">
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-4">
              Why We Exist
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8 leading-tight">
              Bridging the information asymmetry between global capital and African opportunity
            </h2>
            <div className="space-y-5 text-lg md:text-xl text-muted-foreground leading-relaxed font-serif-body">
              <p>
                The narrative surrounding African economic development and investment has long been characterised by profound <span className="text-foreground font-semibold">information asymmetry</span>.
              </p>
              <p>
                For decades, global capital has viewed the continent through a lens of generalised risk, often overlooking the nuanced, sector-specific, and highly lucrative opportunities that define the modern African economic landscape.
              </p>
              <p>
                BGFI was established to bridge this critical knowledge gap — providing deep, reliable, and incisive interpretations of fundamental and technical realities to help our readers make strategic, high-yield investments that drive the continent&apos;s economic evolution.
              </p>
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="py-16 md:py-20 border-b border-terminal-border">
          <div className="mb-12">
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-3">
              Who We Serve
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              Built for decision-makers who move capital across Africa
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {serves.map((item) => (
              <div
                key={item.title}
                className="p-6 md:p-8 bg-terminal-bg-secondary border border-terminal-border"
              >
                <h3 className="font-serif text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Publications */}
        <section className="py-16 md:py-20 border-b border-terminal-border" id="publications">
          <div className="mb-12">
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-3">
              Our Publications
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              A three-tiered publication strategy
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
              From flagship quarterly analysis to real-time data intelligence — BGFI research reaches readers through three complementary formats.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {publications.map((pub) => (
              <Link
                key={pub.title}
                href={pub.href}
                className="group p-6 bg-terminal-bg-secondary border border-terminal-border hover:border-brand-violet/40 transition-colors"
              >
                <div className="h-12 w-12 bg-brand-plum/10 text-brand-plum flex items-center justify-center mb-4">
                  {pub.icon}
                </div>
                <div className="text-xs font-medium uppercase tracking-wider text-brand-coral mb-2">
                  {pub.tagline}
                </div>
                <h3 className="font-serif text-xl font-bold mb-3 group-hover:text-brand-plum transition-colors">
                  {pub.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {pub.description}
                </p>
                <div className="text-sm font-medium text-brand-coral flex items-center gap-1">
                  Explore
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-20 border-b border-terminal-border">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-3">
              How We Work
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              The principles that govern our research
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="p-6 bg-terminal-bg-secondary border border-terminal-border"
              >
                <div className="h-12 w-12 bg-brand-coral/10 text-brand-coral flex items-center justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="font-serif text-lg font-bold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Editorial Team */}
        <section className="py-16 md:py-20 border-b border-terminal-border">
          <div className="mb-12">
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-3">
              Editorial Team
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              The people behind the research
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.map((person) => (
              <div
                key={person.email}
                className="p-5 bg-terminal-bg-secondary border border-terminal-border"
              >
                <h3 className="font-serif text-lg font-bold mb-1">{person.name}</h3>
                <p className="text-sm text-brand-coral mb-2">{person.role}</p>
                <a
                  href={`mailto:${person.email}`}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {person.email}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* HQ & Contact */}
        <section className="py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 bg-terminal-bg-secondary border border-terminal-border">
              <MapPin className="h-8 w-8 text-brand-plum mb-4" />
              <h2 className="font-serif text-2xl font-bold mb-3">Headquarters</h2>
              <p className="text-muted-foreground leading-relaxed mb-5">
                100 Nelson Mandela Avenue<br />
                Corner 4th Street<br />
                Harare, Zimbabwe
              </p>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                © {new Date().getFullYear()} Bard Global Finance Institute · All rights reserved
              </div>
            </div>
            <div className="relative overflow-hidden p-8 bg-brand-plum text-white">
              <div className="absolute inset-0 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-10">
                  <defs>
                    <pattern id="about-sub-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e4603a" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#about-sub-grid)" />
                </svg>
              </div>
              <Envelope className="relative h-8 w-8 text-brand-coral mb-4" />
              <h2 className="relative font-serif text-2xl font-bold mb-3">Engage With Our Research</h2>
              <p className="relative text-white/85 leading-relaxed mb-6">
                Subscribe to BGFI publications to receive each Finance Africa Quarterly and weekly insights the moment they&apos;re released.
              </p>
              <Link
                href="/subscribe"
                className="relative inline-flex items-center gap-2 px-5 py-3 bg-brand-coral text-white text-sm font-semibold uppercase tracking-wider hover:bg-brand-coral-dark transition-colors"
              >
                Subscribe to BGFI
                <span className="inline-block">→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
