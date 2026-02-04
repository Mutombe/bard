"use client";

import Link from "next/link";
import { ChevronRight, MapPin, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

const regions = [
  {
    name: "Southern Africa",
    slug: "southern-africa",
    description: "South Africa, Zimbabwe, Botswana, Namibia, Zambia, and other SADC nations. Home to Africa's largest stock exchange and key mining operations.",
    countries: ["South Africa", "Zimbabwe", "Botswana", "Namibia", "Zambia", "Mozambique", "Mauritius"],
    gdp: "$720B",
    exchanges: ["JSE", "ZSE", "BSE"],
  },
  {
    name: "East Africa",
    slug: "east-africa",
    description: "Kenya, Tanzania, Uganda, Rwanda, and the East African Community. A rapidly growing region with strong tech ecosystems.",
    countries: ["Kenya", "Tanzania", "Uganda", "Rwanda", "Ethiopia"],
    gdp: "$310B",
    exchanges: ["NSE", "DSE", "USE"],
  },
  {
    name: "West Africa",
    slug: "west-africa",
    description: "Nigeria, Ghana, Côte d'Ivoire, Senegal, and ECOWAS economies. Home to Africa's largest economy and key oil & gas production.",
    countries: ["Nigeria", "Ghana", "Côte d'Ivoire", "Senegal", "Cameroon"],
    gdp: "$680B",
    exchanges: ["NGX", "GSE", "BRVM"],
  },
  {
    name: "North Africa",
    slug: "north-africa",
    description: "Egypt, Morocco, Tunisia, Algeria, and Libya. Strategically important region connecting Africa with Europe and the Middle East.",
    countries: ["Egypt", "Morocco", "Tunisia", "Algeria"],
    gdp: "$540B",
    exchanges: ["EGX", "CSE", "BVMT"],
  },
];

export default function RegionsPage() {
  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary">Regions</span>
        </nav>

        {/* Header */}
        <header className="mb-12 max-w-3xl">
          <h1 className="headline-xl mb-4">Regions</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Explore our coverage by geographic region. Each region has unique economic
            characteristics, regulatory environments, and market dynamics that shape
            investment opportunities and risks.
          </p>
        </header>

        {/* Regions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {regions.map((region) => (
            <Link
              key={region.slug}
              href={`/regions/${region.slug}`}
              className="group p-6 rounded-lg bg-terminal-bg-secondary border border-terminal-border hover:border-primary/50 transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="headline text-xl mb-1 group-hover:text-primary transition-colors">
                    {region.name}
                  </h2>
                  <div className="text-sm text-muted-foreground">
                    Est. GDP: {region.gdp}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {region.description}
              </p>

              <div className="mb-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Key Countries
                </div>
                <div className="flex flex-wrap gap-1">
                  {region.countries.slice(0, 4).map((country) => (
                    <span
                      key={country}
                      className="px-2 py-0.5 text-xs bg-terminal-bg-elevated rounded"
                    >
                      {country}
                    </span>
                  ))}
                  {region.countries.length > 4 && (
                    <span className="px-2 py-0.5 text-xs text-muted-foreground">
                      +{region.countries.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-2">
                  {region.exchanges.map((exchange) => (
                    <span
                      key={exchange}
                      className="px-2 py-0.5 text-xs font-mono bg-terminal-bg-elevated rounded"
                    >
                      {exchange}
                    </span>
                  ))}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* Pan-African Section */}
        <section className="mt-16 pt-12 border-t border-terminal-border">
          <h2 className="headline text-2xl mb-6">Pan-African Coverage</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Some of the most important stories transcend regional boundaries. Our
            pan-African coverage tracks developments that impact the entire continent.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/topics/afcfta"
              className="p-4 rounded-lg bg-terminal-bg-elevated hover:bg-terminal-bg-secondary transition-colors"
            >
              <h3 className="font-semibold mb-1">AfCFTA</h3>
              <p className="text-sm text-muted-foreground">
                The African Continental Free Trade Area
              </p>
            </Link>
            <Link
              href="/topics/african-union"
              className="p-4 rounded-lg bg-terminal-bg-elevated hover:bg-terminal-bg-secondary transition-colors"
            >
              <h3 className="font-semibold mb-1">African Union</h3>
              <p className="text-sm text-muted-foreground">
                Continental governance and policy
              </p>
            </Link>
            <Link
              href="/topics/african-development-bank"
              className="p-4 rounded-lg bg-terminal-bg-elevated hover:bg-terminal-bg-secondary transition-colors"
            >
              <h3 className="font-semibold mb-1">Development Finance</h3>
              <p className="text-sm text-muted-foreground">
                AfDB, DFIs, and development finance
              </p>
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
