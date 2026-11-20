"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { AccessProvider } from "@/components/dashboard/access/AccessProvider";

/*
 * The frame of every dashboard page.
 *
 * Computers (lg and wider): the sidebar is fixed on the left, like before.
 * Phones and tablets: the sidebar is hidden and slides in over the page
 * when the person taps the menu button in the header.
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
      <div className="min-h-screen bg-slate-50">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Dark layer behind the menu on phones */}
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          className={`fixed inset-0 z-[45] bg-slate-900/50 transition-opacity duration-200 lg:hidden ${
            sidebarOpen
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        />

        <div className="min-h-screen lg:ml-64">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="min-h-[calc(100vh-4rem)] min-w-0 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </AccessProvider>
  );
}