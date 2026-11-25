"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Search,
  Plus,
  ChevronDown,
  Menu,
  X,
  Users,
  HeartHandshake,
  CalendarDays,
  Sparkles,
  BarChart3,
  Settings,
  HelpCircle,
  UserRound,
  House,
  ClipboardList,
  Megaphone,
  Activity,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

import { ROLES } from "@/lib/roles";
import { getFellowshipRoleName } from "@/lib/fellowshipRoles";
import { getStoredUser } from "@/lib/userStorage";
import { BRAND } from "../../data/brand";
import UserAvatar from "@/components/shared/Avatar/UserAvatar";
import NotificationBell from "@/components/dashboard/notifications/NotificationBell";

const navigationByRole = {
  [ROLES.ADMIN]: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Members", href: "/dashboard/members", icon: Users },
    { name: "Ministries", href: "/dashboard/ministries", icon: HeartHandshake },
    { name: "Events", href: "/dashboard/events", icon: CalendarDays },
    { name: "Fellowship AI", href: "/dashboard/ai", icon: Sparkles },
    { name: "Insights", href: "/dashboard/insights", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
  ],

  [ROLES.PASTOR]: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Members", href: "/dashboard/members", icon: Users },
    { name: "Ministries", href: "/dashboard/ministries", icon: HeartHandshake },
    { name: "Events", href: "/dashboard/events", icon: CalendarDays },
    { name: "Fellowship AI", href: "/dashboard/ai", icon: Sparkles },
    { name: "Insights", href: "/dashboard/insights", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
  ],

  [ROLES.CHURCH_ELDER]: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Members", href: "/dashboard/members", icon: Users },
    { name: "Ministries", href: "/dashboard/ministries", icon: HeartHandshake },
    { name: "Events", href: "/dashboard/events", icon: CalendarDays },
    { name: "Insights", href: "/dashboard/insights", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
  ],

  [ROLES.MINISTRY_LEADER]: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Ministry Overview",
      href: "/dashboard/ministries",
      icon: HeartHandshake,
    },
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
      name: "Activities",
      href: "/dashboard/activities",
      icon: Activity,
    },
    {
      name: "Announcements",
      href: "/dashboard/announcements",
      icon: Megaphone,
    },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
  ],

  [ROLES.MEMBER]: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Profile", href: "/dashboard/profile", icon: UserRound },
    {
      name: "My Ministry",
      href: "/dashboard/my-ministry",
      icon: HeartHandshake,
    },
    {
      name: "My Events",
      href: "/dashboard/my-events",
      icon: CalendarDays,
    },
    {
      name: "My Attendance",
      href: "/dashboard/attendance",
      icon: ClipboardList,
    },
    {
      name: "Announcements",
      href: "/dashboard/announcements",
      icon: Megaphone,
    },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
  ],
};

const quickActionsByRole = {
  [ROLES.ADMIN]: [
    {
      name: "Add Member",
      href: "/dashboard/members/create",
      icon: Users,
    },
    {
      name: "Manage Ministries",
      href: "/dashboard/ministries",
      icon: HeartHandshake,
    },
    {
      name: "Manage Events",
      href: "/dashboard/events",
      icon: CalendarDays,
    },
    {
      name: "Announcements",
      href: "/dashboard/announcements?tab=compose",
      icon: Megaphone,
    },
  ],

  [ROLES.PASTOR]: [
    {
      name: "Add Member",
      href: "/dashboard/members/create",
      icon: Users,
    },
    {
      name: "Manage Ministries",
      href: "/dashboard/ministries",
      icon: HeartHandshake,
    },
    {
      name: "Manage Events",
      href: "/dashboard/events",
      icon: CalendarDays,
    },
    {
      name: "Announcements",
      href: "/dashboard/announcements?tab=compose",
      icon: Megaphone,
    },
  ],

  [ROLES.CHURCH_ELDER]: [
    {
      name: "View Members",
      href: "/dashboard/members",
      icon: Users,
    },
    {
      name: "View Ministries",
      href: "/dashboard/ministries",
      icon: HeartHandshake,
    },
    {
      name: "Announcements",
      href: "/dashboard/announcements",
      icon: Megaphone,
    },
    {
      name: "View Insights",
      href: "/dashboard/insights",
      icon: BarChart3,
    },
  ],

  [ROLES.MINISTRY_LEADER]: [
    {
      name: "My Ministry",
      href: "/dashboard/ministries",
      icon: HeartHandshake,
    },
    {
      name: "Ministry Events",
      href: "/dashboard/events",
      icon: CalendarDays,
    },
    {
      name: "Send Announcement",
      href: "/dashboard/announcements?tab=compose",
      icon: Megaphone,
    },
  ],

  [ROLES.MEMBER]: [
    {
      name: "My Profile",
      href: "/dashboard/profile",
      icon: UserRound,
    },
    {
      name: "My Events",
      href: "/dashboard/events",
      icon: CalendarDays,
    },
    {
      name: "Announcements",
      href: "/dashboard/announcements",
      icon: Megaphone,
    },
    {
      name: "My Ministry",
      href: "/dashboard/my-ministry",
      icon: HeartHandshake,
    },
    {
      name: "My Family",
      href: "/dashboard/my-family",
      icon: House,
    },
  ],
};

