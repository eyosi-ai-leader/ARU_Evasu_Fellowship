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
  Activity,
  ShieldCheck,
  Crown,
  Eye,
  BriefcaseBusiness,
  KeyRound,
  GraduationCap,
  X,
} from "lucide-react";

import { ROLES } from "@/lib/roles";
import { getFellowshipRoleName } from "@/lib/fellowshipRoles";
import { getStoredUser } from "@/lib/userStorage";
import SidebarUserMenu from "@/components/dashboard/SidebarUserMenu";
import BrandLogo from "@/components/shared/BrandLogo/BrandLogo";
import { BRAND } from "@/data/brand";

/*
 * The Dashboard / Overview page is opened from the role card at the
 * top of the sidebar, so it is not repeated as a section here.
 */
const navigationByRole = {
  [ROLES.ADMIN]: [
    {
      label: "Management",
      items: [
        { name: "Members", href: "/dashboard/members", icon: Users },
        {
          name: "Graduates",
          href: "/dashboard/graduates",
          icon: GraduationCap,
          comingSoon: true,
        },
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
        },
        {
          name: "Member Access",
          href: "/dashboard/account-access",
          icon: KeyRound,
        },
      ],
    },
    {
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
    },
  ],

  [ROLES.PASTOR]: [
    {
      label: "Fellowship Management",
      items: [
        { name: "Members", href: "/dashboard/members", icon: Users },
        {
          name: "Graduates",
          href: "/dashboard/graduates",
          icon: GraduationCap,
          comingSoon: true,
        },
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
        },
        {
          name: "Member Access",
          href: "/dashboard/account-access",
          icon: KeyRound,
        },
      ],
    },
    {
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
    },
  ],

  [ROLES.CHURCH_ELDER]: [
    {
      label: "Fellowship",
      items: [
        { name: "Members", href: "/dashboard/members", icon: Users },
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
        },
      ],
    },
    {
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
    },
  ],

  [ROLES.MINISTRY_LEADER]: [
    {
      label: "My Ministry",
      items: [
        {
          name: "Ministry Members",
          href: "/dashboard/members",
          icon: Users,
        },
        {
          name: "Ministry Events",
          href: "/dashboard/events",
          icon: CalendarDays,
        },
        {
          name: "Announcements",
          href: "/dashboard/announcements",
          icon: Megaphone,
        },
      ],
    },
    {
      label: "Activity",
      items: [
        {
          name: "Activities",
          href: "/dashboard/activities",
          icon: Activity,
          comingSoon: true,
        },
      ],
    },
    {
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
    },
  ],

  [ROLES.MEMBER]: [
    {
      label: "My Fellowship",
      items: [
        {
          name: "My Ministry",
          href: "/dashboard/my-ministry",
          icon: HeartHandshake,
          comingSoon: true,
        },
        { name: "Events", href: "/dashboard/events", icon: CalendarDays },
        {
          name: "My Attendance",
          href: "/dashboard/attendance",
          icon: ClipboardList,
          comingSoon: true,
        },
      ],
    },
    {
      label: "Communication",
      items: [
        {
          name: "Announcements",
          href: "/dashboard/announcements",
          icon: Megaphone,
        },
      ],
    },
  ],
};

/*
 * Fellowship Admin and Staff manage members like a Main Leader, so they
 * get the same menu. (Without this they would get the plain Member menu.)
 */
navigationByRole[ROLES.FELLOWSHIP_ADMIN] = navigationByRole[ROLES.PASTOR];
navigationByRole[ROLES.STAFF] = navigationByRole[ROLES.PASTOR];

const roleConfig = {
  [ROLES.ADMIN]: {
    title: "SUPER ADMIN",
    icon: Crown,
  },
  [ROLES.FELLOWSHIP_ADMIN]: {
    title: "FELLOWSHIP ADMIN",
    icon: ShieldCheck,
  },
  [ROLES.STAFF]: {
    title: "STAFF",
    icon: BriefcaseBusiness,
  },
  [ROLES.PASTOR]: {
    title: "MAIN LEADER",
    icon: ShieldCheck,
  },
  [ROLES.SMALL_GROUP_LEADER]: {
    title: "SMALL GROUP LEADER",
    icon: Eye,
  },
  [ROLES.MINISTRY_LEADER]: {
    title: "MINISTRY LEADER",
    icon: BriefcaseBusiness,
  },
  [ROLES.MEMBER]: {
    title: "MEMBER DASHBOARD",
    icon: UserRound,
  },
};

