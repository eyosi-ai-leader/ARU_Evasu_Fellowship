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
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-body">
        <Loader2 size={18} className="mr-2 animate-spin text-primary" />
        Loading your ministry...
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="mx-auto flex max-w-xl items-start gap-3 rounded-3xl border border-danger/30 bg-danger/10 p-6 text-sm text-danger"
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
      <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center ring-1 ring-line">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 size={24} />
        </div>

        <h1 className="mt-4 font-display text-xl font-semibold text-ink">
          No ministry assigned
        </h1>

        <p className="mt-2 text-sm leading-6 text-body">
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
              className={`rounded-full px-5 py-2.5 text-sm font-semibold ring-1 transition duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                String(item.id) === selectedId
                  ? "bg-primary text-white shadow-soft ring-primary"
                  : "bg-white text-ink ring-line hover:ring-primary/40"
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