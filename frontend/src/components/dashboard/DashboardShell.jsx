"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { motion } from "framer-motion";
import { CalendarDays, LayoutDashboard, Megaphone, Menu } from "lucide-react";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { AccessProvider } from "@/components/dashboard/access/AccessProvider";

// Pages every role has in its menu.
const TABS = [
  { name: "Overview", label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Events", label: "Events", href: "/dashboard/events", icon: CalendarDays },
  {
    name: "Announcements",
    label: "Updates",
    href: "/dashboard/announcements",
    icon: Megaphone,
  },
];

const isTabActive = (pathname, href) =>
  href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

/* Floating tab bar for phones and tablets. Links only. */
function BottomBar({ pathname, sidebarOpen, onMenu }) {
  return (
    <nav
      aria-label="Dashboard shortcuts"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between rounded-3xl bg-white/90 p-1.5 shadow-soft ring-1 ring-line backdrop-blur-xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = !sidebarOpen && isTabActive(pathname, tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.name}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative isolate flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-body"
              )}
            >
              {active && (
                <motion.span
                  layoutId="dashboard-tab"
                  className="absolute inset-0 -z-10 rounded-2xl bg-primary/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className="h-5 w-5" aria-hidden="true" />
              {tab.label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onMenu}
          aria-expanded={sidebarOpen}
          aria-controls="dashboard-sidebar"
          className={clsx(
            "relative isolate flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors",
            sidebarOpen ? "text-primary" : "text-body"
          )}
        >
          {sidebarOpen && (
            <span className="absolute inset-0 -z-10 rounded-2xl bg-primary/10" />
          )}
          <Menu className="h-5 w-5" aria-hidden="true" />
          Menu
        </button>
      </div>
    </nav>
  );
}

/*
 * The frame of every dashboard page.
 *
 * Computers (lg and wider): the sidebar is fixed on the left, like before.
 * Phones and tablets: the sidebar is hidden and slides in over the page
 * when the person taps the menu button in the header or the tab bar.
 *
 * AccessProvider loads what the person may do (GET /api/me) once, for the
 * sidebar and every page inside.
 */
export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the menu after the person opens a page.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // While the menu is open: Escape closes it and the page behind it
  // does not scroll.
  useEffect(() => {
    if (!sidebarOpen) {
      return undefined;
    }

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [sidebarOpen]);

  // If the window becomes large (for example a tablet is turned), close it.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");

    const handleChange = (event) => {
      if (event.matches) {
        setSidebarOpen(false);
      }
    };

    query.addEventListener("change", handleChange);

    return () => query.removeEventListener("change", handleChange);
  }, []);

  return (
    <AccessProvider>
      <div className="min-h-screen bg-surface-muted">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Dark layer behind the menu on phones */}
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          className={`fixed inset-0 z-[45] bg-ink/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
            sidebarOpen
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        />

        <div className="min-h-screen lg:ml-64">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="min-h-[calc(100vh-4rem)] min-w-0 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8">
            {children}
          </main>
        </div>

        <BottomBar
          pathname={pathname}
          sidebarOpen={sidebarOpen}
          onMenu={() => setSidebarOpen(true)}
        />
      </div>
    </AccessProvider>
  );
}