"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  User,
  Menu,
  X,
  Star,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Bookmark,
  Mail,
  ExternalLink,
  LayoutDashboard,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { toggleMobileMenu, toggleSearch } from "@/store/slices/uiSlice";
import { clearAuth } from "@/store/slices/authSlice";
import { clearAuthFromStorage } from "@/components/providers/AuthInitializer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Navigation, navigationData } from "./Navigation";
import { MarketStrip } from "./MarketStrip";
import { AuthModal } from "@/components/auth/AuthModal";
import { LiveSearch } from "@/components/search/LiveSearch";

interface MainLayoutProps {
  children: ReactNode;
}

// Secondary nav links
const secondaryLinks = [
  { href: "/podcasts", label: "Podcasts" },
  { href: "/newsletters", label: "Newsletters" },
  { href: "/events", label: "Events" },
  { href: "/subscribe", label: "Subscribe", highlight: true },
];

// Mobile navigation component
function MobileNavigation({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-terminal-bg border-l border-terminal-border overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-terminal-border">
          <span className="font-semibold">Menu</span>
          <button onClick={onClose} className="p-2 hover:bg-terminal-bg-elevated rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4">
          {navigationData.map((dropdown) => (
            <div key={dropdown.label} className="mb-2">
              <button
                onClick={() => setExpandedSection(expandedSection === dropdown.label ? null : dropdown.label)}
                className="flex items-center justify-between w-full px-3 py-3 text-left font-medium hover:bg-terminal-bg-elevated rounded-md"
              >
                {dropdown.label}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expandedSection === dropdown.label && "rotate-180"
                  )}
                />
              </button>

              {expandedSection === dropdown.label && (
                <div className="mt-1 ml-3 border-l border-terminal-border">
                  {dropdown.sections.map((section) => (
                    <div key={section.title} className="py-2">
                      <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase">
                        {section.title}
                      </div>
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href || "#"}
                          onClick={onClose}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md"
                        >
                          {item.icon && <item.icon className="h-4 w-4" />}
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-terminal-border">
            {secondaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "block px-3 py-3 rounded-md",
                  link.highlight
                    ? "bg-brand-orange text-white font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}


export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { mobileMenuOpen, searchOpen } = useAppSelector((state) => state.ui);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const openLoginModal = () => {
    setAuthModalMode("login");
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode("register");
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    clearAuthFromStorage();
  };

  return (
    <div className="min-h-screen bg-terminal-bg flex flex-col">
      {/* Top Bar - Secondary Navigation */}
      <div className="bg-terminal-bg border-b border-terminal-border">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-8 text-xs">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                {new Date().toLocaleDateString("en-ZA", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "transition-colors",
                    link.highlight
                      ? "text-brand-orange hover:text-brand-orange-light font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-terminal-bg border-b border-terminal-border">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Bardiq Journal"
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <div className="hidden sm:block">
                <div className="font-bold text-xl tracking-tight">
                  <span className="text-foreground">Bardiq</span>
                  <span className="text-brand-orange"> Journal</span>
                </div>
                <div className="text-[10px] text-muted-foreground tracking-widest uppercase -mt-0.5">
                  A publication of the BGFI
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <Navigation />

            {/* Right Side Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dispatch(toggleSearch())}
                className="hidden sm:flex"
              >
                <Search className="h-5 w-5" />
              </Button>

              {isAuthenticated ? (
                <>
                  {/* Watchlist */}
                  <Link href="/watchlist">
                    <Button variant="ghost" size="icon">
                      <Star className="h-5 w-5" />
                    </Button>
                  </Link>

                  {/* Notifications */}
                  <Link href="/notifications" className="relative">
                    <Button variant="ghost" size="icon">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-brand-orange text-[10px] flex items-center justify-center text-white font-medium">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Button>
                  </Link>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span>{user?.full_name || "User"}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {user?.email}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/watchlist">
                          <Star className="h-4 w-4 mr-2" />
                          Watchlist
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/saved">
                          <Bookmark className="h-4 w-4 mr-2" />
                          Saved Articles
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/alerts">
                          <Bell className="h-4 w-4 mr-2" />
                          Price Alerts
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/newsletters">
                          <Mail className="h-4 w-4 mr-2" />
                          Newsletters
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      {/* Admin Link - Only visible to admins */}
                      {(user?.role === "super_admin" || user?.role === "editor" || user?.is_staff || user?.is_superuser) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="text-brand-orange">
                              <LayoutDashboard className="h-4 w-4 mr-2" />
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex"
                    onClick={openLoginModal}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    className="bg-brand-orange hover:bg-brand-orange-dark text-white"
                    onClick={openRegisterModal}
                  >
                    Subscribe
                  </Button>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => dispatch(toggleMobileMenu())}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Market Strip */}
      <MarketStrip />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-terminal-border bg-terminal-bg-secondary">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/images/logo.png"
                  alt="Bardiq Journal"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="font-bold">Bardiq Journal</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your trusted source for African financial intelligence and market data.
              </p>
              <p className="text-xs text-muted-foreground/80 mb-4 italic">
                A publication of the Bard Global Finance Institute (BGFI).
              </p>
              <div className="flex items-center gap-3">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm">Markets</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/markets/jse" className="hover:text-foreground">JSE</Link></li>
                <li><Link href="/markets/ngx" className="hover:text-foreground">NGX</Link></li>
                <li><Link href="/markets/egx" className="hover:text-foreground">EGX</Link></li>
                <li><Link href="/markets/indices" className="hover:text-foreground">Indices</Link></li>
                <li><Link href="/markets/forex" className="hover:text-foreground">Forex</Link></li>
                <li><Link href="/markets/commodities" className="hover:text-foreground">Commodities</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm">News & Analysis</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/news" className="hover:text-foreground">Latest News</Link></li>
                <li><Link href="/analysis" className="hover:text-foreground">Analysis</Link></li>
                <li><Link href="/research" className="hover:text-foreground">Research</Link></li>
                <li><Link href="/opinions" className="hover:text-foreground">Opinions</Link></li>
                <li><Link href="/columns" className="hover:text-foreground">Columns</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm">Tools</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/portfolio" className="hover:text-foreground">Portfolio</Link></li>
                <li><Link href="/watchlist" className="hover:text-foreground">Watchlist</Link></li>
                <li><Link href="/screener" className="hover:text-foreground">Stock Screener</Link></li>
                <li><Link href="/alerts" className="hover:text-foreground">Price Alerts</Link></li>
                <li><Link href="/economics/calendar" className="hover:text-foreground">Economic Calendar</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/advertise" className="hover:text-foreground">Advertise</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-terminal-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Bardiq Journal. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground text-center md:text-right">
              Market data delayed by at least 15 minutes. Data provided for informational purposes only. Not financial advice.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation */}
      <MobileNavigation isOpen={mobileMenuOpen} onClose={() => dispatch(toggleMobileMenu())} />

      {/* Live Search */}
      <LiveSearch isOpen={searchOpen} onClose={() => dispatch(toggleSearch())} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}
