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
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-accent shadow-soft">
          <Building2 size={22} strokeWidth={2} />
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="h-0.5 w-5 rounded-full bg-accent" />
            Management
          </p>

          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
            Ministries
          </h1>
        </div>
      </div>

      <p className="-mt-3 max-w-2xl text-sm leading-6 text-body">
        The teams that serve in your fellowship. Open a ministry to appoint its
        leaders and add its members.
      </p>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <span className="min-w-0 flex-1">{error}</span>

          <button
            type="button"
            onClick={reload}
            className="shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-danger ring-1 ring-danger/30 transition hover:bg-danger/10 active:scale-[0.97]"
          >
            Try again
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          <CheckCircle2 size={16} className="shrink-0" />

          <span className="min-w-0 flex-1">{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition hover:bg-success/10"
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
              className="h-56 animate-pulse rounded-3xl bg-surface-muted ring-1 ring-line"
            />
          ))}
        </div>
      ) : ministries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-white p-12 text-center shadow-card">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 size={22} />
          </span>

          <h2 className="mt-4 font-display text-base font-semibold text-ink">
            No ministries found
          </h2>

          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-body">
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