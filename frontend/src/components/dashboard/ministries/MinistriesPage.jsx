"use client";

import { Loader2, Lock } from "lucide-react";

import { useAccess } from "@/components/dashboard/access/AccessProvider";

import MinistryLeaderPage from "./MinistryLeaderPage";
import MinistryOverview from "./MinistryOverview";

/*
 * /dashboard/ministries: campus managers see every ministry of their
 * campuses. A ministry leader sees their own ministry. Everyone else sees
 * a short message.
 */
export default function MinistriesPage() {
  const { access, loading } = useAccess();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading...
      </div>
    );
  }

  const capabilities = access?.capabilities || [];

  if (
    capabilities.includes("fellowship:manage") ||
    capabilities.includes("general:manage")
  ) {
    return <MinistryOverview />;
  }

  if (capabilities.includes("ministry:lead")) {
    return <MinistryLeaderPage />;
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Lock size={24} />
      </div>

      <h1 className="mt-4 text-sm font-bold text-slate-900">
        No ministries for your account
      </h1>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        Ministries are managed by campus leaders and led by the people they
        appoint.
      </p>
    </div>
  );
}