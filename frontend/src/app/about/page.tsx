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
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

const stats = [
  { label: "Daily Readers", value: "250K+" },
  { label: "Markets Covered", value: "15+" },
  { label: "Years of Experience", value: "12" },
  { label: "Team Members", value: "85" },
];

const values = [
  {
    icon: <Target className="h-6 w-6" />,
    title: "Accuracy First",
    description: "We verify every piece of information before publishing. Our readers trust us to deliver facts, not speculation.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Pan-African Perspective",
    description: "We cover the entire continent, recognizing that African markets are interconnected and dynamic.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Expert Analysis",
    description: "Our team includes former traders, fund managers, and economists who understand market dynamics.",
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Investor Focus",
    description: "Every story we write is aimed at helping investors make informed decisions.",
  },
];

const leadership = [
  {
    name: "Thabo Mokoena",
    role: "Chief Executive Officer",
    bio: "Former head of African equities at Standard Bank with 20 years of market experience.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
  },
  {
    name: "Amara Obi",
    role: "Editor-in-Chief",
    bio: "Award-winning financial journalist with experience at Reuters and Bloomberg.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop",
  },
  {
    name: "Dr. Fatima Hassan",
    role: "Chief Economist",
    bio: "Former Central Bank advisor and author of 'African Markets: A New Frontier'.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop",
  },
];

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold mb-6">
            African Financial Intelligence
          </h1>
          <p className="text-xl text-muted-foreground">
            Bardiq Journal is the leading source of financial news, data, and analysis for Africa&apos;s dynamic markets. We empower investors with the insights they need to navigate the continent&apos;s opportunities.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 text-center"
            >
              <div className="text-3xl font-bold text-brand-orange mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Our Story */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Founded in 2013 in Johannesburg, Bardiq Journal emerged from a simple observation: African investors deserved the same quality of financial journalism available in developed markets.
              </p>
              <p>
                What started as a small newsletter has grown into a comprehensive platform serving hundreds of thousands of investors, fund managers, and business leaders across the continent and beyond.
              </p>
              <p>
                Today, our team of journalists, analysts, and data scientists works around the clock to deliver breaking news, deep analysis, and actionable insights from all major African markets.
              </p>
            </div>
          </div>
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop"
              alt="African Markets"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6"
              >
                <div className="h-12 w-12 rounded-lg bg-brand-orange/20 text-brand-orange flex items-center justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leadership */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Leadership Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {leadership.map((person) => (
              <div
                key={person.name}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden"
              >
                <div className="relative aspect-square">
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg">{person.name}</h3>
                  <p className="text-brand-orange text-sm mb-3">{person.role}</p>
                  <p className="text-sm text-muted-foreground">{person.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Join Our Team</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            We&apos;re always looking for talented journalists, analysts, and technologists who are passionate about African markets.
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
          >
            View Open Positions
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
