"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { useAccess } from "@/components/dashboard/access/AccessProvider";
import CampusBadge from "@/components/dashboard/access/CampusBadge";

export default function DashboardWelcome({ currentDate }) {
  const { access } = useAccess();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error("Failed to read logged-in user:", error);
      localStorage.removeItem("user");
    }
  }, []);

  const firstName = user?.firstName || user?.first_name || "User";

  // Positions are shown next to the role, for example a member who also
  // leads a ministry.
  const positions = [
    ...(access?.positions?.smallGroups?.length > 0
      ? ["Small group overseer"]
      : []),
    ...(access?.positions?.ministriesLed?.length > 0
      ? ["Ministry leader"]
      : []),
  ];

  return (
    <section>
      <p className="text-sm font-medium text-indigo-600">{currentDate}</p>

      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        Welcome back, {firstName}
      </h1>

      {access && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
            <ShieldCheck size={13} aria-hidden="true" />
            {access.roleLabel || "Member"}
          </span>

          <CampusBadge variant="pill" className="hidden sm:inline-flex" />

          {positions.map((position) => (
            <span
              key={position}
              className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600"
            >
              {position}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm leading-6 text-slate-500">
        Here&apos;s what&apos;s happening in your fellowship today.
      </p>
    </section>
  );
}