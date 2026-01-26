"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  Share2,
  Bookmark,
  MessageSquare,
  ThumbsUp,
  ChevronRight,
  Twitter,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface RelatedArticle {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  imageUrl?: string;
  url: string;
}

interface RelatedStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// Mock article data
const articles: Record<string, {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: { name: string; role: string; avatar?: string };
  publishedAt: string;
  readTime: string;
  imageUrl?: string;
  tags: string[];
  relatedStocks: RelatedStock[];
}> = {
  "jse-record-high": {
    title: "JSE All Share Index Hits Record High Amid Strong Commodity Prices",
    excerpt: "South African equities surge as mining stocks rally on the back of rising gold and platinum prices, pushing the benchmark index to unprecedented levels.",
    content: `
      <p class="lead">The JSE All Share Index (J203) reached an all-time high of 78,456 points on Thursday, driven by a broad-based rally in resource stocks as global commodity prices continue their upward trajectory.</p>

      <p>Mining heavyweights Anglo American (AGL), BHP Group (BHP), and Gold Fields (GFI) led the charge, with gains of 8.75%, 5.2%, and 6.8% respectively. The rally comes as gold prices breached the $2,700 per ounce mark for the first time in six months, while platinum group metals (PGMs) also posted significant gains.</p>

      <h2>Commodity Tailwinds</h2>
      <p>The surge in commodity prices has been attributed to several factors:</p>
      <ul>
        <li>Weakening US dollar as markets price in potential Federal Reserve rate cuts</li>
        <li>Increased safe-haven demand amid global economic uncertainty</li>
        <li>Supply constraints in key mining regions</li>
        <li>Strong physical demand from central banks, particularly in emerging markets</li>
      </ul>

      <p>"The combination of dollar weakness and geopolitical tensions has created a perfect storm for commodity prices," said Peter van Zyl, Chief Economist at Investec. "South African mining stocks are direct beneficiaries of this trend."</p>

      <h2>Sector Performance</h2>
      <p>Beyond the resources sector, the rally was broad-based across the JSE:</p>

      <table>
        <thead>
          <tr>
            <th>Sector</th>
            <th>Performance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Resources</td>
            <td class="positive">+4.2%</td>
          </tr>
          <tr>
            <td>Financials</td>
            <td class="positive">+1.8%</td>
          </tr>
          <tr>
            <td>Industrials</td>
            <td class="positive">+1.2%</td>
          </tr>
          <tr>
            <td>Telecommunications</td>
            <td class="positive">+0.9%</td>
          </tr>
        </tbody>
      </table>

      <h2>Market Outlook</h2>
      <p>Analysts remain cautiously optimistic about the JSE's near-term prospects. "While valuations have become more stretched, the fundamental backdrop remains supportive," notes Sarah Moyo, Equity Strategist at Coronation Fund Managers. "We expect continued rotation into value and commodity-exposed stocks."</p>

      <p>However, some caution is warranted. The rand's strength against the dollar, while supportive of inflation expectations, could weigh on the earnings of rand-hedge stocks in coming quarters.</p>

      <h2>Technical Analysis</h2>
      <p>From a technical perspective, the break above the previous resistance level of 77,500 points opens the door for further upside. The next major resistance sits at the psychological 80,000 mark.</p>

      <p>Key support levels to watch include:</p>
      <ul>
        <li>76,800 - Previous resistance, now support</li>
        <li>75,500 - 50-day moving average</li>
        <li>73,200 - 200-day moving average</li>
      </ul>

      <blockquote>
        <p>"The JSE's record-breaking performance underscores South Africa's position as a gateway to African and commodity markets. For global investors seeking diversification, this presents compelling opportunities."</p>
        <cite>— Johan van der Berg, Portfolio Manager, Allan Gray</cite>
      </blockquote>

      <h2>What's Next</h2>
      <p>Market participants will be closely watching several upcoming events:</p>
      <ul>
        <li>South African Reserve Bank monetary policy decision (next week)</li>
        <li>US Federal Reserve meeting minutes</li>
        <li>Q4 earnings season for major JSE-listed companies</li>
        <li>Chinese economic data releases</li>
      </ul>

      <p>Trading volumes on Thursday were 35% above the 30-day average, suggesting strong conviction behind the move. Foreign investors were net buyers of R2.1 billion worth of equities, the highest single-day inflow in three months.</p>
    `,
    category: "Markets",
    author: { name: "Michael Sobukwe", role: "Senior Markets Reporter" },
    publishedAt: "January 25, 2024 • 2 hours ago",
    readTime: "6 min read",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=600&fit=crop",
    tags: ["JSE", "Mining", "Gold", "Equities", "South Africa"],
    relatedStocks: [
      { symbol: "AGL", name: "Anglo American", price: 567.34, change: 45.67, changePercent: 8.75 },
      { symbol: "GFI", name: "Gold Fields", price: 234.56, change: 14.89, changePercent: 6.78 },
      { symbol: "BHP", name: "BHP Group", price: 456.78, change: 22.45, changePercent: 5.17 },
    ],
  },
  "cbn-rates-decision": {
    title: "Central Bank of Nigeria Holds Rates Steady at 27.25%",
    excerpt: "The Monetary Policy Committee maintains benchmark interest rate as inflation remains elevated, signaling continued tight monetary policy stance.",
    content: `
      <p class="lead">Nigeria's Central Bank has kept its benchmark interest rate unchanged at 27.25% for the second consecutive meeting, as policymakers grapple with persistent inflationary pressures despite signs of economic slowdown.</p>

      <p>The Monetary Policy Committee (MPC), in its decision announced Thursday, cited the need to maintain a tight monetary stance to anchor inflation expectations and support the naira, which has faced renewed pressure in recent weeks.</p>

      <h2>Key Decision Points</h2>
      <ul>
        <li>Monetary Policy Rate (MPR) held at 27.25%</li>
        <li>Cash Reserve Ratio (CRR) maintained at 45%</li>
        <li>Asymmetric corridor retained at +100/-300 basis points</li>
        <li>Liquidity ratio kept at 30%</li>
      </ul>

      <p>"The Committee noted that while inflation remains elevated, there are early signs that the rate hike cycle is beginning to have the desired effect," said CBN Governor Olayemi Cardoso in the post-meeting press conference.</p>

      <h2>Economic Context</h2>
      <p>Nigeria's inflation rate stood at 29.9% in December, down marginally from 30.2% in November. However, food inflation, which disproportionately affects lower-income households, remains stubbornly high at 35.4%.</p>

      <p>The decision comes amid:</p>
      <ul>
        <li>Renewed pressure on the naira in the parallel market</li>
        <li>Foreign exchange liquidity constraints</li>
        <li>Mixed signals from the global economy</li>
        <li>Ongoing fiscal reforms by the federal government</li>
      </ul>

      <h2>Market Reaction</h2>
      <p>Nigerian government bonds rallied following the announcement, with yields on the benchmark 10-year note falling by 15 basis points to 18.5%. The NGX All Share Index closed 0.47% higher.</p>

      <h2>Analyst Views</h2>
      <p>"The CBN's decision to hold rates was widely expected given the current inflation dynamics," said Amara Okonkwo, Chief Economist at Stanbic IBTC. "We expect the MPC to maintain this hawkish stance through Q2 2024 before considering any rate adjustments."</p>

      <blockquote>
        <p>"The focus now shifts to the effectiveness of monetary policy transmission. With credit growth remaining robust despite high rates, there are questions about whether additional tightening may be needed."</p>
        <cite>— Chidi Eze, Head of Research, CardinalStone</cite>
      </blockquote>

      <h2>Outlook</h2>
      <p>Market participants will be watching several key indicators in the coming weeks:</p>
      <ul>
        <li>January inflation data (due mid-February)</li>
        <li>Foreign exchange market developments</li>
        <li>Federal government's 2024 budget implementation</li>
        <li>Oil production and export volumes</li>
      </ul>
    `,
    category: "Economics",
    author: { name: "Amara Okonkwo", role: "Economics Correspondent" },
    publishedAt: "January 25, 2024 • 4 hours ago",
    readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&h=600&fit=crop",
    tags: ["CBN", "Interest Rates", "Nigeria", "Monetary Policy", "Inflation"],
    relatedStocks: [
      { symbol: "GTCO", name: "Guaranty Trust", price: 45.80, change: 1.20, changePercent: 2.69 },
      { symbol: "ZENITHBANK", name: "Zenith Bank", price: 38.90, change: -0.45, changePercent: -1.14 },
      { symbol: "FBNH", name: "FBN Holdings", price: 24.50, change: 0.75, changePercent: 3.16 },
    ],
  },
};

