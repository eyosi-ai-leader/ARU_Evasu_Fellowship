"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  CalendarDays,
  Sparkles,
  BarChart3,
  ChevronDown,
  ChevronRight,
  UserRound,
  ClipboardList,
  Megaphone,
  ShieldCheck,
  Crown,
  Eye,
  BriefcaseBusiness,
  KeyRound,
  GraduationCap,
  Home,
  X,
} from "lucide-react";

import { ROLES } from "@/lib/roles";
import { endSession } from "@/lib/accountApi";
import { getStoredUser } from "@/lib/userStorage";
import { useAccess } from "@/components/dashboard/access/AccessProvider";
import CampusBadge from "@/components/dashboard/access/CampusBadge";
import SidebarUserMenu from "@/components/dashboard/SidebarUserMenu";
import BrandLogo from "@/components/shared/BrandLogo/BrandLogo";
import { BRAND } from "@/data/brand";

const INTELLIGENCE = {
  label: "Intelligence",
  items: [
    {
      name: "Fellowship AI",
      href: "/dashboard/ai",
      icon: Sparkles,
      badge: "AI",
    },
    { name: "Insights", href: "/dashboard/insights", icon: BarChart3 },
  ],
};

/*
 * The menu is built from what the person may DO (capabilities from
 * GET /api/me), not from one role number. A member who also leads a
 * ministry gets both menus.
 *
 * Set comingSoon to false when a page is ready.
 */
function buildNavigation(access) {
  const can = (capability) => access.capabilities.includes(capability);

  const manages = can("fellowship:manage");
  const managesGeneral = can("general:manage");

  const sections = [];

  if (manages || managesGeneral) {
    const items = [];

    if (manages) {
      items.push(
        { name: "Members", href: "/dashboard/members", icon: Users },
        {
          name: "Graduates",
          href: "/dashboard/graduates",
          icon: GraduationCap,
          comingSoon: true,
        },
        {
          name: "Small Groups",
          href: "/dashboard/small-groups",
          icon: Home,
        }
      );
    }

    items.push(
      {
        name: "Ministries",
        href: "/dashboard/ministries",
        icon: HeartHandshake,
      },
      { name: "Events", href: "/dashboard/events", icon: CalendarDays },
      {
        name: "Announcements",
        href: "/dashboard/announcements",
        icon: Megaphone,
      }
    );

    if (manages) {
      items.push({
        name: "Member Access",
        href: "/dashboard/account-access",
        icon: KeyRound,
      });
    }

    sections.push({
      label: access.isSuperAdmin ? "Management" : "Fellowship Management",
      items,
    });

    sections.push(INTELLIGENCE);

    return sections;
  }

  if (can("smallgroup:lead")) {
    sections.push({
      label: "My Small Group",
      items: [
        {
          name: "Families & Members",
          href: "/dashboard/small-groups",
          icon: Home,
        },
      ],
    });
  }

   if (can("ministry:lead")) {
    sections.push({
      label: "My Ministry",
      items: [
        {
          name: "My Ministry",
          href: "/dashboard/ministries",
          icon: HeartHandshake,
        },
        {
          name: "Ministry Members",
          href: "/dashboard/members",
          icon: Users,
        },
      ],
    });
  }

  sections.push({
    label: "My Fellowship",
    items: [
      { name: "Events", href: "/dashboard/events", icon: CalendarDays },
      {
        name: "My Attendance",
        href: "/dashboard/attendance",
        icon: ClipboardList,
        comingSoon: true,
      },
      {
        name: "Announcements",
        href: "/dashboard/announcements",
        icon: Megaphone,
      },
    ],
  });

  return sections;
}

const roleConfig = {
  [ROLES.ADMIN]: { icon: Crown },
  [ROLES.FELLOWSHIP_ADMIN]: { icon: ShieldCheck },
  [ROLES.STAFF]: { icon: BriefcaseBusiness },
  [ROLES.PASTOR]: { icon: ShieldCheck },
  [ROLES.SMALL_GROUP_LEADER]: { icon: Eye },
  [ROLES.MINISTRY_LEADER]: { icon: BriefcaseBusiness },
  [ROLES.MEMBER]: { icon: UserRound },
};

function NavigationSkeleton() {
  return (
    <div className="space-y-3 px-1" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="h-10 animate-pulse rounded-2xl bg-surface-muted"
        />
      ))}
    </div>
  );
}

/*
 * open / onClose are used on phones and tablets only: the sidebar slides
 * in over the page. On large screens it is always visible.
 */
