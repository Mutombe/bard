"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  Users,
  Award,
  TrendingUp,
  Target,
  Heart,
  ChevronRight,
  BookOpen,
  FileText,
  Mic,
  Mail,
  Building2,
  Shield,
  Lightbulb,
  Scale,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

const stats = [
  { label: "Daily Readers", value: "250K+", icon: Users },
  { label: "Research Reports Published", value: "340+", icon: FileText },
  { label: "Markets Covered", value: "15+", icon: Globe },
  { label: "Years of Analysis", value: "12", icon: Award },
];

const values = [
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Rigorous Analysis",
    description: "Every insight is grounded in data, verified facts, and expert scrutiny. We maintain the highest standards of analytical rigor.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Pan-African Perspective",
    description: "We cover the entire continent with depth and nuance, understanding that African markets are interconnected and diverse.",
  },
  {
    icon: <Scale className="h-6 w-6" />,
    title: "Editorial Independence",
    description: "Our research and analysis are independent of commercial interests. We call it as we see it, without bias.",
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: "Actionable Insights",
    description: "We don't just report news—we provide the context and analysis investors need to make informed decisions.",
  },
];

const methodology = [
  {
    title: "Primary Research",
    description: "Direct interviews with executives, policymakers, and market participants across Africa's key economies.",
  },
  {
    title: "Quantitative Analysis",
    description: "Proprietary models and data analysis covering market trends, economic indicators, and company fundamentals.",
  },
  {
    title: "Expert Review",
    description: "All research undergoes rigorous peer review by our team of economists, analysts, and industry specialists.",
  },
  {
    title: "Continuous Monitoring",
    description: "Real-time tracking of market developments, policy changes, and corporate actions across 15+ African markets.",
  },
];

const leadership = [
  {
    name: "Thabo Mokoena",
    role: "Chief Executive Officer",
    bio: "Former head of African equities at Standard Bank with 20 years of experience in African financial markets. MBA from INSEAD.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
    expertise: ["Strategy", "Capital Markets", "Investment Banking"],
  },
  {
    name: "Amara Obi",
    role: "Editor-in-Chief",
    bio: "Award-winning financial journalist with 15 years at Reuters and Bloomberg. Specialist in corporate governance and ESG in emerging markets.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop",
    expertise: ["Financial Journalism", "Corporate Governance", "ESG"],
  },
  {
    name: "Dr. Fatima Hassan",
    role: "Chief Economist",
    bio: "Former Central Bank advisor with a PhD in Economics from LSE. Author of 'African Markets: A New Frontier' and regular commentator on CNBC Africa.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop",
    expertise: ["Monetary Policy", "Macroeconomics", "Trade Policy"],
  },
  {
    name: "Samuel Okonkwo",
    role: "Director of Research",
    bio: "Former equity research director at Rand Merchant Bank. CFA charterholder with deep expertise in African banking and financial services.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop",
    expertise: ["Banking", "Financial Services", "Equity Research"],
  },
];

const researchTeam = [
  { area: "Banking & Financial Services", analysts: 8 },
  { area: "Mining & Resources", analysts: 5 },
  { area: "Technology & Fintech", analysts: 6 },
  { area: "Economics & Policy", analysts: 4 },
  { area: "ESG & Sustainability", analysts: 3 },
];

const coverage = [
  { region: "Southern Africa", countries: "South Africa, Botswana, Namibia, Zimbabwe, Zambia" },
  { region: "East Africa", countries: "Kenya, Tanzania, Uganda, Rwanda, Ethiopia" },
  { region: "West Africa", countries: "Nigeria, Ghana, Côte d'Ivoire, Senegal" },
  { region: "North Africa", countries: "Egypt, Morocco, Tunisia" },
];

