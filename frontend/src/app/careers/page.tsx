"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Clock,
  ChevronRight,
  Users,
  Heart,
  Zap,
  Globe,
  DollarSign,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract";
  level: "junior" | "mid" | "senior" | "lead";
  description: string;
  requirements: string[];
}

const departments = [
  { id: "all", label: "All Departments" },
  { id: "editorial", label: "Editorial" },
  { id: "engineering", label: "Engineering" },
  { id: "data", label: "Data & Analytics" },
  { id: "sales", label: "Sales & Marketing" },
  { id: "operations", label: "Operations" },
];

const jobs: Job[] = [
  {
    id: "1",
    title: "Senior Financial Journalist",
    department: "editorial",
    location: "Johannesburg, South Africa",
    type: "full-time",
    level: "senior",
    description: "Join our award-winning editorial team to cover African markets. You'll break stories, conduct interviews, and provide analysis on equities, fixed income, and economics.",
    requirements: [
      "5+ years of financial journalism experience",
      "Strong knowledge of African markets",
      "Excellent writing and communication skills",
      "Ability to work under deadline pressure",
    ],
  },
  {
    id: "2",
    title: "Full Stack Engineer",
    department: "engineering",
    location: "Remote (Africa)",
    type: "full-time",
    level: "mid",
    description: "Help build the next generation of our financial data platform. You'll work with real-time data, create intuitive interfaces, and scale our systems to serve millions of users.",
    requirements: [
      "3+ years of full-stack development experience",
      "Proficiency in React, Next.js, and Node.js",
      "Experience with real-time data systems",
      "Strong problem-solving skills",
    ],
  },
  {
    id: "3",
    title: "Data Scientist",
    department: "data",
    location: "Cape Town, South Africa",
    type: "full-time",
    level: "senior",
    description: "Use machine learning and statistical analysis to extract insights from financial data. You'll build models for market predictions, sentiment analysis, and recommendation systems.",
    requirements: [
      "5+ years of data science experience",
      "Strong Python and SQL skills",
      "Experience with ML frameworks (TensorFlow, PyTorch)",
      "Background in finance or economics preferred",
    ],
  },
  {
    id: "4",
    title: "Sales Executive - Nigeria",
    department: "sales",
    location: "Lagos, Nigeria",
    type: "full-time",
    level: "mid",
    description: "Drive subscription growth in West Africa. You'll build relationships with institutional investors, asset managers, and corporations seeking market intelligence.",
    requirements: [
      "3+ years of B2B sales experience",
      "Knowledge of Nigerian financial markets",
      "Strong network in the investment community",
      "Proven track record of meeting targets",
    ],
  },
  {
    id: "5",
    title: "Market Data Analyst",
    department: "data",
    location: "Johannesburg, South Africa",
    type: "full-time",
    level: "junior",
    description: "Ensure the accuracy and quality of our market data. You'll monitor data feeds, resolve discrepancies, and work with exchanges to improve data delivery.",
    requirements: [
      "1+ years of experience with financial data",
      "Strong attention to detail",
      "Proficiency in Excel and SQL",
      "Understanding of market data (equities, forex, bonds)",
    ],
  },
  {
    id: "6",
    title: "Podcast Producer",
    department: "editorial",
    location: "Johannesburg, South Africa",
    type: "full-time",
    level: "mid",
    description: "Produce and grow our podcast portfolio. You'll book guests, edit episodes, manage distribution, and help build our audio brand.",
    requirements: [
      "2+ years of podcast production experience",
      "Audio editing skills (Adobe Audition, Descript)",
      "Interest in finance and business",
      "Strong organizational skills",
    ],
  },
];

const benefits = [
  {
    icon: <DollarSign className="h-6 w-6" />,
    title: "Competitive Compensation",
    description: "Market-leading salaries with equity options for all team members.",
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Health & Wellness",
    description: "Comprehensive medical aid and wellness programs.",
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    title: "Learning Budget",
    description: "Annual learning budget for courses, conferences, and books.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Remote Flexibility",
    description: "Work from anywhere in Africa with flexible hours.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Cutting-Edge Tools",
    description: "Best-in-class equipment and software to do your best work.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Team Events",
    description: "Regular team gatherings, off-sites, and social events.",
  },
];

export default function CareersPage() {
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const filteredJobs = jobs.filter(
    (job) => selectedDepartment === "all" || job.department === selectedDepartment
  );

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl text-muted-foreground">
            Help us build the future of African financial journalism. We&apos;re looking for talented people who are passionate about markets, technology, and storytelling.
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Why Work at Bard Global Finance Institute?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6"
              >
                <div className="h-12 w-12 rounded-lg bg-brand-orange/20 text-brand-orange flex items-center justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Open Positions</h2>

          {/* Department Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartment(dept.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
                  selectedDepartment === dept.id
                    ? "bg-brand-orange text-white"
                    : "bg-terminal-bg-elevated text-muted-foreground hover:text-foreground"
                )}
              >
                {dept.label}
              </button>
            ))}
          </div>

          {/* Job Listings */}
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 hover:border-brand-orange transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {departments.find((d) => d.id === job.department)?.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
                      </span>
                      <span className="px-2 py-0.5 bg-brand-orange/20 text-brand-orange rounded text-xs">
                        {job.level.charAt(0).toUpperCase() + job.level.slice(1)}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.slice(0, 2).map((req, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-terminal-bg-elevated rounded"
                        >
                          {req}
                        </span>
                      ))}
                      {job.requirements.length > 2 && (
                        <span className="px-2 py-1 text-xs text-muted-foreground">
                          +{job.requirements.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/careers/${job.id}`}
                    className="flex-shrink-0 px-6 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors flex items-center gap-2"
                  >
                    Apply Now
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No open positions</h3>
              <p className="text-muted-foreground">
                There are no open positions in this department right now. Check back soon!
              </p>
            </div>
          )}
        </div>

        {/* General Application */}
        <div className="mt-12 bg-terminal-bg-secondary rounded-lg border border-terminal-border p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Don&apos;t see the right role?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            We&apos;re always looking for talented people. Send us your resume and tell us how you&apos;d like to contribute to Bard Global Finance Institute.
          </p>
          <Link
            href="mailto:careers@Bard Global Finance Institute.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
          >
            Send General Application
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
