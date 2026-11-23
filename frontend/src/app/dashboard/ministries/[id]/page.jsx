"use client";

import { useParams } from "next/navigation";

import { useAccess } from "@/components/dashboard/access/AccessProvider";
import MinistryWorkspace from "@/components/dashboard/ministries/workspace/MinistryWorkspace";

/*
 * Campus managers open a ministry with all the management tools. A ministry
 * leader who opens the same address gets the leader version (their own
 * ministry only).
 */
export default function MinistryDetailsPage() {
  const params = useParams();
  const { access, loading } = useAccess();

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  const canManage =
    access?.capabilities?.includes("fellowship:manage") ||
    access?.capabilities?.includes("general:manage");

  return (
    <MinistryWorkspace
      key={params?.id}
      ministryId={params?.id}
      mode={canManage ? "manager" : "leader"}
      backHref="/dashboard/ministries"
    />
  );
}
