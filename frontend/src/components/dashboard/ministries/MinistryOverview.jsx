"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Building2, CheckCircle2, Power, Trash2 } from "lucide-react";

import {
  createMinistry,
  getMinistries,
  deleteMinistry,
  getMinistryCampuses,
  updateMinistry,
  updateMinistryStatus,
} from "@/lib/ministryApi";

import MinistryCard from "./MinistryCard";
import MinistryFormModal from "./MinistryFormModal";
import MinistryStats from "./MinistryStats";
import MinistryToolbar from "./MinistryToolbar";
import useConfirm from "./useConfirm";
import { normalizeMinistry } from "./ministryUtils";

export default function MinistryOverview() {
  const { confirm, confirmDialog } = useConfirm();

  const [campuses, setCampuses] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [campusId, setCampusId] = useState("");

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formModal, setFormModal] = useState(null); // { mode, ministry }
  const [reloadKey, setReloadKey] = useState(0);

  // Campuses the person manages (loaded from the ministries API).
  useEffect(() => {
    let cancelled = false;

    getMinistryCampuses()
      .then((response) => {
        if (!cancelled) {
          setCampuses(Array.isArray(response?.data) ? response.data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load campuses.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Ministries, reloaded when the filters change.
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(
      async () => {
        try {
          setLoading(true);

          const response = await getMinistries({
            search,
            status,
            fellowshipId: campusId,
          });

          if (cancelled) return;

          setMinistries(
            (Array.isArray(response?.data) ? response.data : []).map(
              normalizeMinistry
            )
          );
          setError("");
        } catch (err) {
          if (!cancelled) setError(err.message || "Unable to load ministries.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      search ? 300 : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, status, campusId, reloadKey]);

  const reload = () => setReloadKey((value) => value + 1);

  async function handleSave(data) {
    // Errors are shown inside the dialog.
    if (formModal.mode === "edit") {
      await updateMinistry(formModal.ministry.id, data);
      setNotice("The ministry was updated.");
    } else {
      await createMinistry(data);
      setNotice("The ministry was created.");
    }

    setFormModal(null);
    reload();
  }

  async function handleToggleStatus(ministry) {
    const next = ministry.status === "Active" ? "Inactive" : "Active";

    const confirmed = await confirm({
      title: next === "Inactive" ? "Deactivate ministry?" : "Activate ministry?",
      message:
        next === "Inactive"
          ? `"${ministry.name}" will become inactive and no new people can be added to it.`
          : `"${ministry.name}" will be active again and people can be added to it.`,
      note: next === "Inactive" ? "You can activate it again at any time." : "",
      confirmLabel: next === "Inactive" ? "Deactivate" : "Activate",
      tone: next === "Inactive" ? "warning" : "default",
      icon: Power,
    });

    if (!confirmed) return;

    setBusyId(ministry.id);
    setError("");
    setNotice("");

    try {
      await updateMinistryStatus(ministry.id, next);
      setNotice(`"${ministry.name}" is now ${next.toLowerCase()}.`);
      reload();
    } catch (err) {
      setError(err.message || "Unable to update the ministry.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(ministry) {
    const people = ministry.memberCount + ministry.leaderCount;

    const confirmed = await confirm({
      title: `Delete "${ministry.name}"?`,
      message:
        people > 0
          ? `Its ${people} ${people === 1 ? "assignment" : "assignments"} will be removed too. The people stay fellowship members.`
          : "This ministry has no members.",
      note: "This cannot be undone. To keep it but hide it, use Deactivate instead.",
      confirmLabel: "Delete ministry",
      tone: "danger",
      icon: Trash2,
    });

    if (!confirmed) return;

    setBusyId(ministry.id);
    setError("");
    setNotice("");

    try {
      await deleteMinistry(ministry.id);
      setNotice(`"${ministry.name}" was deleted.`);
      reload();
    } catch (err) {
      setError(err.message || "Unable to delete the ministry.");
    } finally {
      setBusyId(null);
    }
  }

  const showCampus = campuses.length > 1;

  return (
    <div className="min-h-full space-y-6">
      {/* Heading */}
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          <Building2 size={19} strokeWidth={2} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Management
          </p>

          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
            Ministries
          </h1>
        </div>
      </div>

      <p className="-mt-3 max-w-2xl text-sm leading-6 text-slate-500">
        The teams that serve in your fellowship. Open a ministry to appoint its
        leaders and add its members.
      </p>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <span className="flex-1">{error}</span>

          <button
            type="button"
            onClick={reload}
            className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600"
          >
            Try again
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          <CheckCircle2 size={16} />

          <span className="flex-1">{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            className="text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      <MinistryStats ministries={ministries} />

      <MinistryToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        campusId={campusId}
        onCampus={setCampusId}
        campuses={campuses}
        onCreate={() => setFormModal({ mode: "create" })}
      />

      {loading && ministries.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : ministries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Building2 size={22} />
          </span>

          <h2 className="mt-4 text-sm font-semibold text-slate-900">
            No ministries found
          </h2>

          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
            Change your search or filters, or create the first ministry of
            your campus.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ministries.map((ministry) => (
            <MinistryCard
              key={ministry.id}
              ministry={ministry}
              showCampus={showCampus}
              canManage
              busy={busyId === ministry.id}
              onEdit={(item) => setFormModal({ mode: "edit", ministry: item })}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {formModal && (
        <MinistryFormModal
          mode={formModal.mode}
          ministry={formModal.ministry}
          campuses={campuses}
          onClose={() => setFormModal(null)}
          onSubmit={handleSave}
        />
      )}
      {confirmDialog}
    </div>
  );
}