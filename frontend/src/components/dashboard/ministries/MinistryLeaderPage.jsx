"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Building2, Loader2, RotateCw } from "lucide-react";

import { getMyMinistries } from "@/lib/ministryApi";
import { secondaryButton } from "@/components/dashboard/small-groups/parts";

import { normalizeMinistry } from "./ministryUtils";
import MinistryWorkspace from "./workspace/MinistryWorkspace";

/*
 * "My Ministry" for people who lead a ministry (their role may be Member).
 */
export default function MinistryLeaderPage() {
  const [ministries, setMinistries] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");

      const response = await getMyMinistries();
      const list = (Array.isArray(response?.data) ? response.data : []).map(
        normalizeMinistry
      );

      setMinistries(list);

      setSelectedId((current) =>
        list.some((item) => String(item.id) === String(current))
          ? current
          : list[0]
            ? String(list[0].id)
            : ""
      );
    } catch (err) {
      setError(err.message || "Unable to load your ministries.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!ministries && !error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading your ministry...
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
      >
        <AlertCircle size={18} className="mt-0.5 shrink-0" />

        <div className="flex-1">
          <p className="font-semibold">Unable to load your ministry</p>
          <p className="mt-1">{error}</p>
        </div>

        <button type="button" onClick={load} className={secondaryButton}>
          <RotateCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  if (ministries.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Building2 size={24} />
        </div>

        <h1 className="mt-4 text-sm font-bold text-slate-900">
          No ministry assigned
        </h1>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          Your account does not lead an active ministry yet. Ask your campus
          leader to appoint you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ministries.length > 1 && (
        <div
          role="tablist"
          aria-label="Choose a ministry"
          className="mx-auto flex max-w-6xl flex-wrap gap-2"
        >
          {ministries.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={String(item.id) === selectedId}
              onClick={() => setSelectedId(String(item.id))}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                String(item.id) === selectedId
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      <MinistryWorkspace key={selectedId} ministryId={selectedId} mode="leader" />
    </div>
  );
}