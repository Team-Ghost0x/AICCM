"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { setupAudioUnlocker, playClickSound } from "@/lib/client/audio";
import { isInputElement } from "./take-scrubber";
import { AuthModal } from "./auth-modal";
import {
  HomeIcon,
  SearchIcon,
  PlusIcon,
  UserIcon,
  OrdersIcon,
  MessageIcon,
} from "./icons";
import { getCurrentUser, onAuthChange, logout, syncSessionWithBackend, User, UserRole } from "@/lib/client/auth";
import { allPlatformCreators } from "@/lib/contract/fixtures";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isBrand = user?.role === "brand";

  useEffect(() => {
    setupAudioUnlocker();

    syncSessionWithBackend().then((verified) => {
      if (verified) setUser(verified);
    });

    const unsubscribe = onAuthChange((updated) => {
      setUser(updated);
    });

    const handleSlashShortcut = (e: KeyboardEvent) => {
      if (e.key === "/" && !isInputElement(e.target)) {
        if (!isBrand) return;
        e.preventDefault();
        const searchInput = document.getElementById("search-q") as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
        } else {
          router.push("/discover");
        }
      }
    };

    window.addEventListener("keydown", handleSlashShortcut);
    return () => {
      unsubscribe();
      window.removeEventListener("keydown", handleSlashShortcut);
    };
  }, [router, isBrand]);

  const [authRole, setAuthRole] = useState<UserRole>("brand");

  const isAdmin = user?.role === "admin";
  const isCreator = user?.role === "creator";

  // Resolve active creator's profile page handle dynamically
  const creatorProfileHref = (() => {
    if (user) {
      const match = allPlatformCreators.find(
        (c) => c.id === user.id || c.handle === user.id || (user.email && c.bio.includes(user.email))
      );
      if (match) return `/creators/${match.handle}`;
      // Derive a handle from the user's id (e.g. "creator-arjun" -> "/creators/creator-arjun")
      return `/creators/${user.id}`;
    }
    return "/creators";
  })();

  const navItems = isAdmin
    ? [
        { label: "Admin Console", href: "/admin", icon: OrdersIcon, active: pathname.startsWith("/admin") },
        { label: "Campaign Briefs", href: "/briefs", icon: OrdersIcon, active: pathname.startsWith("/briefs") && !pathname.includes("new") },
        { label: "Production Tracker", href: "/tracker", icon: OrdersIcon, active: pathname === "/tracker" },
        { label: "Messages", href: "/messages", icon: MessageIcon, active: pathname === "/messages" },
        { label: "Admin Hub", href: "/dashboard", icon: UserIcon, active: pathname === "/dashboard" },
      ]
    : isCreator
    ? [
        { label: "Home", href: "/", icon: HomeIcon, active: pathname === "/" },
        { label: "Creator Hub", href: "/dashboard", icon: UserIcon, active: pathname === "/dashboard" },
        { label: "Open Briefs", href: "/briefs", icon: OrdersIcon, active: pathname.startsWith("/briefs") && !pathname.includes("new") },
        { label: "Takes & Delivery", href: "/tracker", icon: OrdersIcon, active: pathname === "/tracker" },
        { label: "Messages", href: "/messages", icon: MessageIcon, active: pathname === "/messages" },
        { label: "My Profile", href: creatorProfileHref, icon: UserIcon, active: pathname.startsWith("/creators") },
      ]
    : isBrand
    ? [
        { label: "Home", href: "/", icon: HomeIcon, active: pathname === "/" },
        { label: "Brand Hub", href: "/dashboard", icon: UserIcon, active: pathname === "/dashboard" },
        { label: "Find Creators", href: "/discover", icon: SearchIcon, active: pathname.startsWith("/discover") },
        { label: "Campaign Briefs", href: "/briefs", icon: OrdersIcon, active: pathname.startsWith("/briefs") && !pathname.includes("new") },
        { label: "Active Projects", href: "/tracker", icon: OrdersIcon, active: pathname === "/tracker" },
        { label: "Messages", href: "/messages", icon: MessageIcon, active: pathname === "/messages" },
      ]
    : [
        { label: "Home", href: "/", icon: HomeIcon, active: pathname === "/" },
        { label: "Campaign Briefs", href: "/briefs", icon: OrdersIcon, active: pathname.startsWith("/briefs") && !pathname.includes("new") },
        { label: "Sign In", href: "/dashboard", icon: UserIcon, active: pathname === "/dashboard" },
      ];

  return (
    <>
      {/* Top Header Bar (Desktop & Tablet) */}
      <header className="hidden md:flex fixed top-0 left-[72px] lg:left-[244px] right-0 h-14 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] px-6 items-center justify-between z-30 transition-colors">
        {/* Left: Quick Search (Only for Brands) */}
        {isBrand ? (
          <div className="flex items-center gap-3 w-72">
            <Link
              href="/discover"
              className="flex items-center gap-2 px-3 py-1.5 w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-secondary-aa)] hover:border-[var(--control-border)] transition-colors cursor-pointer"
            >
              <SearchIcon size={15} />
              <span>Search creators, tools...</span>
              <kbd className="ml-auto text-[10px] bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono text-[var(--text-secondary-aa)]">
                /
              </kbd>
            </Link>
          </div>
        ) : (
          <div className="w-72" />
        )}

        {/* Right: Role Switch & User Account Controls */}
        <div className="flex items-center gap-3.5">
          {/* Role Status Badge (replaces obsolete buying/selling toggle) */}
          {user && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-[var(--bg)] rounded-full border border-[var(--border)] select-none">
              <span
                className={`w-2 h-2 rounded-full ${
                  user.role === "admin"
                    ? "bg-amber-500"
                    : isCreator
                    ? "bg-purple-600"
                    : "bg-blue-600"
                }`}
              />
              <span className="text-[11px] font-bold text-[var(--text)] uppercase tracking-wider font-mono">
                {user.role === "admin" ? "Admin Console" : isCreator ? "AI Creator" : "Brand / Agency"}
              </span>
            </div>
          )}

          {/* User Sign In / Profile Button on Top Header */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  ₹{(user.balanceInr || 0).toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-secondary-aa)] uppercase">
                  {user.role} wallet
                </span>
              </div>
              <div className="flex items-center gap-2 border-l border-[var(--border)] pl-3">
                <Link
                  href="/dashboard"
                  className="w-8 h-8 rounded-full bg-[var(--gradient-text-safe)] text-white font-bold text-xs flex items-center justify-center hover:scale-105 transition-transform shadow-xs"
                  title={user.name}
                  aria-label={`View profile for ${user.name}`}
                >
                  {user.name.charAt(0)}
                </Link>
                <div className="hidden lg:flex flex-col">
                  <span className="text-xs font-bold text-[var(--text)] leading-tight max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      logout();
                    }}
                    className="text-[11px] font-medium text-[var(--text-secondary-aa)] hover:text-[var(--danger-aa)] text-left cursor-pointer transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setAuthRole("brand");
                  setShowAuthModal(true);
                }}
                className="px-3 py-1.5 bg-transparent border border-[var(--border)] hover:border-[var(--text)] text-[var(--text)] text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setAuthRole("brand");
                  setShowAuthModal(true);
                }}
                className="px-3.5 py-1.5 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-lg transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-xs select-none"
              >
                Join Marketplace
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[244px] bg-[var(--surface)] border-r border-[var(--border)] flex-col justify-between p-4 z-40 transition-colors">
        <div className="flex flex-col gap-5">
          {/* Wordmark (Gradient Text) */}
          <Link
            href="/"
            className="flex items-center gap-2 select-none px-2 pt-2 group"
            aria-label="Retake Home"
          >
            <span
              className="text-2xl font-black tracking-tight"
              style={{
                background: "var(--gradient-primary)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              retake
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] font-bold text-[var(--text-secondary-aa)]">
              {user ? (isAdmin ? "ADMIN" : isCreator ? "CREATOR" : "BRAND") : "GUEST"}
            </span>
          </Link>

          {/* Primary Action Button */}
          {isAdmin ? (
            <Link
              href="/admin"
              onClick={() => playClickSound()}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm text-white shadow-xs transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] select-none"
              style={{ background: "var(--gradient-text-safe)" }}
            >
              <OrdersIcon size={16} className="text-white" />
              <span>Admin Console</span>
            </Link>
          ) : isCreator ? (
            <Link
              href="/briefs"
              onClick={() => playClickSound()}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm text-white shadow-xs transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] select-none"
              style={{ background: "var(--gradient-text-safe)" }}
            >
              <OrdersIcon size={16} className="text-white" />
              <span>Browse Open Briefs</span>
            </Link>
          ) : (
            <Link
              href={user ? "/briefs/new" : "#"}
              onClick={(e) => {
                playClickSound();
                if (!user) {
                  e.preventDefault();
                  setAuthRole("brand");
                  setShowAuthModal(true);
                }
              }}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm text-white shadow-xs transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] select-none"
              style={{ background: "var(--gradient-text-safe)" }}
            >
              <PlusIcon size={16} className="text-white" />
              <span>Post a brief</span>
            </Link>
          )}

          {/* Primary Navigation */}
          <nav className="flex flex-col gap-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={`flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer min-h-[44px] ${
                    item.active
                      ? "text-[var(--text)] font-bold bg-[var(--bg)]"
                      : "text-[var(--text-secondary-aa)] hover:text-[var(--text)] hover:bg-[var(--bg)] font-medium"
                  }`}
                >
                  <Icon
                    size={20}
                    fill={item.active ? "currentColor" : "none"}
                    className={item.active ? "text-[var(--text)]" : "text-[var(--text-secondary)]"}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Secondary Tools */}
          <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary-aa)] px-3 mb-1">
              {isAdmin ? "Platform Controls" : isCreator ? "Creator Hub" : "Campaign Tools"}
            </span>
            <Link
              href={isAdmin ? "/admin" : isCreator ? "/dashboard" : "/briefs/new"}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                (isAdmin && pathname === "/admin") || (isCreator && pathname === "/dashboard") || (!isAdmin && !isCreator && pathname === "/briefs/new")
                  ? "bg-[var(--bg)] text-[var(--text)] font-bold"
                  : "text-[var(--text-secondary-aa)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
              }`}
            >
              <span>{isAdmin ? "Moderation Queue" : isCreator ? "Portfolio & Verification" : "Post Campaign Brief"}</span>
              <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-mono font-bold">
                {isAdmin ? "OPS" : isCreator ? "PRO" : "NEW"}
              </span>
            </Link>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2">
          {!user && (
            <button
              type="button"
              onClick={() => {
                setAuthRole("creator");
                setShowAuthModal(true);
              }}
              className="w-full text-left p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--text)] transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-[var(--text)]">Become a Creator</div>
              <div className="text-[10px] text-[var(--text-secondary-aa)]">Showcase LoRAs &amp; get hired</div>
            </button>
          )}
          <div className="text-[11px] text-[var(--text-secondary-aa)] px-1 leading-relaxed">
            AI Content Creator Marketplace
          </div>
        </div>
      </aside>

      {/* Tablet Rail */}
      <aside className="hidden md:flex lg:hidden fixed inset-y-0 left-0 w-[72px] bg-[var(--surface)] border-r border-[var(--border)] flex-col items-center justify-between py-4 z-40 transition-colors">
        <div className="flex flex-col items-center gap-6">
          <Link href="/" className="select-none p-1" aria-label="Retake Home">
            <span
              className="text-xl font-black"
              style={{
                background: "var(--gradient-primary)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              r.
            </span>
          </Link>

          <Link
            href={user ? "/briefs/new" : "#"}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                setAuthRole("brand");
                setShowAuthModal(true);
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xs cursor-pointer"
            style={{ background: "var(--gradient-text-safe)" }}
            aria-label="Post a brief"
          >
            <PlusIcon size={18} />
          </Link>

          <nav className="flex flex-col gap-2 items-center" aria-label="Tablet Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={item.active ? "page" : undefined}
                  className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${
                    item.active
                      ? "text-[var(--text)] bg-[var(--bg)] font-bold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
                  }`}
                >
                  <Icon size={20} fill={item.active ? "currentColor" : "none"} />
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 w-full bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 py-2.5 flex items-center justify-between transition-colors">
        <Link href="/" className="flex items-center gap-1.5" aria-label="Retake Home">
          <span
            className="text-xl font-black tracking-tight"
            style={{
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            retake
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {isBrand && (
            <Link
              href="/discover"
              className="p-2 text-[var(--text)] hover:text-[var(--link-aa)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Search and browse creators"
            >
              <SearchIcon size={20} />
            </Link>
          )}

          <Link
            href="/messages"
            className="p-2 text-[var(--text)] hover:text-[var(--link-aa)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Direct messages"
          >
            <MessageIcon size={20} />
          </Link>

          {/* User account / logout controls on mobile header */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="w-8 h-8 rounded-full bg-[var(--gradient-text-safe)] text-white font-bold text-xs flex items-center justify-center shadow-xs"
                aria-label="Profile"
              >
                {user.name.charAt(0)}
              </Link>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  logout();
                }}
                className="text-[11px] font-semibold text-[var(--text-secondary-aa)] hover:text-[var(--danger-aa)] px-2 py-1 rounded border border-[var(--border)] transition-colors cursor-pointer"
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="px-3 py-1.5 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 min-h-[36px]"
              aria-label="Sign in"
            >
              <UserIcon size={14} />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Tab Navigation */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] px-2 py-1.5 flex items-center justify-around h-16 select-none"
        aria-label="Mobile Navigation"
      >
        {/* Tab 1: Home */}
        <Link
          href="/"
          aria-label="Home"
          aria-current={pathname === "/" ? "page" : undefined}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] ${
            pathname === "/" ? "text-[var(--text)] font-bold" : "text-[var(--text-secondary-aa)]"
          }`}
        >
          <HomeIcon size={22} fill={pathname === "/" ? "currentColor" : "none"} />
          <span className="text-[10px] mt-0.5">Home</span>
        </Link>

        {/* Tab 2: Browse (Only for Brands) or Briefs */}
        {isBrand ? (
          <Link
            href="/discover"
            aria-label="Find Creators"
            aria-current={pathname.startsWith("/discover") ? "page" : undefined}
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] ${
              pathname.startsWith("/discover") ? "text-[var(--text)] font-bold" : "text-[var(--text-secondary-aa)]"
            }`}
          >
            <SearchIcon size={22} />
            <span className="text-[10px] mt-0.5">Find Creators</span>
          </Link>
        ) : (
          <Link
            href="/briefs"
            aria-label="Briefs"
            aria-current={pathname.startsWith("/briefs") ? "page" : undefined}
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] ${
              pathname.startsWith("/briefs") ? "text-[var(--text)] font-bold" : "text-[var(--text-secondary-aa)]"
            }`}
          >
            <OrdersIcon size={22} fill={pathname.startsWith("/briefs") ? "currentColor" : "none"} />
            <span className="text-[10px] mt-0.5">Briefs</span>
          </Link>
        )}

        {/* Tab 3: Post a brief (Center Compose Button with Gradient) */}
        <Link
          href={user ? "/briefs/new" : "#"}
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              setAuthRole("brand");
              setShowAuthModal(true);
            }
          }}
          aria-label="Post a brief"
          className="flex items-center justify-center w-12 h-12 rounded-full text-white shadow-md active:scale-95 transition-transform cursor-pointer"
          style={{ background: "var(--gradient-text-safe)" }}
        >
          <PlusIcon size={22} className="text-white" />
        </Link>

        {/* Tab 4: Briefs (public) or Projects (logged in) */}
        <Link
          href={user ? "/tracker" : "/briefs"}
          aria-label={user ? "Projects" : "Briefs"}
          aria-current={(user && pathname === "/tracker") || (!user && pathname.startsWith("/briefs")) ? "page" : undefined}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] ${
            (user && pathname === "/tracker") || (!user && pathname.startsWith("/briefs")) ? "text-[var(--text)] font-bold" : "text-[var(--text-secondary-aa)]"
          }`}
        >
          <OrdersIcon size={22} fill={(user && pathname === "/tracker") || (!user && pathname.startsWith("/briefs")) ? "currentColor" : "none"} />
          <span className="text-[10px] mt-0.5">{user ? "Projects" : "Briefs"}</span>
        </Link>

        {/* Tab 5: Profile / Sign in */}
        <Link
          href="/dashboard"
          aria-label={user ? "Profile" : "Sign In"}
          aria-current={pathname === "/dashboard" ? "page" : undefined}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] ${
            pathname === "/dashboard" ? "text-[var(--text)] font-bold" : "text-[var(--text-secondary-aa)]"
          }`}
        >
          <UserIcon size={22} fill={pathname === "/dashboard" ? "currentColor" : "none"} />
          <span className="text-[10px] mt-0.5">{user ? "Profile" : "Sign In"}</span>
        </Link>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        defaultRole={authRole}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