const relatedArticles: RelatedArticle[] = [
  { id: "1", title: "Gold Prices Rally to Six-Month High on Dollar Weakness", category: "Commodities", publishedAt: "3 hours ago", url: "/news/gold-rally" },
  { id: "2", title: "Anglo American Increases Dividend Payout by 15%", category: "Corporate", publishedAt: "5 hours ago", url: "/news/anglo-dividend" },
  { id: "3", title: "Mining Sector Outlook: What to Expect in 2024", category: "Analysis", publishedAt: "1 day ago", url: "/news/mining-outlook" },
  { id: "4", title: "South African Reserve Bank Signals Potential Rate Cut", category: "Economics", publishedAt: "4 hours ago", url: "/news/sarb-rate-outlook" },
];

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const article = articles[slug];

  if (!article) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/news" className="text-brand-orange hover:text-brand-orange-light">
            ← Back to News
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <article className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/news" className="hover:text-foreground">News</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-brand-orange">{article.category}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-brand-orange text-white text-xs font-semibold rounded">
                  {article.category}
                </span>
                <span className="text-sm text-muted-foreground">{article.readTime}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                {article.title}
              </h1>

              <p className="text-xl text-muted-foreground mb-6">
                {article.excerpt}
              </p>

              {/* Author & Meta */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-terminal-bg-elevated flex items-center justify-center">
                    <span className="font-semibold text-brand-orange">
                      {article.author.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{article.author.name}</div>
                    <div className="text-sm text-muted-foreground">{article.author.role}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {article.publishedAt}
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {article.imageUrl && (
              <div className="relative aspect-[16/9] mb-8 rounded-lg overflow-hidden bg-terminal-bg-elevated">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* Article Content */}
            <div
              className="prose prose-invert prose-orange max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: article.content }}
              style={{
                '--tw-prose-body': 'var(--foreground)',
                '--tw-prose-headings': 'var(--foreground)',
                '--tw-prose-lead': 'var(--muted-foreground)',
                '--tw-prose-links': 'var(--brand-orange)',
                '--tw-prose-bold': 'var(--foreground)',
                '--tw-prose-counters': 'var(--muted-foreground)',
                '--tw-prose-bullets': 'var(--muted-foreground)',
                '--tw-prose-hr': 'var(--border)',
                '--tw-prose-quotes': 'var(--foreground)',
                '--tw-prose-quote-borders': 'var(--brand-orange)',
                '--tw-prose-captions': 'var(--muted-foreground)',
                '--tw-prose-code': 'var(--foreground)',
                '--tw-prose-pre-code': 'var(--foreground)',
                '--tw-prose-pre-bg': 'var(--terminal-bg-elevated)',
                '--tw-prose-th-borders': 'var(--border)',
                '--tw-prose-td-borders': 'var(--border)',
              } as React.CSSProperties}
            />

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/news?tag=${tag.toLowerCase()}`}
                  className="px-3 py-1 text-sm bg-terminal-bg-elevated rounded-full hover:bg-brand-orange hover:text-white transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>

            {/* Share & Actions */}
            <div className="flex items-center justify-between py-4 border-t border-b border-terminal-border mb-8">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ThumbsUp className="h-4 w-4" />
                  <span>245</span>
                </button>
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>32 Comments</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md">
                  <Bookmark className="h-4 w-4" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md">
                  <Twitter className="h-4 w-4" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md">
                  <Linkedin className="h-4 w-4" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md">
                  <Facebook className="h-4 w-4" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md">
                  <LinkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Related Articles */}
            <section>
              <h2 className="text-xl font-bold mb-4">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedArticles.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    className="block p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border hover:border-brand-orange/50 transition-colors group"
                  >
                    <span className="text-xs font-semibold text-brand-orange uppercase">
                      {item.category}
                    </span>
                    <h3 className="font-semibold mt-1 group-hover:text-brand-orange transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <span className="text-sm text-muted-foreground">{item.publishedAt}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Related Stocks */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h3 className="font-bold mb-4">Mentioned Stocks</h3>
              <div className="space-y-3">
                {article.relatedStocks.map((stock) => {
                  const isUp = stock.change >= 0;
                  return (
                    <Link
                      key={stock.symbol}
                      href={`/companies/${stock.symbol.toLowerCase()}`}
                      className="flex items-center justify-between p-2 rounded hover:bg-terminal-bg-elevated transition-colors"
                    >
                      <div>
                        <div className="font-mono font-semibold">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">{stock.price.toFixed(2)}</div>
                        <div className={cn("text-xs flex items-center gap-1", isUp ? "text-market-up" : "text-market-down")}>
                          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {isUp ? "+" : ""}{stock.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Newsletter */}
            <section className="p-4 rounded-lg bg-terminal-bg-elevated border border-brand-orange/30">
              <h3 className="font-bold mb-2">Stay Updated</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get breaking news and market analysis delivered to your inbox.
              </p>
              <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 text-sm bg-terminal-bg border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-md hover:bg-brand-orange-dark transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </section>

            {/* Author Bio */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h3 className="font-bold mb-3">About the Author</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-terminal-bg-elevated flex items-center justify-center">
                  <span className="font-semibold text-brand-orange">
                    {article.author.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{article.author.name}</div>
                  <div className="text-sm text-muted-foreground">{article.author.role}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Covering African markets and economics with over 10 years of experience in financial journalism.
              </p>
              <Link
                href={`/authors/${article.author.name.toLowerCase().replace(" ", "-")}`}
                className="text-sm text-brand-orange hover:text-brand-orange-light mt-2 inline-block"
              >
                View all articles →
              </Link>
            </section>
          </aside>
        </div>
      </article>
    </MainLayout>
  );
}
