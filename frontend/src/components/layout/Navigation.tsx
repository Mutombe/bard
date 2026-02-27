"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Building2,
  Newspaper,
  FileText,
  Mic,
  Radio,
  Mail,
  Bell,
  Bookmark,
  Heart,
  DollarSign,
  Briefcase,
  Landmark,
  Calculator,
  Users,
  Award,
  Target,
  Zap,
  MapPin,
  Cpu,
  Pickaxe,
  Wheat,
  BookOpen,
  Video,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSavedCounts } from "@/hooks/use-saved-counts";

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavDropdown {
  label: string;
  sections: NavSection[];
  featured?: {
    title: string;
    description: string;
    href: string;
    badge?: string;
  };
}

// Journal-focused navigation structure
const navigationData: NavDropdown[] = [
  {
    label: "Insights",
    sections: [
      {
        title: "By Industry",
        items: [
          { label: "Banking & Finance", href: "/industries/banking", icon: Landmark, description: "Financial services coverage" },
          { label: "Mining & Resources", href: "/industries/mining", icon: Pickaxe, description: "Commodities & extraction" },
          { label: "Technology", href: "/industries/technology", icon: Cpu, description: "Tech & innovation" },
          { label: "Agriculture", href: "/industries/agriculture", icon: Wheat, description: "Agribusiness & food" },
          { label: "Infrastructure", href: "/industries/infrastructure", icon: Building2, description: "Construction & energy" },
          { label: "All Industries", href: "/industries", icon: Briefcase, description: "View all sectors" },
        ],
      },
      {
        title: "By Region",
        items: [
          { label: "Southern Africa", href: "/regions/southern-africa", icon: MapPin, description: "SA, Zimbabwe, Botswana" },
          { label: "East Africa", href: "/regions/east-africa", icon: MapPin, description: "Kenya, Tanzania, Uganda" },
          { label: "West Africa", href: "/regions/west-africa", icon: MapPin, description: "Nigeria, Ghana" },
          { label: "North Africa", href: "/regions/north-africa", icon: MapPin, description: "Egypt, Morocco" },
          { label: "Global", href: "/industries/global", icon: Globe, description: "International markets" },
        ],
      },
      {
        title: "By Topic",
        items: [
          { label: "Central Banks", href: "/topics/central-banks", icon: Landmark, description: "Monetary policy" },
          { label: "Trade & Policy", href: "/topics/trade-policy", icon: Globe, description: "AfCFTA & trade" },
          { label: "Fintech", href: "/topics/fintech", icon: Zap, description: "Digital finance" },
          { label: "Sustainability", href: "/topics/sustainability", icon: Target, description: "ESG & climate" },
          { label: "All Topics", href: "/topics", icon: BookOpen, description: "Browse all topics" },
        ],
      },
    ],
    featured: {
      title: "Latest Insights",
      description: "Expert analysis on African markets and economies from our research team",
      href: "/news",
    },
  },
  {
    label: "Research",
    sections: [
      {
        title: "Publications",
        items: [
          { label: "All Research", href: "/research", icon: FileText, description: "Reports & analysis" },
          { label: "Equity Research", href: "/research?type=equity", icon: TrendingUp, description: "Company analysis" },
          { label: "Sector Reports", href: "/research?type=sector", icon: Building2, description: "Industry deep-dives" },
          { label: "Macro Analysis", href: "/research?type=macro", icon: Globe, description: "Economic research" },
          { label: "Strategy", href: "/research?type=strategy", icon: Target, description: "Investment strategy" },
        ],
      },
      {
        title: "Commentary",
        items: [
          { label: "Opinions", href: "/opinions", icon: Users, description: "Expert perspectives" },
          { label: "Columns", href: "/columns", icon: Newspaper, description: "Regular commentary" },
        ],
      },
    ],
    featured: {
      title: "Featured Report",
      description: "South African Banks: Q1 2026 Outlook - Analysis of loan growth and credit quality",
      href: "/research",
      badge: "New",
    },
  },
  {
    label: "Publications",
    sections: [
      {
        title: "Our Publications",
        items: [
          { label: "Finance Africa Quarterly", href: "/publications/finance-africa-quarterly", icon: BookOpen, description: "Flagship quarterly journal" },
          { label: "Finance Africa Insights", href: "/publications/finance-africa-insights", icon: Lightbulb, description: "Weekly editorial & analysis" },
          { label: "AfriFin Analytics", href: "/publications/afrifin-analytics", icon: BarChart3, description: "Daily data intelligence" },
        ],
      },
    ],
  },
  {
    label: "Global Media",
    sections: [
      {
        title: "Audio & Video",
        items: [
          { label: "Podcasts", href: "/podcasts", icon: Mic, description: "Expert discussions" },
          { label: "Videos", href: "/videos", icon: Video, description: "Market coverage" },
        ],
      },
    ],
  },
  {
    label: "My Library",
    sections: [
      {
        title: "Saved Content",
        items: [
          { label: "Saved Articles", href: "/saved", icon: Bookmark, description: "Bookmarked content" },
          { label: "Liked Articles", href: "/saved?tab=liked", icon: Heart, description: "Articles you liked" },
        ],
      },
      {
        title: "Account",
        items: [
          { label: "Profile", href: "/profile", icon: Users, description: "Your account" },
          { label: "Settings", href: "/settings", icon: Target, description: "Preferences" },
          { label: "Subscription", href: "/subscribe", icon: Award, description: "Manage plan" },
        ],
      },
    ],
  },
];

