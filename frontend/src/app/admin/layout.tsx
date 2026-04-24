"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  SquaresFour,
  FileText,
  Envelope,
  Users,
  Image as ImageIcon,
  GearSix,
  CaretLeft,
  CaretRight,
  Bell,
  MagnifyingGlass,
  SignOut,
  List,
  X,
  Lock,
  ClipboardText,
  BookOpen,
  Tag,
  Factory,
  Globe,
  ChartBar,
  PenNib,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAppSelector, useAppDispatch } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { useAuthModal } from "@/contexts/AuthModalContext";

interface AdminLayoutProps {
  children: ReactNode;
}

const sidebarItems = [
  { href: "/admin", label: "Dashboard", icon: SquaresFour },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/research", label: "Research", icon: BookOpen },
  { href: "/admin/analytics", label: "Analytics", icon: ChartBar },
  { href: "/admin/insights", label: "Insights", icon: ChartBar },
  { href: "/admin/tasks", label: "Tasks", icon: ClipboardText },
  { href: "/admin/topics", label: "Topics", icon: Tag },
  { href: "/admin/industries", label: "Industries", icon: Factory },
  { href: "/admin/regions", label: "Regions", icon: Globe },
  { href: "/admin/newsletters", label: "Newsletters", icon: Envelope },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/writers", label: "Writers", icon: PenNib },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: GearSix },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { openLogin } = useAuthModal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch unread notification count, refresh every 60s
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = async () => {
      try {
        const { userService } = await import("@/services/api/user");
        const data = await userService.getUnreadNotificationCount();
        setUnreadNotifications(data.count || 0);
      } catch {
        setUnreadNotifications(0);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Check if user has admin access
  // Accept super_admin, editor roles, or any staff user
  const isAdmin = user?.role === "super_admin" ||
                  user?.role === "editor" ||
                  user?.is_staff === true ||
                  user?.is_superuser === true;

  // Open auth modal if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      openLogin();
    }
  }, [isAuthenticated, openLogin]);

  // NOTE: session-expired handling is now site-wide via
  // <SessionExpiredModal /> mounted in the Providers tree. It shows a
  // clear "Session expired" card with a Sign-in CTA on every page, not
  // just /admin. The admin-only listener used to silently auto-open
  // the login modal which was confusing — now the user sees an
  // explicit reason before the login surface appears.

  // Show overlay while not authenticated - modal will handle the login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-terminal-bg flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to access the admin area.
          </p>
          <button
            onClick={openLogin}
            className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-terminal-bg flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-16 w-16 text-market-down mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You need admin privileges to access this area.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Current role: {user?.role || "none"}
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-terminal-bg flex">
      {/* Sidebar — flex column so the nav scrolls independently when the
          item list exceeds viewport height. The old layout used
          `absolute bottom-0` for the user panel, which clobbered nav items
          on short screens and made the list feel clustered. */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 bg-terminal-bg-secondary border-r border-terminal-border transition-all duration-300 hidden lg:flex lg:flex-col",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-terminal-border flex-shrink-0">
          {!sidebarCollapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <Image
                src="/images/fav.png"
                alt="BGFI"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                priority
              />
              <span className="font-serif font-bold text-base">BGFI Admin</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/admin" className="flex items-center justify-center w-full">
              <Image
                src="/images/fav.png"
                alt="BGFI"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </Link>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-terminal-bg-elevated rounded-md"
          >
            {sidebarCollapsed ? (
              <CaretRight className="h-4 w-4" />
            ) : (
              <CaretLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation — flex-1 + overflow-y-auto so long item lists scroll
            independently of the header/footer on short screens. */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 sidebar-scroll">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info — now a regular flex child at the bottom of the column,
            no longer absolutely positioned. Stays visible while the nav
            scrolls above it. */}
        <div className="p-4 border-t border-terminal-border flex-shrink-0">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <UserAvatar
                src={user?.profile?.avatar}
                name={user?.full_name}
                identifier={user?.id}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.full_name}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-muted-foreground hover:text-foreground"
                title="Sign out"
              >
                <SignOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UserAvatar
                src={user?.profile?.avatar}
                name={user?.full_name}
                identifier={user?.id}
                size="sm"
              />
              <button
                onClick={handleLogout}
                className="w-full flex justify-center p-2 text-muted-foreground hover:text-foreground"
                title="Sign out"
              >
                <SignOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-terminal-bg-secondary border-b border-terminal-border">
        <div className="h-16 flex items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-sm flex items-center justify-center">
              <span className="font-bold text-white text-sm">BS</span>
            </div>
            <span className="font-bold">Admin</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-terminal-bg-elevated rounded-md"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-terminal-border bg-terminal-bg-secondary max-h-[calc(100vh-4rem)] overflow-y-auto sidebar-scroll">
            <nav className="p-2 space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
          "pt-16 lg:pt-0"
        )}
      >
        {/* Top Bar */}
        <div className="hidden lg:flex h-16 items-center justify-between px-6 border-b border-terminal-border bg-terminal-bg">
          <div className="relative w-96">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles, users..."
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              View Site
            </Link>
            <Link
              href="/admin/notifications"
              className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 text-[10px] font-bold bg-brand-coral text-white rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