/*
 * Fellowship Admin and Staff manage members like a Main Leader, so they
 * get the same search list and quick actions.
 */
navigationByRole[ROLES.FELLOWSHIP_ADMIN] = navigationByRole[ROLES.PASTOR];
navigationByRole[ROLES.STAFF] = navigationByRole[ROLES.PASTOR];
quickActionsByRole[ROLES.FELLOWSHIP_ADMIN] = quickActionsByRole[ROLES.PASTOR];
quickActionsByRole[ROLES.STAFF] = quickActionsByRole[ROLES.PASTOR];

const menuItemClass =
  "flex items-center gap-2.5 rounded-2xl px-3 py-3 text-sm font-medium text-body transition hover:bg-primary/5 hover:text-primary sm:py-2.5";

const menuLabelClass =
  "text-[10px] font-bold uppercase tracking-[0.14em] text-body";

/*
 * onMenuClick opens the sidebar on phones and tablets.
 */
export default function DashboardHeader({ onMenuClick }) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);

  const headerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const load = () => setUser(getStoredUser());

    load();
    window.addEventListener("chms:user-updated", load);

    return () => window.removeEventListener("chms:user-updated", load);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setActiveMenu(null);
      }
    };

    const handleKeys = (event) => {
      if (event.key === "Escape") {
        setActiveMenu(null);
        setSearch("");
      }

      // Ctrl+K (or Cmd+K) jumps to the search box.
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeys);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeys);
    };
  }, []);

  const roleId = Number(user?.roleId);
  const roleName = getFellowshipRoleName(roleId);

  const navigation =
    navigationByRole[roleId] || navigationByRole[ROLES.MEMBER];

  const quickActions =
    quickActionsByRole[roleId] || quickActionsByRole[ROLES.MEMBER];

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return navigation.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }, [search, navigation]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setActiveMenu("search");
  };

  const handleSearchFocus = () => {
    if (search.trim()) {
      setActiveMenu("search");
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter" && searchResults.length > 0) {
      router.push(searchResults[0].href);
      setSearch("");
      setActiveMenu(null);
    }
  };

  const handleQuickActionToggle = () => {
    setActiveMenu((current) =>
      current === "quickAction" ? null : "quickAction"
    );
  };

  const handleProfileToggle = () => {
    setActiveMenu((current) =>
      current === "profile" ? null : "profile"
    );
  };

  const handleMobileSearchToggle = () => {
    setSearch("");
    setActiveMenu((current) =>
      current === "mobileSearch" ? null : "mobileSearch"
    );
  };

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-line bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8"
    >
      {/* Left: menu button (phones), name (phones), search (computers) */}
      <div className="relative flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          aria-controls="dashboard-sidebar"
          className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-body transition hover:bg-surface-muted hover:text-ink active:bg-surface-muted lg:hidden"
        >
          <Menu size={21} />
        </button>

        <Link
          href="/dashboard"
          className="truncate font-display text-base font-semibold tracking-tight text-ink md:hidden"
        >
          {BRAND.shortName}
        </Link>

        <div className="relative hidden w-80 md:block lg:w-96">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-body/60"
          />

          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onKeyDown={handleSearchKeyDown}
            placeholder={`Search ${roleName.toLowerCase()} dashboard...`}
            className="h-10 w-full rounded-full border border-line bg-surface-muted pl-11 pr-16 text-sm text-ink outline-none transition placeholder:text-body/60 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />

          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-line bg-white px-1.5 py-0.5 font-sans text-[10px] font-medium text-body">
            Ctrl K
          </kbd>
        </div>

        {activeMenu === "search" && search.trim() && (
          <div className="absolute left-0 top-12 hidden w-80 overflow-hidden rounded-3xl bg-white p-2 shadow-soft ring-1 ring-line md:block lg:w-96">
            {searchResults.length > 0 ? (
              <>
                <div className="px-3 py-2">
                  <p className={menuLabelClass}>Dashboard Navigation</p>
                </div>

                {searchResults.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setSearch("");
                        setActiveMenu(null);
                      }}
                      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-body transition hover:bg-primary/5 hover:text-primary"
                    >
                      <Icon size={17} className="text-primary/70" />

                      <span>{item.name}</span>

                      <span className="ml-auto text-[10px] text-body/50">
                        Enter
                      </span>
                    </Link>
                  );
                })}
              </>
            ) : (
              <div className="px-3 py-5 text-center">
                <Search size={20} className="mx-auto text-body/40" />

                <p className="mt-2 text-sm font-medium text-ink">
                  No results found
                </p>

                <p className="mt-1 text-xs text-body">
                  Try another dashboard section.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Search button (phones only) */}
        <button
          type="button"
          onClick={handleMobileSearchToggle}
          aria-label="Search"
          aria-expanded={activeMenu === "mobileSearch"}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition md:hidden ${
            activeMenu === "mobileSearch"
              ? "bg-primary/10 text-primary"
              : "text-body hover:bg-surface-muted active:bg-surface-muted"
          }`}
        >
          {activeMenu === "mobileSearch" ? (
            <X size={19} />
          ) : (
            <Search size={19} />
          )}
        </button>

        {/* Role */}
        <div className="hidden items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 lg:flex">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-accent"
          />
          <span className="text-xs font-semibold text-primary">
            {roleName}
          </span>
        </div>

        {/* Quick Action (icon only on phones) */}
        <div className="relative">
          <button
            type="button"
            onClick={handleQuickActionToggle}
            aria-label="Quick action"
            aria-expanded={activeMenu === "quickAction"}
            className={`flex h-10 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold text-white shadow-sm transition active:scale-[0.97] sm:px-4 ${
              activeMenu === "quickAction"
                ? "bg-primary-dark"
                : "bg-primary hover:bg-primary-dark"
            }`}
          >
            <Plus size={16} />

            <span className="hidden sm:inline">Quick Action</span>

            <ChevronDown
              size={13}
              className={`hidden transition-transform sm:block ${
                activeMenu === "quickAction" ? "rotate-180" : ""
              }`}
            />
          </button>

          {activeMenu === "quickAction" && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-3xl bg-white p-2 shadow-soft ring-1 ring-line">
              <div className="px-3 py-2">
                <p className={menuLabelClass}>{roleName} Actions</p>
              </div>

              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.name}
                    href={action.href}
                    onClick={() => setActiveMenu(null)}
                    className={menuItemClass}
                  >
                    <Icon size={16} className="text-primary/70" />

                    <span>{action.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* Account */}
        <div className="relative">
          <button
            type="button"
            onClick={handleProfileToggle}
            aria-label="Account menu"
            aria-expanded={activeMenu === "profile"}
            className="flex items-center rounded-full transition hover:ring-2 hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <UserAvatar user={user} className="h-9 w-9 text-xs" />
          </button>

          {activeMenu === "profile" && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-3xl bg-white p-2 shadow-soft ring-1 ring-line">
              <div className="border-b border-line px-3 py-2.5">
                <p className="truncate font-display text-sm font-semibold text-ink">
                  {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                    "User"}
                </p>
                <p className="truncate text-xs text-body">
                  {user?.email || roleName}
                </p>
              </div>

              <div className="pt-1.5">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setActiveMenu(null)}
                  className={menuItemClass}
                >
                  <UserRound size={16} className="text-primary/70" />
                  My Profile
                </Link>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setActiveMenu(null)}
                  className={menuItemClass}
                >
                  <Settings size={16} className="text-primary/70" />
                  Settings
                </Link>

                <Link
                  href="/dashboard/help"
                  onClick={() => setActiveMenu(null)}
                  className={menuItemClass}
                >
                  <HelpCircle size={16} className="text-primary/70" />
                  Help & Support
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-3 text-sm font-medium text-danger transition hover:bg-danger/10 sm:py-2.5"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search panel (phones only) */}
      {activeMenu === "mobileSearch" && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-white p-3 shadow-soft md:hidden">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-body/60"
            />

            <input
              autoFocus
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={`Search ${roleName.toLowerCase()} dashboard...`}
              className="h-12 w-full rounded-full border border-line bg-surface-muted pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-body/60 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>

          {search.trim() && (
            <div className="mt-2 max-h-64 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setSearch("");
                        setActiveMenu(null);
                      }}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-body transition active:bg-primary/5 active:text-primary"
                    >
                      <Icon size={17} className="text-primary/70" />

                      <span>{item.name}</span>
                    </Link>
                  );
                })
              ) : (
                <p className="px-3 py-4 text-center text-sm text-body">
                  No results found
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

