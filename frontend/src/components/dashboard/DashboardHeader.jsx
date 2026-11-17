"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Search,
  Plus,
  ChevronDown,
  Users,
  HeartHandshake,
  CalendarDays,
  Sparkles,
  BarChart3,
  Settings,
  HelpCircle,
  UserRound,
  ClipboardList,
  Megaphone,
  Activity,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

import { ROLES } from "@/lib/roles";
import { getFellowshipRoleName } from "@/lib/fellowshipRoles";
import { getStoredUser } from "@/lib/userStorage";
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
      href: "/dashboard/my-events",
      icon: CalendarDays,
    },
  ],
};

export default function DashboardHeader() {
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

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur-xl"
    >
      {/* Search */}
      <div className="relative flex items-center">
        <div className="relative hidden w-80 md:block">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onKeyDown={handleSearchKeyDown}
            placeholder={`Search ${roleName.toLowerCase()} dashboard...`}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-16 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          />

          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400">
            Ctrl K
          </kbd>
        </div>

        {activeMenu === "search" && search.trim() && (
          <div className="absolute left-0 top-12 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            {searchResults.length > 0 ? (
              <>
                <div className="px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Dashboard Navigation
                  </p>
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
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Icon size={17} className="text-slate-400" />

                      <span>{item.name}</span>

                      <span className="ml-auto text-[10px] text-slate-300">
                        Enter
                      </span>
                    </Link>
                  );
                })}
              </>
            ) : (
              <div className="px-3 py-5 text-center">
                <Search size={20} className="mx-auto text-slate-300" />

                <p className="mt-2 text-sm font-medium text-slate-600">
                  No results found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Try another dashboard section.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Role */}
        <div className="hidden items-center rounded-full bg-indigo-50 px-3.5 py-1.5 lg:flex">
          <span className="text-xs font-semibold text-indigo-700">
            {roleName}
          </span>
        </div>

        {/* Quick Action */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={handleQuickActionToggle}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
              activeMenu === "quickAction"
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Plus size={15} />

            <span>Quick Action</span>

            <ChevronDown
              size={13}
              className={`transition-transform ${
                activeMenu === "quickAction" ? "rotate-180" : ""
              }`}
            />
          </button>

          {activeMenu === "quickAction" && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <div className="px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {roleName} Actions
                </p>
              </div>

              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.name}
                    href={action.href}
                    onClick={() => setActiveMenu(null)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Icon size={16} className="text-slate-400" />

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
            className="flex items-center rounded-full transition hover:ring-2 hover:ring-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <UserAvatar user={user} className="h-9 w-9 text-xs" />
          </button>

          {activeMenu === "profile" && (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="truncate text-sm font-bold text-slate-900">
                  {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                    "User"}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {user?.email || roleName}
                </p>
              </div>

              <div className="pt-1.5">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setActiveMenu(null)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <UserRound size={16} className="text-slate-400" />
                  My Profile
                </Link>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setActiveMenu(null)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Settings size={16} className="text-slate-400" />
                  Settings
                </Link>

                <Link
                  href="/dashboard/help"
                  onClick={() => setActiveMenu(null)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <HelpCircle size={16} className="text-slate-400" />
                  Help & Support
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}