export default function AboutPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=800&fit=crop"
            alt="BGFI Headquarters"
            fill
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-terminal-bg via-terminal-bg/95 to-terminal-bg/80" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Illuminating Africa's <span className="text-primary">Financial Future</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Bard Global Finance Institute is Africa's leading independent research institution dedicated to financial markets analysis, economic research, and investment intelligence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/research"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <FileText className="h-5 w-5" />
                Explore Our Research
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 border border-terminal-border rounded-lg hover:bg-terminal-bg-elevated transition-colors"
              >
                <Mail className="h-5 w-5" />
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        {/* Stats */}
        <section className="py-12 -mt-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 text-center"
              >
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 border-b border-terminal-border" id="mission">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-6">Our Mission</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Reducing information asymmetry in African financial markets.</strong> We believe that access to high-quality research and analysis should not be limited to institutional investors in global financial centers.
                </p>
                <p>
                  Founded in 2013 in Johannesburg, BGFI emerged from a simple observation: African investors and market participants deserve the same quality of financial intelligence available in developed markets. We set out to build that institution.
                </p>
                <p>
                  Today, our team of economists, analysts, and journalists produces independent research that serves investors, policymakers, corporate leaders, and academics seeking to understand Africa's dynamic financial landscape.
                </p>
              </div>
            </div>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-8">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                What We Do
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block">Research & Publications</strong>
                    <span className="text-sm text-muted-foreground">In-depth reports on sectors, economies, and market trends</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block">Market Intelligence</strong>
                    <span className="text-sm text-muted-foreground">Real-time analysis and commentary on market developments</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mic className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block">Media & Podcasts</strong>
                    <span className="text-sm text-muted-foreground">Daily market briefings and in-depth expert discussions</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block">Educational Content</strong>
                    <span className="text-sm text-muted-foreground">Guides and explainers for market participants</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 border-b border-terminal-border">
          <h2 className="font-serif text-3xl font-bold mb-4 text-center">Our Values</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            The principles that guide our research, reporting, and engagement with the markets we cover.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Research Methodology */}
        <section className="py-16 border-b border-terminal-border">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-6">Research Methodology</h2>
              <p className="text-muted-foreground mb-8">
                Our research combines quantitative rigor with qualitative depth, drawing on primary sources, proprietary data, and expert networks across the continent.
              </p>
              <div className="space-y-6">
                {methodology.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-6">Research Coverage</h3>
              <div className="space-y-4 mb-8">
                {researchTeam.map((team) => (
                  <div
                    key={team.area}
                    className="flex items-center justify-between p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border"
                  >
                    <span>{team.area}</span>
                    <span className="text-sm text-muted-foreground">{team.analysts} analysts</span>
                  </div>
                ))}
              </div>

              <h3 className="font-semibold mb-4">Geographic Coverage</h3>
              <div className="space-y-3">
                {coverage.map((region) => (
                  <div key={region.region} className="p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
                    <div className="font-medium text-primary mb-1">{region.region}</div>
                    <div className="text-sm text-muted-foreground">{region.countries}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section className="py-16 border-b border-terminal-border">
          <h2 className="font-serif text-3xl font-bold mb-4 text-center">Leadership Team</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Our leadership brings together decades of experience in financial markets, economic research, and journalism.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadership.map((person) => (
              <div
                key={person.name}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden group"
              >
                <div className="relative aspect-square">
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    unoptimized
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg">{person.name}</h3>
                  <p className="text-primary text-sm mb-3">{person.role}</p>
                  <p className="text-sm text-muted-foreground mb-3">{person.bio}</p>
                  <div className="flex flex-wrap gap-1">
                    {person.expertise.map((exp) => (
                      <span
                        key={exp}
                        className="px-2 py-0.5 text-xs bg-terminal-bg rounded border border-terminal-border"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Editorial Standards */}
        <section className="py-16 border-b border-terminal-border">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl font-bold mb-6">Editorial Standards</h2>
            <p className="text-muted-foreground mb-8">
              We are committed to the highest standards of accuracy, fairness, and independence in our reporting and research.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              <div className="p-6 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
                <h4 className="font-semibold mb-2">Accuracy</h4>
                <p className="text-sm text-muted-foreground">
                  All facts are verified through multiple sources. Corrections are published promptly and prominently.
                </p>
              </div>
              <div className="p-6 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
                <h4 className="font-semibold mb-2">Independence</h4>
                <p className="text-sm text-muted-foreground">
                  Editorial decisions are made independently of commercial considerations. We disclose all potential conflicts.
                </p>
              </div>
              <div className="p-6 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
                <h4 className="font-semibold mb-2">Transparency</h4>
                <p className="text-sm text-muted-foreground">
                  We explain our methodology and sources. Readers can assess the basis for our conclusions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTAs */}
        <section className="py-16">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-8">
              <Users className="h-8 w-8 text-primary mb-4" />
              <h2 className="font-serif text-2xl font-bold mb-4">Join Our Team</h2>
              <p className="text-muted-foreground mb-6">
                We're always looking for talented analysts, journalists, and technologists who are passionate about African markets.
              </p>
              <Link
                href="/careers"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                View Open Positions
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative overflow-hidden bg-primary/10 rounded-lg border border-primary/20 p-8">
              <div className="absolute inset-0 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-[0.07] dark:opacity-[0.10]"><defs><pattern id="about-sub-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(355, 70%, 38%)" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#about-sub-grid)"/></svg></div>
              <Mail className="relative h-8 w-8 text-primary mb-4" />
              <h2 className="relative font-serif text-2xl font-bold mb-4">Stay Informed</h2>
              <p className="text-muted-foreground mb-6">
                Subscribe to African Finance Insights for our latest research, analysis, and market intelligence.
              </p>
              <Link
                href="/subscribe"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Subscribe Now
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
