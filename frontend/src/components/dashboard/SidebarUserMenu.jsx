"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronUp,
  Globe,
  HelpCircle,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

import UserAvatar from "@/components/shared/Avatar/UserAvatar";

const MENU_ITEMS = [
  { name: "My Profile", href: "/dashboard/profile", icon: UserRound },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
  { name: "Visit website", href: "/", icon: Globe },
];

export default function SidebarUserMenu({ user, roleName, onLogout }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);

  const displayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";

  // Close when the person goes to another page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    const handleClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // "/" would match every page, so the website link is never "active".
  const isActive = (href) => href !== "/" && pathname.startsWith(href);

  return (
    <div className="border-t border-line p-3">
      <div ref={wrapperRef} className="relative">
        {open && (
          <div
            role="menu"
            aria-label="Account menu"
            className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line"
          >
            <div className="flex items-center gap-3 border-b border-line bg-surface-muted px-4 py-3.5">
              <UserAvatar user={user} className="h-11 w-11 text-sm" />

              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold text-ink">
                  {displayName}
                </p>

                {user?.email && (
                  <p className="truncate text-xs text-body">{user.email}</p>
                )}

                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  {roleName}
                </p>
              </div>
            </div>

            <div className="p-1.5">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      active
                        ? "bg-primary text-white"
                        : "text-body hover:bg-surface-muted hover:text-ink"
                    }`}
                  >
                    <Icon
                      size={17}
                      className={active ? "text-accent" : "text-primary/70"}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-line p-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              >
                <LogOut size={17} aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        )}

        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            open ? "bg-surface-muted" : "hover:bg-surface-muted"
          }`}
        >
          <UserAvatar user={user} className="h-10 w-10 text-xs" />

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold text-ink">
              {displayName}
            </p>

            <p className="truncate text-xs font-medium text-body">
              {roleName}
            </p>
          </div>

          <ChevronUp
            size={16}
            aria-hidden="true"
            className={`shrink-0 text-body transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}