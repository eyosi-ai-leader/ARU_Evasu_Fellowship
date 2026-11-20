"use client";

import DashboardStats from "./DashboardStats";
import MemberGrowth from "./MemberGrowth";
import RecentActivity from "./RecentActivity";
import RoleDistribution from "./RoleDistribution";
import AIInsight from "./AIInsight";
import CampusSwitcher from "./CampusSwitcher";
import StructureStats from "./StructureStats";
import CampusBreakdown from "./CampusBreakdown";

/*
 * The numbers for the campus(es) a person manages. The campus switcher
 * appears only when they manage more than one.
 */
export default function ManagementOverview({
  data,
  loading,
  error,
  selectedFellowshipId,
  onSelectCampus,
  showAI = false,
}) {
  const campuses = data?.scope?.campuses ?? [];
  const showBreakdown =
    !selectedFellowshipId && (data?.byFellowship?.length ?? 0) > 1;

  return (
    <div className="space-y-6">
      <CampusSwitcher
        campuses={campuses}
        selectedId={selectedFellowshipId}
        onChange={onSelectCampus}
        disabled={loading}
      />

      <DashboardStats dashboardData={data} loading={loading} error={error} />

      <StructureStats structure={data?.structure} loading={loading} />

      {showBreakdown && <CampusBreakdown campuses={data.byFellowship} />}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <MemberGrowth
          dashboardData={data}
          loading={loading}
          error={error}
        />

        <RecentActivity
          dashboardData={data}
          loading={loading}
          error={error}
        />
      </section>

      <RoleDistribution roles={data?.roles} loading={loading} />

      {showAI && <AIInsight />}
    </div>
  );
}