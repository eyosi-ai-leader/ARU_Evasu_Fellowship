"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import {
  CalendarDays,
  Heart,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Users,
  X,
} from "lucide-react";


import Button from "@/components/shared/Button";
import BrandLogo from "@/components/shared/BrandLogo/BrandLogo";
import { BRAND } from "@/data/brand";
import navigation from "@/data/navigation";
import useAuthUser from "@/hooks/useAuthUser";
import GiveModal from "./give-modal";

// The first 4 menu items become phone tabs; the rest go in "More".
const TAB_COUNT = 4;

const ICONS = {
  "/": Home,
  "/about": Info,
  "/fellowships": Users,
  "/events": CalendarDays,
  "/contact": Mail,
};

const SHORT_LABELS = { "/events": "Events" };

const isActive = (pathname, href) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

function DesktopLinks({ pathname }) {
  const [hovered, setHovered] = useState(null);

  const current =
    navigation.find((item) => isActive(pathname, item.href))?.href ?? null;
  const highlighted = hovered ?? current;

  return (
    <nav
      aria-label="Main"
      className="hidden items-center gap-1 lg:flex"
      onMouseLeave={() => setHovered(null)}
    >
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={current === item.href ? "page" : undefined}
          onMouseEnter={() => setHovered(item.href)}
          onFocus={() => setHovered(item.href)}
          onBlur={() => setHovered(null)}
          className={clsx(
            "relative isolate rounded-full px-4 py-2 text-sm font-medium transition-colors",
            highlighted === item.href ? "text-ink" : "text-body",
            current === item.href && "font-semibold"
          )}
        >
          {highlighted === item.href && (
            <motion.span
              layoutId="nav-pill"
              className="absolute inset-0 -z-10 rounded-full bg-ink/5"
              transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
            />
          )}

          {item.label}

          {current === item.href && (
            <span
              aria-hidden="true"
              className="absolute inset-x-5 -bottom-0.5 h-0.5 rounded-full bg-accent"
            />
          )}
        </Link>
      ))}
    </nav>
  );
}

function BottomTabs({ pathname, moreOpen, onMore }) {
  const tabs = navigation.slice(0, TAB_COUNT);

  return (
    <nav
      aria-label="Mobile"
      className="mobile-tabbar fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between rounded-3xl bg-white/90 p-1.5 shadow-soft ring-1 ring-line backdrop-blur-xl">
        {tabs.map((item) => {
          const Icon = ICONS[item.href] ?? Home;
          const active = !moreOpen && isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative isolate flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-body"
              )}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 -z-10 rounded-2xl bg-primary/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className="h-5 w-5" aria-hidden="true" />
              {SHORT_LABELS[item.href] ?? item.label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onMore}
          aria-expanded={moreOpen}
          className={clsx(
            "relative isolate flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors",
            moreOpen ? "text-primary" : "text-body"
          )}
        >
          {moreOpen && (
            <span className="absolute inset-0 -z-10 rounded-2xl bg-primary/10" />
          )}
          <Menu className="h-5 w-5" aria-hidden="true" />
          More
        </button>
      </div>
    </nav>
  );
}

function MoreSheet({ open, onClose, onGive, user, logout }) {
  const moreLinks = navigation.slice(TAB_COUNT);

  const rowClass =
    "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-base font-medium text-ink transition hover:bg-surface-muted";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-[55] bg-ink/40 backdrop-blur-sm lg:hidden"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="More"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-[60] rounded-t-[28px] bg-white px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-soft lg:hidden"
          >
            <div
              aria-hidden="true"
              className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line"
            />

            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandLogo size={36} />
                <span className="leading-tight">
                  <span className="block text-sm font-semibold text-ink">
                    {BRAND.university}
                  </span>
                  <span className="block text-xs text-body">
                    {BRAND.shortName}
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-ink transition hover:bg-ink/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {moreLinks.map((item) => {
                const Icon = ICONS[item.href] ?? Info;

                return (
                  <Link key={item.href} href={item.href} className={rowClass}>
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}

              <button type="button" onClick={onGive} className={rowClass}>
                <Heart className="h-5 w-5 text-primary" aria-hidden="true" />
                Give
              </button>

              {user ? (
                <>
                  <Link href="/dashboard" className={rowClass}>
                    <LayoutDashboard
                      className="h-5 w-5 text-primary"
                      aria-hidden="true"
                    />
                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={logout}
                    className={clsx(rowClass, "text-danger")}
                  >
                    <LogOut className="h-5 w-5" aria-hidden="true" />
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" className={rowClass}>
                  <LogIn className="h-5 w-5 text-primary" aria-hidden="true" />
                  Member login
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const pathname = usePathname() ?? "";
  const { user, logout } = useAuthUser();

  const [scrolled, setScrolled] = useState(false);
  const [giveOpen, setGiveOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const closeMore = useCallback(() => setMoreOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the "More" sheet when the page changes
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Lock page scroll and allow Escape while the sheet is open
  useEffect(() => {
    if (!moreOpen) return;

    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setMoreOpen(false);
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const openGive = () => {
    setMoreOpen(false);
    setGiveOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 lg:px-6">
        <div
          className={clsx(
            "mx-auto flex w-full max-w-7xl items-center justify-between gap-3 rounded-full py-2 pl-3 pr-2 ring-1 backdrop-blur-xl transition-all duration-300",
            scrolled
              ? "bg-white/85 shadow-soft ring-line"
              : "bg-white/60 shadow-card ring-line/60"
          )}
        >
          <Link
            href="/"
            aria-label={`${BRAND.name} home`}
            className="flex min-w-0 items-center gap-3 rounded-full transition-opacity hover:opacity-85"
          >
            <BrandLogo size={38} priority />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-semibold tracking-tight text-ink">
                {BRAND.university}
              </span>
              <span className="block truncate text-xs font-medium text-body">
                {BRAND.shortName}
              </span>
            </span>
          </Link>

          <DesktopLinks pathname={pathname} />

          <div className="flex shrink-0 items-center gap-2">
                           {user && (
              <Button
                href="/dashboard"
                variant="secondary"
                size="sm"
                className="hidden lg:inline-flex"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Dashboard
              </Button>
            )}

            <Button variant="primary" size="sm" onClick={openGive}>
              <Heart className="h-4 w-4 text-accent" aria-hidden="true" />
              Give
            </Button>
          </div>
        </div>
      </header>

      <BottomTabs
        pathname={pathname}
        moreOpen={moreOpen}
        onMore={() => setMoreOpen((open) => !open)}
      />

      <MoreSheet
        open={moreOpen}
        onClose={closeMore}
        onGive={openGive}
        user={user}
        logout={logout}
      />

      <GiveModal open={giveOpen} onClose={() => setGiveOpen(false)} />
    </>
  );
}