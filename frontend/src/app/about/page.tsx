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
  Lightbulb,
  ChartLineUp,
  Briefcase,
  MapPin,
  TreeStructure,
  Factory,
  UsersThree,
  CirclesFour,
  Cpu,
  GraduationCap,
  Scales,
} from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";

const researchThemes = [
  {
    icon: <Factory className="h-6 w-6" />,
    title: "Productivity and Prosperity",
    description: "Creating and harnessing the world's assets most productively.",
  },
  {
    icon: <TreeStructure className="h-6 w-6" />,
    title: "Resources of the World",
    description: "Building, powering, and feeding the world sustainably.",
  },
  {
    icon: <UsersThree className="h-6 w-6" />,
    title: "Human Potential",
    description: "Maximising and achieving the potential of human talent.",
  },
  {
    icon: <CirclesFour className="h-6 w-6" />,
    title: "Global Connections",
    description:
      "Exploring how flows of goods, services, people, capital, and ideas shape economies.",
  },
  {
    icon: <Cpu className="h-6 w-6" />,
    title: "Technologies and Markets of the Future",
    description: "Discussing the next big arenas of value and competition.",
  },
];

const publications = [
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Finance Africa Quarterly",
    tagline: "Flagship quarterly journal",
    description:
      "In-depth quarterly analysis of African markets, sector deep-dives, and economic outlook reports. The journal through which we interpret investable frontiers.",
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

const leadership = [
  {
    name: "Shephard Mphambela",
    role: "CEO, Co-Founder · Publisher & Editor-in-Chief",
    email: "shephard@bgfi.global",
    isLead: true,
  },
  {
    name: "Senziwani Sikhosana",
    role: "Chair of the Board · Co-Founder",
    email: "sikhosana@bardsantner.com",
    isLead: true,
  },
];

const editorialTeam = [
  { name: "Mollen Chamisa", role: "Sub-Editing · Research & Analysis", email: "mollen@bgfi.global" },
  { name: "Farai Mabeza", role: "Research & Analysis", email: "farai@bgfi.global" },
  { name: "Belinda Chiroodza", role: "Research & Analysis", email: "belinda@bgfi.global" },
  { name: "Tinashe Kaduwo", role: "Research & Analysis", email: "tinashe@bgfi.global" },
];

export default function AboutPage() {
  return (
    <MainLayout>
      {/* Hero */}
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
              An Africa-based global finance research and consulting institute established in January 2026. We deliver research, advisory, and insights on the critical economic and business issues affecting Africa&apos;s companies, economic sectors, and policy leaders.
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
        {/* Mission Statement */}
        <section className="py-16 md:py-20 border-b border-terminal-border">
          <div className="max-w-4xl">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-brand-coral mb-5">
              Our Mission
            </div>
            <div className="relative pl-6 md:pl-8 border-l-[3px] border-l-brand-coral">
              <p className="font-serif text-2xl md:text-3xl lg:text-4xl leading-[1.3] md:leading-[1.25] font-medium text-foreground">
                To deliver comprehensive global research, advisory services, insights, and a factual foundation to facilitate investment allocation and strategic decision-making on the most critical economic and business issues affecting Africa&apos;s companies, economic sectors, and policy leaders.
              </p>
            </div>
          </div>
        </section>

        {/* What is BGFI */}
        <section className="py-16 md:py-20 border-b border-terminal-border">
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-4">
              <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-3">
                About
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
                What is BGFI?
              </h2>
            </div>
            <div className="md:col-span-8 space-y-5 text-base md:text-lg text-muted-foreground leading-relaxed font-serif-body">
              <p>
                The Bard Global Finance Institute was established in <span className="text-foreground font-semibold">January 2026</span>. We interpret African economic conditions and surface actionable investment opportunities for the global investor — whether an offshore institutional investor seeking exposure to emerging markets or a continental entity expanding across African jurisdictions.
              </p>
              <p>
                BGFI benefits from the full range of <span className="text-foreground font-semibold">Bard Santner&apos;s</span> regional, sectoral, and functional knowledge, as well as leveraging some of its skills and expertise. However, <span className="text-foreground font-semibold">editorial direction and decisions are solely the responsibility of BGFI&apos;s executive directors and partners</span>.
              </p>
              <p>
                We aim for <span className="text-foreground font-semibold">independent, fact-based research</span> that does not glorify or misinform any entity. While we engage multiple distinguished external advisers to contribute to our work, the analyses presented in our publications are BGFI&apos;s alone — and any errors are our own.
              </p>
            </div>
          </div>
        </section>

        {/* Research Themes */}
        <section className="py-16 md:py-20 border-b border-terminal-border">
          <div className="mb-12">
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-3">
              Research Focus
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 max-w-3xl">
              Five themes organise our research
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
              Globally originated, with a locus of focus on promoting the application of financial resource allocation in Africa.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {researchThemes.map((theme, idx) => (
              <div
                key={theme.title}
                className="p-6 bg-terminal-bg-secondary border border-terminal-border hover:border-brand-violet/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-brand-plum/10 text-brand-plum flex items-center justify-center">
                      {theme.icon}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-coral mb-1">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <h3 className="font-serif text-lg font-bold mb-2 leading-tight">{theme.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {theme.description}
                    </p>
                  </div>
                </div>
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
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 max-w-3xl">
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

        {/* Leadership */}
        <section className="py-16 md:py-20 border-b border-terminal-border">
          <div className="mb-12">
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-3">
              Leadership
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold max-w-3xl">
              Led by the founders
            </h2>
          </div>

          {/* Co-founders — prominent */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {leadership.map((person) => (
              <div
                key={person.email}
                className="p-8 bg-brand-plum text-white relative overflow-hidden"
              >
                <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-coral mb-4">
                  Co-Founder
                </div>
                <h3 className="font-serif text-2xl md:text-3xl font-bold mb-2">{person.name}</h3>
                <p className="text-base text-white/80 mb-5">{person.role}</p>
                <a
                  href={`mailto:${person.email}`}
                  className="inline-flex items-center gap-2 text-sm text-brand-coral hover:text-white transition-colors"
                >
                  <Envelope className="h-4 w-4" />
                  {person.email}
                </a>
              </div>
            ))}
          </div>

          {/* Editorial team */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-brand-violet mb-5">
              Editorial Team
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {editorialTeam.map((person) => (
                <div
                  key={person.email}
                  className="p-5 bg-terminal-bg-secondary border border-terminal-border"
                >
                  <h4 className="font-serif text-lg font-bold mb-1">{person.name}</h4>
                  <p className="text-xs text-brand-coral mb-2">{person.role}</p>
                  <a
                    href={`mailto:${person.email}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {person.email}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Advisers */}
        <section className="py-16 md:py-20 border-b border-terminal-border">
          <div className="max-w-4xl">
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-3">
              Advisory Network
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6 leading-tight">
              A network of premier development finance and investment experts
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-serif-body mb-8">
              BGFI collaborates with a diverse group of specialists across disciplines who serve as advisers to our projects — economists, public policy specialists, Chartered Financial Analysts, and banking professionals.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <ChartLineUp className="h-5 w-5" />, label: "Economists" },
                { icon: <Scales className="h-5 w-5" />, label: "Public Policy Specialists" },
                { icon: <GraduationCap className="h-5 w-5" />, label: "Chartered Financial Analysts" },
                { icon: <Briefcase className="h-5 w-5" />, label: "Banking Professionals" },
              ].map((adv) => (
                <div
                  key={adv.label}
                  className="p-5 bg-terminal-bg-secondary border border-terminal-border text-center"
                >
                  <div className="h-10 w-10 mx-auto bg-brand-violet/10 text-brand-violet-accessible flex items-center justify-center mb-3">
                    {adv.icon}
                  </div>
                  <div className="text-sm font-semibold">{adv.label}</div>
                </div>
              ))}
            </div>
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