function DropdownSection({ section, savedCounts }: { section: NavSection; savedCounts?: { watchlistCount: number; savedArticlesCount: number; likesCount: number } }) {
  // Map hrefs to their saved counts
  const getItemBadge = (href: string | undefined) => {
    if (!savedCounts || !href) return null;

    if (href === "/saved" && savedCounts.savedArticlesCount > 0) {
      return savedCounts.savedArticlesCount;
    }
    if (href === "/saved?tab=liked" && savedCounts.likesCount > 0) {
      return savedCounts.likesCount;
    }
    return null;
  };

  return (
    <div className="py-2">
      <h4 className="px-3 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {section.title}
      </h4>
      <ul className="space-y-0.5">
        {section.items.map((item) => {
          const badge = getItemBadge(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href || "#"}
                className="flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-terminal-bg-elevated rounded-md transition-colors group"
              >
                {item.icon && (
                  <div className="relative">
                    <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    {badge !== null && (
                      <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2">
                    {item.label}
                    {badge !== null && !item.icon && (
                      <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NavDropdownMenu({ dropdown, isOpen, topOffset, savedCounts }: { dropdown: NavDropdown; isOpen: boolean; topOffset: number; savedCounts?: { watchlistCount: number; savedArticlesCount: number; likesCount: number } }) {
  if (!isOpen) return null;

  // Pass savedCounts to My Library dropdown
  const showSavedCounts = dropdown.label === "My Library" ? savedCounts : undefined;

  return (
    <div
      className="fixed inset-x-0 bg-terminal-bg-secondary border-t-2 border-t-primary/50 border-b border-terminal-border shadow-2xl z-[100]"
      style={{ top: `${topOffset}px` }}
    >
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-8">
          {/* Sections */}
          <div className="flex-1 grid grid-cols-3 gap-6">
            {dropdown.sections.map((section) => (
              <DropdownSection key={section.title} section={section} savedCounts={showSavedCounts} />
            ))}
          </div>

          {/* Featured */}
          {dropdown.featured && (
            <div className="w-64 flex-shrink-0">
              <Link
                href={dropdown.featured.href}
                className="block p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {dropdown.featured.title}
                  </h4>
                  {dropdown.featured.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded">
                      {dropdown.featured.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {dropdown.featured.description}
                </p>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownTop, setDropdownTop] = useState(65);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const savedCounts = useSavedCounts();

  // Calculate dropdown position based on header
  useEffect(() => {
    const updatePosition = () => {
      if (navRef.current) {
        const header = navRef.current.closest('header');
        if (header) {
          const rect = header.getBoundingClientRect();
          setDropdownTop(rect.bottom);
        }
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 300);
  };

  const handleDropdownMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleDropdownMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  // Check if My Library has any saved items
  const hasLibraryItems = savedCounts.totalCount > 0;

  return (
    <>
      <nav ref={navRef} className="hidden lg:flex items-center gap-1 relative">
        {navigationData.map((dropdown) => {
          const showBadge = dropdown.label === "My Library" && hasLibraryItems;
          return (
            <div
              key={dropdown.label}
              className="relative"
              onMouseEnter={() => handleMouseEnter(dropdown.label)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm font-bold transition-colors rounded-md",
                  openDropdown === dropdown.label
                    ? "text-primary bg-terminal-bg-elevated"
                    : "text-foreground/80 hover:text-foreground hover:bg-terminal-bg-elevated"
                )}
              >
                {dropdown.label}
                {showBadge && (
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    openDropdown === dropdown.label && "rotate-180"
                  )}
                />
              </button>
            </div>
          );
        })}
      </nav>

      {/* Dropdown Menus - rendered outside nav for full-width */}
      {navigationData.map((dropdown) => (
        <div
          key={dropdown.label}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          <NavDropdownMenu
            dropdown={dropdown}
            isOpen={openDropdown === dropdown.label}
            topOffset={dropdownTop}
            savedCounts={savedCounts}
          />
        </div>
      ))}
    </>
  );
}

// Export navigation data for mobile menu
export { navigationData };
export type { NavDropdown, NavSection, NavItem };
