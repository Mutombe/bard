import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Fraunces, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/index";
import { Toaster } from "@/components/ui/sonner";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Premium variable serif for headlines - modern editorial with optical sizing
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Editorial serif for article body text - designed for news/long-form reading
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bgfi.global"),
  title: {
    default: "Bard Global Finance Institute | The Imperative of Informed Capital",
    template: "%s | Bard Global Finance Institute",
  },
  description:
    "Bard Global Finance Institute delivers comprehensive global research, advisory services, insights, and a factual foundation to facilitate investment allocation and strategic decision-making on the most critical economic and business issues affecting Africa's companies, economic sectors, and policy leaders. Publishers of Finance Africa Quarterly, Africa Finance Insights, and AfriFin Analytics.",
  keywords: [
    "African finance research",
    "African investment opportunities",
    "macroeconomic advisory Africa",
    "Finance Africa Quarterly",
    "AfriFin Analytics",
    "Africa Finance Insights",
    "African economic intelligence",
    "frontier markets Africa",
    "emerging markets Africa",
    "African capital markets",
    "Africa investment research",
    "JSE NGX NSE African stock exchanges",
    "African mining commodities",
    "African banking sector",
    "African fintech",
    "AfCFTA continental free trade",
    "informed capital Africa",
    "Bard Global Finance Institute",
    "BGFI",
  ],
  authors: [{ name: "Bard Global Finance Institute", url: "https://bgfi.global" }],
  creator: "Bard Global Finance Institute",
  publisher: "Bard Global Finance Institute",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "/",
    siteName: "Bard Global Finance Institute",
    title: "Bard Global Finance Institute | The Imperative of Informed Capital",
    description:
      "Comprehensive research, advisory, and insights on the critical economic and business issues affecting Africa's companies, economic sectors, and policy leaders. Publisher of the Finance Africa Quarterly.",
    images: [
      {
        url: "/images/fav.png",
        width: 512,
        height: 512,
        alt: "Bard Global Finance Institute - Informed Capital is Transformative Capital",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bard Global Finance Institute",
    description: "Africa-based finance research institute. Interpreting African economic conditions for the global investor. Informed capital is transformative capital.",
    images: ["/images/fav.png"],
    creator: "@BardGlobalFI",
  },
  icons: {
    icon: [
      { url: "/images/fav.png", type: "image/png" },
    ],
    shortcut: "/images/fav.png",
    apple: "/images/fav.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "/",
  },
  category: "finance",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Site-wide structured data — emitted in the <head> of every page so
// Google understands the publication entity and its search surface.
// Organization + WebSite are the two schemas Google uses for knowledge-
// panel eligibility and sitelinks-search-box (the in-result search box
// that shows for recognised brands).
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bgfi.global";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  "@id": `${SITE_URL}#organization`,
  name: "Bard Global Finance Institute",
  alternateName: "BGFI",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/images/fav.png`,
    width: 512,
    height: 512,
  },
  description:
    "Africa-based finance research institute. Comprehensive research, advisory and insights on African capital markets, economies, and policy leaders.",
  foundingDate: "2024",
  sameAs: [
    "https://www.linkedin.com/company/bardiq/",
    "https://twitter.com/BardGlobalFI",
  ],
  slogan: "Informed Capital is Transformative Capital",
  knowsLanguage: ["en"],
  areaServed: {
    "@type": "Continent",
    name: "Africa",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  url: SITE_URL,
  name: "Bard Global Finance Institute",
  description:
    "Africa-focused finance research, macroeconomic advisory, and editorial coverage of African capital markets.",
  publisher: { "@id": `${SITE_URL}#organization` },
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Site-wide structured data. Kept in the root layout so every
            page inherits the Organization + WebSite entities — Google
            links back to these via @id refs from page-level schemas
            (e.g. NewsArticle.publisher -> this Organization). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className={`${bricolage.variable} ${mono.variable} ${fraunces.variable} ${newsreader.variable} min-h-screen bg-background antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
