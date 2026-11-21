"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Home, Loader2, Lock, Plus } from "lucide-react";

import useMyAccess from "@/lib/useMyAccess";
import { getSmallGroups } from "@/lib/smallGroupApi";
import CampusSwitcher from "@/components/dashboard/overview/CampusSwitcher";

import SmallGroupCard from "./SmallGroupCard";
import SmallGroupFormModal from "./SmallGroupFormModal";
import { primaryButton, shortCampusName } from "./parts";

function Tile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

export default function SmallGroupsPage() {
  const { access, campuses, loading: accessLoading } = useMyAccess();

  const [groups, setGroups] = useState(null);
  const [error, setError] = useState("");
  const [campusFilter, setCampusFilter] = useState(null);
  const [formModal, setFormModal] = useState(null); // { mode, group }

  const canManage = Boolean(
    access?.capabilities?.includes("fellowship:manage")
  );
  const leads = Boolean(access?.capabilities?.includes("smallgroup:lead"));
  const allowed = canManage || leads;

  const load = useCallback(async () => {
    try {
      setError("");

      const data = await getSmallGroups();

      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load the small groups.");
    }
  }, []);

  useEffect(() => {
    if (!accessLoading && allowed) load();
  }, [accessLoading, allowed, load]);

  const switcherCampuses = useMemo(
    () =>
      campuses.map((campus) => ({
        id: campus.id,
        name: shortCampusName(campus.name),
      })),
    [campuses]
  );

  const visible = (groups || []).filter(
    (group) => !campusFilter || group.fellowshipId === campusFilter
  );

  const totals = visible.reduce(
    (sum, group) => ({
      families: sum.families + group.familyCount,
      members: sum.members + group.memberCount,
      without: sum.without + group.withoutFamily,
    }),
    { families: 0, members: 0, without: 0 }
  );

  if (accessLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Lock size={24} />
        </div>

        <h1 className="mt-4 text-sm font-bold text-slate-900">
          No small groups for your account
        </h1>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          Small groups are managed by campus leaders and overseen by the
          people they appoint.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-6">
      {/* Heading */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Home size={19} strokeWidth={2} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {canManage ? "Management" : "Small Group"}
              </p>

              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                Small Groups
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            {canManage
              ? "Create small groups, appoint their overseers, and see who still needs a place in a family."
              : "The small groups you oversee. Open one to look after its families."}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setFormModal({ mode: "create" })}
            className={primaryButton}
          >
            <Plus size={16} />
            New small group
          </button>
        )}
      </div>

      {canManage && switcherCampuses.length > 1 && (
        <CampusSwitcher
          campuses={switcherCampuses}
          selectedId={campusFilter}
          onChange={setCampusFilter}
        />
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={load}
            className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600"
          >
            Try again
          </button>
        </div>
      )}

      {groups && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Tile label="Families" value={totals.families} />
          <Tile label="Members in small groups" value={totals.members} />
          <Tile label="Not yet in a family" value={totals.without} />
        </div>
      )}

      {!groups && !error && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      )}

      {groups && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-sm font-semibold text-slate-800">
            No small groups yet
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
            {canManage
              ? "Create the first small group of your campus, then appoint its overseers."
              : "You don't oversee a small group yet."}
          </p>
        </div>
      )}

      {visible.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((group) => (
            <SmallGroupCard
              key={group.id}
              group={group}
              showCampus={switcherCampuses.length > 1}
              onEdit={(item) => setFormModal({ mode: "edit", group: item })}
            />
          ))}
        </div>
      )}

      {formModal && (
        <SmallGroupFormModal
          mode={formModal.mode}
          group={formModal.group}
          campuses={campuses}
          onClose={() => setFormModal(null)}
          onSaved={async () => {
            setFormModal(null);
            await load();
          }}
        />
      )}
    </div>
  );
}