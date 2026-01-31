import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/index";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Premium serif font for headlines - gives authoritative, professional look
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Secondary serif for article body text
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bard-qr16.onrender.com"),
  title: {
    default: "Bard Global Finance Institute | African Financial Intelligence",
    template: "%s | Bard Global Finance Institute",
  },
  description:
    "Africa's premier financial intelligence platform. Real-time market data, breaking financial news, expert analysis, and research on African stock markets including JSE, NSE, and more.",
  keywords: [
    "African stock market",
    "JSE stocks",
    "African financial news",
    "South Africa stocks",
    "Nigeria stock exchange",
    "African market data",
    "investment research Africa",
    "African economy",
    "emerging markets Africa",
    "stock trading Africa",
    "financial analysis",
    "market intelligence",
  ],
  authors: [{ name: "Bard Global Finance Institute" }],
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
    title: "Bard Global Finance Institute | African Financial Intelligence",
    description:
      "Africa's premier financial intelligence platform. Real-time market data, breaking news, and expert analysis on African stock markets.",
    images: [
      {
        url: "/images/fav.png",
        width: 512,
        height: 512,
        alt: "Bard Global Finance Institute - African Financial Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bard Global Finance Institute",
    description: "Africa's premier financial intelligence platform. Real-time market data and expert analysis.",
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
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${mono.variable} ${playfair.variable} ${sourceSerif.variable} min-h-screen bg-background antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
