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
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-body">
        <Loader2 size={18} className="mr-2 animate-spin text-primary" />
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
    <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center ring-1 ring-line">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Lock size={24} />
      </div>

      <h1 className="mt-4 font-display text-xl font-semibold text-ink">
        No ministries for your account
      </h1>

      <p className="mt-2 text-sm leading-6 text-body">
        Ministries are managed by campus leaders and led by the people they
        appoint.
      </p>
    </div>
  );
}