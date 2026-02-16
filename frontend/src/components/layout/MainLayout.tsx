"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
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
  Linkedin,
  LayoutDashboard,
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
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
import { useAuthModal } from "@/contexts/AuthModalContext";
import { LiveSearch } from "@/components/search/LiveSearch";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ThemeLogo } from "@/components/ui/theme-logo";

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
                    ? "bg-primary text-white font-medium"
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
  const { openLogin, openRegister } = useAuthModal();

  const handleLogout = () => {
    dispatch(clearAuth());
    clearAuthFromStorage();
  };

  return (
    <div className="min-h-screen bg-terminal-bg flex flex-col">
      {/* Top Bar - Secondary Navigation */}
      <div className="bg-terminal-bg border-b border-terminal-border">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
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
                      ? "text-primary hover:text-primary-light font-medium"
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
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <ThemeLogo width={128} height={32} className="max-h-[32px]" />
            </Link>

            {/* Desktop Navigation */}
            <Navigation />

            {/* Right Side Actions */}
            <div className="flex items-center gap-1">
              {/* Theme Toggle */}
              <ThemeToggle />

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
                        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-white font-medium">
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
                            <Link href="/admin" className="text-primary">
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
                    onClick={openLogin}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={openRegister}
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

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-terminal-border bg-terminal-bg-secondary">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="col-span-2">
              <div className="mb-4">
                <ThemeLogo width={140} height={38} />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-semibold text-foreground">African Finance Insights</span>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Reducing information asymmetry in Africa&apos;s financial markets. Research, analysis, and intelligence for informed decision-making.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <FaXTwitter className="h-4 w-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Insights</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/news" className="hover:text-foreground">Latest Insights</Link></li>
                <li><Link href="/research" className="hover:text-foreground">Research</Link></li>
                <li><Link href="/analysis" className="hover:text-foreground">Analysis</Link></li>
                <li><Link href="/opinions" className="hover:text-foreground">Opinions</Link></li>
                <li><Link href="/podcasts" className="hover:text-foreground">Podcasts</Link></li>
                <li><Link href="/videos" className="hover:text-foreground">Videos</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">By Industry</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/industries/banking" className="hover:text-foreground">Banking & Finance</Link></li>
                <li><Link href="/industries/mining" className="hover:text-foreground">Mining & Resources</Link></li>
                <li><Link href="/industries/technology" className="hover:text-foreground">Technology</Link></li>
                <li><Link href="/industries/agriculture" className="hover:text-foreground">Agriculture</Link></li>
                <li><Link href="/industries/infrastructure" className="hover:text-foreground">Infrastructure</Link></li>
                <li><Link href="/industries/energy" className="hover:text-foreground">Energy</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">By Region</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/regions/southern-africa" className="hover:text-foreground">Southern Africa</Link></li>
                <li><Link href="/regions/east-africa" className="hover:text-foreground">East Africa</Link></li>
                <li><Link href="/regions/west-africa" className="hover:text-foreground">West Africa</Link></li>
                <li><Link href="/regions/north-africa" className="hover:text-foreground">North Africa</Link></li>
                <li><Link href="/regions/central-africa" className="hover:text-foreground">Central Africa</Link></li>
                <li><Link href="/markets" className="hover:text-foreground">Markets Data</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">About</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About BGFI</Link></li>
                <li><Link href="/about#mission" className="hover:text-foreground">Our Mission</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/newsletters" className="hover:text-foreground">Newsletters</Link></li>
                <li><Link href="/subscribe" className="hover:text-foreground">Subscribe</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-terminal-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Bard Global Finance Institute. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/accessibility" className="hover:text-foreground">Accessibility</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation */}
      <MobileNavigation isOpen={mobileMenuOpen} onClose={() => dispatch(toggleMobileMenu())} />

      {/* Live Search */}
      <LiveSearch isOpen={searchOpen} onClose={() => dispatch(toggleSearch())} />
    </div>
  );
}
