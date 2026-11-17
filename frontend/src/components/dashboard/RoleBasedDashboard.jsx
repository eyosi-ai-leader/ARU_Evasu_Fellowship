"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getFellowshipRoleName } from "@/lib/fellowshipRoles";
import { formatEthiopianLongDate } from "@/lib/ethiopianCalendar";
import { DashboardOverview } from "@/components/dashboard/overview";
import ChurchElderDashboard from "@/components/dashboard/elder/ChurchElderDashboard";
import PersonalDashboard from "@/components/dashboard/personal/PersonalDashboard";
import MinistryLeaderDashboard from "@/components/dashboard/ministries/MinistryLeaderDashboard";

export default function RoleBasedDashboard() {
  const [currentDate, setCurrentDate] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Today's date in the Ethiopian calendar (E.C.)
  useEffect(() => {
    const updateDate = () => setCurrentDate(formatEthiopianLongDate());

    updateDate();

    const timer = setInterval(updateDate, 60 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setUser(null);
        return;
      }

      setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error("Failed to load authenticated user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Authentication required
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Please sign in to access your dashboard.
          </p>

          <Link
            href="/login"
            className="mt-5 inline-flex rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardContent
      user={user}
      roleName={getFellowshipRoleName(user.roleId)}
      currentDate={currentDate}
    />
  );
}

function DashboardContent({ user, roleName, currentDate }) {
  switch (Number(user.roleId)) {
    case 3:
      return (
        <ChurchElderDashboard
          currentDate={currentDate}
          user={user}
          roleName={roleName}
        />
      );

    case 4:
      return (
        <MinistryLeaderDashboard
          currentDate={currentDate}
          user={user}
          roleName={roleName}
        />
      );

    case 5:
      return <PersonalDashboard />;

    // 1 = Administrator, 2 = Pastor (and anything unexpected)
    default:
      return (
        <DashboardOverview
          currentDate={currentDate}
          user={user}
          roleName={roleName}
        />
      );
  }
}