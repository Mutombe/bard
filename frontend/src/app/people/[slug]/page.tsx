"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  Linkedin,
  Mail,
  ChevronRight,
  TrendingUp,
  FileText,
  Clock,
  Loader2,
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Skeleton } from "@/components/ui/loading";
import apiClient from "@/services/api/client";

interface Person {
  slug: string;
  name: string;
  title: string;
  company: string;
  companySymbol?: string;
  bio: string;
  image: string;
  location: string;
  education?: string[];
  experience: { role: string; company: string; period: string }[];
  boardPositions?: string[];
  socialLinks: { twitter?: string; linkedin?: string; email?: string };
  relatedArticles: { id: string; title: string; date: string }[];
  relatedCompanies: { symbol: string; name: string; role: string }[];
}

const peopleData: Record<string, Person> = {
  "phuthi-mahanyele": {
    slug: "phuthi-mahanyele",
    name: "Phuthi Mahanyele-Dabengwa",
    title: "CEO, Naspers South Africa",
    company: "Naspers Ltd",
    companySymbol: "NPN",
    bio: "Phuthi Mahanyele-Dabengwa is the Chief Executive Officer of Naspers South Africa, one of the largest technology investors in Africa. She has been instrumental in driving the company's strategy to build leading technology businesses across the continent. Prior to joining Naspers, she served as CEO of Shanduka Group, one of South Africa's largest black-owned investment holding companies.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    location: "Johannesburg, South Africa",
    education: [
      "MBA, Harvard Business School",
      "Bachelor of Commerce, University of Cape Town",
    ],
    experience: [
      { role: "CEO, Naspers South Africa", company: "Naspers", period: "2019 - Present" },
      { role: "CEO", company: "Shanduka Group", period: "2012 - 2019" },
      { role: "Executive Director", company: "Shanduka Energy", period: "2008 - 2012" },
    ],
    boardPositions: [
      "Non-Executive Director, Exxaro Resources",
      "Board Member, Business Leadership South Africa",
      "Trustee, Nelson Mandela Foundation",
    ],
    socialLinks: {
      linkedin: "https://linkedin.com/in/phuthi-mahanyele",
      twitter: "https://twitter.com/phuthimahanyele",
    },
    relatedArticles: [
      { id: "1", title: "Naspers Announces R5 Billion Investment in African Tech", date: "2025-01-20" },
      { id: "2", title: "Interview: Phuthi Mahanyele on Africa's Digital Future", date: "2025-01-15" },
      { id: "3", title: "Naspers South Africa Reports Strong Q3 Results", date: "2025-01-10" },
    ],
    relatedCompanies: [
      { symbol: "NPN", name: "Naspers Ltd", role: "CEO, South Africa" },
      { symbol: "EXX", name: "Exxaro Resources", role: "Non-Executive Director" },
    ],
  },
  "ralph-mupita": {
    slug: "ralph-mupita",
    name: "Ralph Mupita",
    title: "Group President & CEO",
    company: "MTN Group Ltd",
    companySymbol: "MTN",
    bio: "Ralph Mupita is the Group President and Chief Executive Officer of MTN Group, Africa's largest mobile telecommunications company. Under his leadership, MTN has accelerated its fintech strategy and expanded mobile money services across the continent. He joined MTN in 2017 as Group CFO before being appointed CEO in 2020.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    location: "Johannesburg, South Africa",
    education: [
      "Bachelor of Accountancy, University of Zimbabwe",
      "Chartered Accountant (CA)",
    ],
    experience: [
      { role: "Group President & CEO", company: "MTN Group", period: "2020 - Present" },
      { role: "Group CFO", company: "MTN Group", period: "2017 - 2020" },
      { role: "CEO", company: "Old Mutual Emerging Markets", period: "2014 - 2017" },
    ],
    boardPositions: [
      "Board Member, GSMA",
      "Council Member, World Economic Forum",
    ],
    socialLinks: {
      linkedin: "https://linkedin.com/in/ralph-mupita",
    },
    relatedArticles: [
      { id: "4", title: "MTN Group Reports 18% Revenue Growth", date: "2025-01-22" },
      { id: "5", title: "Ralph Mupita on MTN's Fintech Ambitions", date: "2025-01-18" },
    ],
    relatedCompanies: [
      { symbol: "MTN", name: "MTN Group Ltd", role: "Group President & CEO" },
      { symbol: "MTNN", name: "MTN Nigeria", role: "Board Member" },
    ],
  },
  "aliko-dangote": {
    slug: "aliko-dangote",
    name: "Aliko Dangote",
    title: "Chairman & CEO",
    company: "Dangote Group",
    companySymbol: "DANGCEM",
    bio: "Aliko Dangote is Africa's richest person and the founder and chairman of Dangote Group, the largest industrial conglomerate in West Africa. His business empire spans cement, sugar, salt, flour, and oil refining. The Dangote Refinery, when fully operational, will be one of the world's largest single-train refineries.",
    image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=400&fit=crop",
    location: "Lagos, Nigeria",
    education: [
      "Business Studies, Al-Azhar University, Cairo",
    ],
    experience: [
      { role: "Chairman & CEO", company: "Dangote Group", period: "1981 - Present" },
    ],
    boardPositions: [
      "Member, Clinton Global Initiative",
      "Board Member, Corporate Council on Africa",
      "Co-Chair, Africa Infrastructure Investment Fund",
    ],
    socialLinks: {
      twitter: "https://twitter.com/aaborishade",
      linkedin: "https://linkedin.com/in/aliko-dangote",
    },
    relatedArticles: [
      { id: "6", title: "Dangote Refinery Reaches 500,000 bpd Capacity", date: "2025-01-21" },
      { id: "7", title: "Aliko Dangote on African Industrialization", date: "2025-01-14" },
    ],
    relatedCompanies: [
      { symbol: "DANGCEM", name: "Dangote Cement Plc", role: "Chairman" },
      { symbol: "DANGSUGAR", name: "Dangote Sugar Refinery", role: "Chairman" },
    ],
  },
};

