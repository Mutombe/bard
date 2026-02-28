"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Search,
  Clock,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Opinion {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    title: string;
    avatar: string;
  };
  category: string;
  publishedAt: string;
  readTime: string;
  comments: number;
  slug: string;
  featured?: boolean;
}

const mockOpinions: Opinion[] = [
  {
    id: "1",
    title: "The Case for African Infrastructure Investment in 2025",
    excerpt: "As global investors seek new opportunities, Africa's infrastructure gap presents both challenges and unprecedented investment potential. Here's why the time is now.",
    author: { name: "Dr. Ngozi Okonjo-Iweala", title: "Economist & Former Finance Minister", avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop" },
    category: "Investment",
    publishedAt: "2025-01-24T08:00:00Z",
    readTime: "8 min",
    comments: 45,
    slug: "african-infrastructure-investment-2025",
    featured: true,
  },
  {
    id: "2",
    title: "Central Banks Must Rethink Monetary Policy for African Economies",
    excerpt: "Traditional monetary policy tools developed for Western economies may not be the right fit for African markets. A new approach is needed.",
    author: { name: "Prof. Mthuli Ncube", title: "Finance Minister, Zimbabwe", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
    category: "Economics",
    publishedAt: "2025-01-23T10:00:00Z",
    readTime: "6 min",
    comments: 32,
    slug: "rethink-monetary-policy-africa",
  },
  {
    id: "3",
    title: "Why ESG Investing in Africa Is More Than a Trend",
    excerpt: "Environmental, Social, and Governance factors are becoming critical differentiators for African companies seeking international capital.",
    author: { name: "Aisha Pandor", title: "CEO, SweepSouth", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop" },
    category: "Markets",
    publishedAt: "2025-01-22T14:00:00Z",
    readTime: "5 min",
    comments: 28,
    slug: "esg-investing-africa",
  },
  {
    id: "4",
    title: "The Digital Rand: Opportunity or Threat to Financial Inclusion?",
    excerpt: "As the SARB explores a central bank digital currency, we must carefully consider its implications for the unbanked population.",
    author: { name: "Herman Mashaba", title: "Entrepreneur & Politician", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
    category: "Fintech",
    publishedAt: "2025-01-21T09:00:00Z",
    readTime: "7 min",
    comments: 56,
    slug: "digital-rand-financial-inclusion",
  },
  {
    id: "5",
    title: "Mining Royalties: Finding the Balance Between Revenue and Investment",
    excerpt: "African governments must strike a delicate balance between extracting value from natural resources and attracting foreign investment.",
    author: { name: "Sipho Pityana", title: "Chairman, AngloGold Ashanti", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
    category: "Commodities",
    publishedAt: "2025-01-20T11:00:00Z",
    readTime: "6 min",
    comments: 19,
    slug: "mining-royalties-balance",
  },
];

const categories = ["All", "Investment", "Economics", "Markets", "Fintech", "Commodities", "Policy"];

export default function OpinionsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOpinions = mockOpinions.filter((opinion) => {
    const matchesSearch =
      opinion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opinion.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || opinion.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredOpinion = filteredOpinions.find((o) => o.featured);
  const regularOpinions = filteredOpinions.filter((o) => !o.featured);

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Users className="h-6 w-6 text-brand-orange" />
              Opinions
            </h1>
            <p className="text-muted-foreground">
              Expert perspectives on African markets and economics.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search opinions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 text-sm rounded-full whitespace-nowrap transition-colors",
                selectedCategory === cat
                  ? "bg-brand-orange text-white"
                  : "bg-terminal-bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Opinion */}
        {featuredOpinion && (
          <div className="mb-8">
            <Link href={`/news/${featuredOpinion.slug}`}>
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors">
                <div className="flex flex-col lg:flex-row">
                  <div className="relative lg:w-1/2 aspect-video lg:aspect-auto">
                    <Image
                      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop"
                      alt={featuredOpinion.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-brand-orange text-white text-xs font-medium rounded">
                        Featured Opinion
                      </span>
                    </div>
                  </div>
                  <div className="p-6 lg:w-1/2 flex flex-col justify-center">
                    <span className="text-xs text-brand-orange font-medium mb-2">
                      {featuredOpinion.category}
                    </span>
                    <h2 className="text-xl lg:text-2xl font-bold mb-3 hover:text-brand-orange transition-colors">
                      {featuredOpinion.title}
                    </h2>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {featuredOpinion.excerpt}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden">
                        <Image
                          src={featuredOpinion.author.avatar}
                          alt={featuredOpinion.author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{featuredOpinion.author.name}</div>
                        <div className="text-xs text-muted-foreground">{featuredOpinion.author.title}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Opinions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {regularOpinions.map((opinion) => (
            <Link key={opinion.id} href={`/news/${opinion.slug}`}>
              <article className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 hover:border-brand-orange transition-colors h-full">
                <span className="text-xs text-brand-orange font-medium">
                  {opinion.category}
                </span>
                <h3 className="text-lg font-semibold mt-2 mb-3 hover:text-brand-orange transition-colors line-clamp-2">
                  {opinion.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {opinion.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden">
                      <Image
                        src={opinion.author.avatar}
                        alt={opinion.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{opinion.author.name}</div>
                      <div className="text-xs text-muted-foreground">{opinion.author.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {opinion.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {opinion.comments}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {filteredOpinions.length === 0 && (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No opinions found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