export default function DashboardSidebar({ open = false, onClose }) {
  const pathname = usePathname();
  const { access, loading } = useAccess();

  const [user, setUser] = useState(null);

  // Only sections the person has collapsed are stored here.
  // Every section starts open.
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    const load = () => setUser(getStoredUser());

    load();
    window.addEventListener("chms:user-updated", load);

    return () => window.removeEventListener("chms:user-updated", load);
  }, []);

  const roleLabel = access?.roleLabel || "Member";
  const heldRoles = access?.roles?.length ? access.roles.join(" · ") : roleLabel;

  const navigation = access ? buildNavigation(access) : [];

  const RoleIcon = (roleConfig[Number(access?.roleId)] || roleConfig[ROLES.MEMBER]).icon;

  const overviewActive = pathname === "/dashboard";

  const isActive = (href) => pathname.startsWith(href);

  const toggleSection = (label) => {
    setCollapsed((previous) => ({
      ...previous,
      [label]: !previous[label],
    }));
  };

  return (
    <aside
      id="dashboard-sidebar"
      aria-label="Sidebar"
      className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-line bg-white shadow-soft transition-transform duration-200 ease-out lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Logo (and the close button on phones) */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <BrandLogo size={38} priority />

          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold tracking-tight text-ink">
              {BRAND.shortName}
            </p>

            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              <span
                aria-hidden="true"
                className="h-0.5 w-3 rounded-full bg-accent"
              />
              Management Portal
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-10 w-10 items-center justify-center rounded-full text-body transition hover:bg-surface-muted hover:text-ink lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Overview: the role card is the link to the overview dashboard */}
      <div className="shrink-0 px-4 pt-4">
        <Link
          href="/dashboard"
          aria-label="Overview dashboard"
           title="Overview dashboard"
          aria-current={overviewActive ? "page" : undefined}
          className={`group flex items-center gap-3 rounded-3xl border px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            overviewActive
              ? "border-transparent bg-gradient-to-br from-primary to-primary-dark shadow-soft"
              : "border-line bg-surface-muted hover:-translate-y-px hover:border-primary/30 hover:bg-white hover:shadow-card"
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
              overviewActive
                ? "bg-white/15 text-accent"
                : "bg-primary text-white"
            }`}
          >
            <RoleIcon size={17} strokeWidth={2} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-[11px] font-bold uppercase tracking-[0.1em] ${
                overviewActive ? "text-white" : "text-ink"
              }`}
            >
              {roleLabel}
            </p>

                        <div className="mt-0.5 min-w-0">
              <CampusBadge
                variant="inline"
                onDark={overviewActive}
                fallback={
                  <span
                    className={`flex items-center gap-1.5 text-xs font-medium ${
                      overviewActive ? "text-white/75" : "text-slate-400"
                    }`}
                  >
                    <LayoutDashboard size={12} aria-hidden="true" />
                    Overview
                  </span>
                }
              />
            </div>
          </div>

          <ChevronRight
            size={16}
            aria-hidden="true"
            className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${
              overviewActive ? "text-white/75" : "text-body"
            }`}
          />
        </Link>
      </div>

      {/* Navigation (takes all the remaining space and scrolls if needed) */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-width:thin]">
        <nav aria-label="Dashboard">
          {loading && <NavigationSkeleton />}

          {!loading &&
            navigation.map((section, index) => {
              const sectionOpen = !collapsed[section.label];
              const panelId = `section-${section.label
                .toLowerCase()
                .replace(/\s+/g, "-")}`;

              return (
                <div
                  key={section.label}
                  className={
                    index > 0 ? "mt-3 border-t border-line pt-3" : ""
                  }
                >
                  {/* Section header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.label)}
                    aria-expanded={sectionOpen}
                    aria-controls={panelId}
                    className="group mb-1 flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-body group-hover:text-ink">
                        {section.label}
                      </span>

                      <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-body ring-1 ring-line">
                        {section.items.length}
                      </span>
                    </span>

                    <ChevronDown
                      size={15}
                      strokeWidth={2}
                      aria-hidden="true"
                      className={`text-body transition-transform duration-200 ${
                        sectionOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  </button>

                  {/* Section items */}
                  <div
                    id={panelId}
                    className={`grid transition-all duration-200 ${
                      sectionOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-1 pb-1">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item.href);

                          if (item.comingSoon) {
                            return (
                              <div
                                key={item.name}
                                aria-disabled="true"
                                className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-3 text-[14px] font-medium text-body/40 lg:py-2.5"
                              >
                                <Icon
                                  size={18}
                                  strokeWidth={1.8}
                                  aria-hidden="true"
                                  className="shrink-0 text-body/40"
                                />

                                <span className="truncate">{item.name}</span>

                                <span className="ml-auto shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-body">
                                  Soon
                                </span>
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              aria-current={active ? "page" : undefined}
                              tabIndex={sectionOpen ? 0 : -1}
                              className={`group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-[14px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:py-2.5 ${
                                active
                                  ? "bg-primary text-white shadow-soft"
                                  : "text-body hover:bg-surface-muted hover:text-ink active:bg-surface-muted"
                              }`}
                            >
                              {active && (
                                <span
                                  aria-hidden="true"
                                  className="absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent"
                                />
                              )}

                              <Icon
                                size={19}
                                strokeWidth={active ? 2.2 : 1.8}
                                aria-hidden="true"
                                className={`shrink-0 transition-colors ${
                                  active
                                    ? "text-accent"
                                    : "text-body group-hover:text-primary"
                                }`}
                              />

                              <span className="truncate">{item.name}</span>

                              {item.badge && (
                                <span
                                  className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                    active
                                      ? "bg-white/20 text-white"
                                      : "bg-primary/10 text-primary"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </nav>
      </div>

      {/* Account menu: My Profile, Settings, Help & Support, Sign out */}
      <div className="shrink-0 pb-[env(safe-area-inset-bottom)]">
        <SidebarUserMenu
          user={user}
          roleName={heldRoles}
          onLogout={() => endSession()}
        />
      </div>
    </aside>
  );
}