/*
 * open / onClose are used on phones and tablets only: the sidebar slides
 * in over the page. On large screens it is always visible.
 */
export default function DashboardSidebar({ open = false, onClose }) {
  const pathname = usePathname();

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

  const roleId = Number(user?.roleId);
  const roleName = getFellowshipRoleName(roleId);

  const navigation =
    navigationByRole[roleId] || navigationByRole[ROLES.MEMBER];

  const currentRole = roleConfig[roleId] || roleConfig[ROLES.MEMBER];

  const RoleIcon = currentRole.icon;

  const overviewActive = pathname === "/dashboard";

  const isActive = (href) => pathname.startsWith(href);

  const toggleSection = (label) => {
    setCollapsed((previous) => ({
      ...previous,
      [label]: !previous[label],
    }));
  };

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";

    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  return (
    <aside
      id="dashboard-sidebar"
      aria-label="Sidebar"
      className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Logo (and the close button on phones) */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <BrandLogo size={38} priority />

          <div className="leading-tight">
            <p className="text-[15px] font-bold tracking-tight text-slate-900">
              {BRAND.shortName}
            </p>

            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
              Management Portal
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Overview: the role card is the link to the overview dashboard */}
      <div className="shrink-0 px-4 pt-4">
        <Link
          href="/dashboard"
          aria-label="Overview dashboard"
          aria-current={overviewActive ? "page" : undefined}
          className={`group flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
            overviewActive
              ? "border-indigo-600 bg-indigo-600 shadow-md shadow-indigo-600/20"
              : "border-slate-200 bg-slate-50 hover:-translate-y-px hover:border-slate-300 hover:bg-slate-100 hover:shadow-sm"
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
              overviewActive
                ? "bg-white/20 text-white"
                : "bg-slate-950 text-white"
            }`}
          >
            <RoleIcon size={17} strokeWidth={2} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-[11px] font-bold tracking-[0.08em] ${
                overviewActive ? "text-white" : "text-slate-900"
              }`}
            >
              {currentRole.title}
            </p>

            <p
              className={`mt-0.5 flex items-center gap-1.5 text-xs font-medium ${
                overviewActive ? "text-white/75" : "text-slate-400"
              }`}
            >
              <LayoutDashboard size={12} aria-hidden="true" />
              Overview
            </p>
          </div>

          <ChevronRight
            size={16}
            aria-hidden="true"
            className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${
              overviewActive ? "text-white/75" : "text-slate-400"
            }`}
          />
        </Link>
      </div>

      {/* Navigation (takes all the remaining space and scrolls if needed) */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-width:thin]">
        <nav aria-label="Dashboard">
          {navigation.map((section, index) => {
            const sectionOpen = !collapsed[section.label];
            const panelId = `section-${section.label
              .toLowerCase()
              .replace(/\s+/g, "-")}`;

            return (
              <div
                key={section.label}
                className={
                  index > 0 ? "mt-3 border-t border-slate-100 pt-3" : ""
                }
              >
                {/* Section header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  aria-expanded={sectionOpen}
                  aria-controls={panelId}
                  className="group mb-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500 group-hover:text-slate-700">
                      {section.label}
                    </span>

                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                      {section.items.length}
                    </span>
                  </span>

                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    aria-hidden="true"
                    className={`text-slate-400 transition-transform duration-200 ${
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
                              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-slate-300 lg:py-2.5"
                            >
                              <Icon
                                size={18}
                                strokeWidth={1.8}
                                aria-hidden="true"
                                className="shrink-0 text-slate-300"
                              />

                              <span className="truncate">{item.name}</span>

                              <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
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
                            className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:py-2.5 ${
                              active
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-100"
                            }`}
                          >
                            {active && (
                              <span
                                aria-hidden="true"
                                className="absolute -left-4 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600"
                              />
                            )}

                            <Icon
                              size={19}
                              strokeWidth={active ? 2.2 : 1.8}
                              aria-hidden="true"
                              className={`shrink-0 transition-colors ${
                                active
                                  ? "text-white"
                                  : "text-slate-400 group-hover:text-slate-700"
                              }`}
                            />

                            <span className="truncate">{item.name}</span>

                            {item.badge && (
                              <span
                                className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  active
                                    ? "bg-white/20 text-white"
                                    : "bg-indigo-50 text-indigo-600"
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
          roleName={roleName}
          onLogout={handleLogout}
        />
      </div>
    </aside>
  );
}