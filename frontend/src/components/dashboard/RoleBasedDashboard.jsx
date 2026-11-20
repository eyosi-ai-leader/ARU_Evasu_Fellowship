"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAccess } from "@/components/dashboard/access/AccessProvider";
import { formatEthiopianLongDate } from "@/lib/ethiopianCalendar";
import { getDashboardOverview } from "@/lib/dashboardApi";

import DashboardWelcome from "@/components/dashboard/overview/DashboardWelcome";
import ManagementOverview from "@/components/dashboard/overview/ManagementOverview";
import SmallGroupsSection from "@/components/dashboard/overview/SmallGroupsSection";
import MinistryLeaderDashboard from "@/components/dashboard/ministries/MinistryLeaderDashboard";
import PersonalDashboard from "@/components/dashboard/personal/PersonalDashboard";

/*
 * One dashboard for everyone. It is built from what the person may do:
 *  - manages a campus      -> numbers for the campus(es) they manage
 *  - oversees small groups -> their small groups and families
 *  - leads a ministry      -> their ministry
 *  - is a member           -> their own profile, small group, family, ministries
 */
export default function RoleBasedDashboard() {
  const { access, loading: accessLoading, error: accessError, reload } =
    useAccess();

  const [currentDate, setCurrentDate] = useState("");
  const [fellowshipId, setFellowshipId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const requestRef = useRef(0);

  // Today's date in the Ethiopian calendar (E.C.)
  useEffect(() => {
    const updateDate = () => setCurrentDate(formatEthiopianLongDate());

    updateDate();

    const timer = setInterval(updateDate, 60 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const loadOverview = useCallback(async (campusId) => {
    const requestId = ++requestRef.current;

    try {
      setLoading(true);
      setError("");

      const response = await getDashboardOverview({
        fellowshipId: campusId,
      });

      // An older answer must never replace a newer one.
      if (requestId !== requestRef.current) return;

      setData(response?.data || null);
    } catch (err) {
      if (requestId !== requestRef.current) return;

      console.error("Dashboard error:", err);
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (access) loadOverview(fellowshipId);
  }, [access, fellowshipId, loadOverview]);

  if (accessLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (accessError || !access) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            We couldn&apos;t load your dashboard
          </h2>

          <p className="mt-1 text-sm text-red-600">{accessError}</p>

          <button
            type="button"
            onClick={reload}
            className="mt-5 inline-flex rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const isManager = Boolean(data?.scope?.canManage);
  const leadsMinistry = access.capabilities.includes("ministry:lead");
  const smallGroups = data?.smallGroups || [];
  const showPersonal = Boolean(access.member) && !access.capabilities.includes("fellowship:manage");

  return (
    <div className="space-y-6">
      <DashboardWelcome currentDate={currentDate} />

      {isManager && (
        <ManagementOverview
          data={data}
          loading={loading}
          error={error}
          selectedFellowshipId={fellowshipId}
          onSelectCampus={setFellowshipId}
          showAI={access.isSuperAdmin}
        />
      )}

      {!isManager && error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      <SmallGroupsSection groups={smallGroups} />

      {leadsMinistry && <MinistryLeaderDashboard />}

      {showPersonal && data && (
        <PersonalDashboard
          member={data.member ?? null}
          fellowship={data.myFellowship ?? null}
        />
      )}
    </div>
  );
}