// API Author type
interface ApiAuthor {
  id: number;
  full_name: string;
  avatar?: string | null;
  bio?: string;
  title?: string;
}

interface ApiArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  category?: { name: string; slug: string };
  published_at?: string;
  read_time_minutes?: number;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function AuthorSkeleton() {
  return (
    <div className="animate-pulse max-w-[1600px] mx-auto px-4 md:px-6 py-6">
      <Skeleton className="h-4 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="flex gap-6">
              <Skeleton className="h-32 w-32 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-32 mb-4" />
                <Skeleton className="h-4 w-full max-w-md mb-2" />
                <Skeleton className="h-4 w-3/4 max-w-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PersonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const staticPerson = peopleData[slug];

  // State for API-fetched author data
  const [apiAuthor, setApiAuthor] = useState<ApiAuthor | null>(null);
  const [apiArticles, setApiArticles] = useState<ApiArticle[]>([]);
  const [loading, setLoading] = useState(!staticPerson);
  const [error, setError] = useState<string | null>(null);

  // Fetch author data from API if not found in static data
  useEffect(() => {
    if (staticPerson) return; // Skip if we have static data

    const fetchAuthorData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch author's articles using author_name filter (matches by slug format)
        const articlesResponse = await apiClient.get(
          `/news/articles/?author_name=${encodeURIComponent(slug)}&page_size=12`
        );
        const results = articlesResponse.data.results || [];

        if (results.length > 0) {
          const firstAuthor = results[0]?.author;
          if (firstAuthor) {
            setApiAuthor({
              id: firstAuthor.id,
              full_name: firstAuthor.full_name || slug.replace(/-/g, " "),
              avatar: firstAuthor.avatar,
              bio: firstAuthor.bio,
              title: firstAuthor.title,
            });
          } else {
            setApiAuthor({
              id: 0,
              full_name: slug
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" "),
            });
          }
          setApiArticles(results);
        } else {
          setApiAuthor({
            id: 0,
            full_name: slug
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" "),
          });
          setApiArticles([]);
        }
      } catch (err) {
        console.error("Failed to fetch author data:", err);
        setError("Author not found");
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [slug, staticPerson]);

  // Show loading state for API fetch
  if (loading && !staticPerson) {
    return (
      <MainLayout>
        <AuthorSkeleton />
      </MainLayout>
    );
  }

  // If we have static data, render that
  const person = staticPerson;

  // If no static person and we have API data, render author page
  if (!person && apiAuthor) {
    return (
      <MainLayout>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
          {/* Back link */}
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Profile */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <UserAvatar
                    src={apiAuthor.avatar}
                    name={apiAuthor.full_name}
                    identifier={apiAuthor.id.toString()}
                    size="2xl"
                    className="h-32 w-32 text-3xl"
                    showRing
                  />
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-1">{apiAuthor.full_name}</h1>
                    {apiAuthor.title && (
                      <p className="text-brand-orange mb-2">{apiAuthor.title}</p>
                    )}
                    {apiAuthor.bio && (
                      <p className="text-muted-foreground leading-relaxed">{apiAuthor.bio}</p>
                    )}
                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{apiArticles.length} articles</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Articles by this author */}
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-orange" />
                  Articles by {apiAuthor.full_name}
                </h2>
                {apiArticles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No articles found for this author.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {apiArticles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/news/${article.slug}`}
                        className="group flex gap-4 p-3 rounded-lg bg-terminal-bg-elevated hover:bg-terminal-bg transition-colors"
                      >
                        {article.featured_image ? (
                          <div className="relative w-24 h-20 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={article.featured_image}
                              alt={article.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-20 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {article.category && (
                            <span className="text-xs font-medium text-primary uppercase">
                              {article.category.name}
                            </span>
                          )}
                          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{formatDate(article.published_at)}</span>
                            {article.read_time_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {article.read_time_minutes} min
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
                <h3 className="font-semibold mb-3">Follow</h3>
                <p className="text-sm text-muted-foreground">
                  Stay updated with the latest articles from this author.
                </p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // No data found
  if (!person && !apiAuthor) {
    return (
      <MainLayout>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Person Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The profile you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/" className="text-brand-orange hover:underline">
            Return Home
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/people" className="hover:text-foreground">People</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{person.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <UserAvatar
                  src={person.image}
                  name={person.name}
                  identifier={person.slug}
                  size="2xl"
                  className="h-32 w-32 rounded-lg text-3xl"
                  showRing
                />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-1">{person.name}</h1>
                  <p className="text-brand-orange mb-2">{person.title}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {person.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {person.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {person.socialLinks.linkedin && (
                      <a
                        href={person.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-terminal-bg-elevated rounded hover:bg-brand-orange/20 hover:text-brand-orange transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {person.socialLinks.twitter && (
                      <a
                        href={person.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-terminal-bg-elevated rounded hover:bg-brand-orange/20 hover:text-brand-orange transition-colors"
                      >
                        <FaXTwitter className="h-4 w-4" />
                      </a>
                    )}
                    {person.socialLinks.email && (
                      <a
                        href={`mailto:${person.socialLinks.email}`}
                        className="p-2 bg-terminal-bg-elevated rounded hover:bg-brand-orange/20 hover:text-brand-orange transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Biography */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h2 className="font-semibold mb-4">Biography</h2>
              <p className="text-muted-foreground leading-relaxed">{person.bio}</p>
            </div>

            {/* Experience */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-brand-orange" />
                Experience
              </h2>
              <div className="space-y-4">
                {person.experience.map((exp, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b border-terminal-border last:border-0 last:pb-0"
                  >
                    <div className="h-10 w-10 rounded bg-brand-orange/20 text-brand-orange flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{exp.role}</div>
                      <div className="text-sm text-muted-foreground">{exp.company}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {exp.period}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            {person.education && (
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                <h2 className="font-semibold mb-4">Education</h2>
                <ul className="space-y-2">
                  {person.education.map((edu, index) => (
                    <li key={index} className="text-muted-foreground flex items-start gap-2">
                      <span className="text-brand-orange">•</span>
                      {edu}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Board Positions */}
            {person.boardPositions && (
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                <h2 className="font-semibold mb-4">Board Positions</h2>
                <ul className="space-y-2">
                  {person.boardPositions.map((position, index) => (
                    <li key={index} className="text-muted-foreground flex items-start gap-2">
                      <span className="text-brand-orange">•</span>
                      {position}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Companies */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-orange" />
                Related Companies
              </h3>
              <div className="space-y-3">
                {person.relatedCompanies.map((company) => (
                  <Link
                    key={company.symbol}
                    href={`/companies/${company.symbol.toLowerCase()}`}
                    className="block p-3 rounded bg-terminal-bg-elevated hover:bg-terminal-bg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono font-semibold">{company.symbol}</div>
                        <div className="text-sm text-muted-foreground">{company.name}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-xs text-brand-orange mt-1">{company.role}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Related Articles */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-orange" />
                Related Articles
              </h3>
              <div className="space-y-3">
                {person.relatedArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.id}`}
                    className="block p-3 rounded bg-terminal-bg-elevated hover:bg-terminal-bg transition-colors"
                  >
                    <div className="text-sm font-medium line-clamp-2 mb-1">
                      {article.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(article.date).toLocaleDateString("en-ZA", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href={`/news?person=${person.slug}`}
                className="block text-center text-sm text-brand-orange hover:text-brand-orange-light mt-4"
              >
                View All Articles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
