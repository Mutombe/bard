import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Bardiq Journal | Financial Intelligence Platform",
    template: "%s | Bardiq Journal",
  },
  description:
    "The Bloomberg of Africa - Real-time African market data, financial news, and research for institutional investors and traders.",
  keywords: [
    "African stocks",
    "JSE",
    "financial news",
    "market data",
    "stock exchange",
    "investment research",
    "Africa finance",
  ],
  authors: [{ name: "Bardiq Journal" }],
  creator: "Bardiq Journal",
  publisher: "Bardiq Journal",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://bardiqjournal.com",
    siteName: "Bardiq Journal",
    title: "Bardiq Journal | Financial Intelligence Platform",
    description:
      "The Bloomberg of Africa - Real-time African market data, financial news, and research.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bardiq Journal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bardiq Journal",
    description: "The Bloomberg of Africa",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
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
        className={`${inter.variable} ${mono.variable} min-h-screen bg-background antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
