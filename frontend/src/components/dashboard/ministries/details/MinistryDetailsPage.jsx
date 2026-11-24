"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import {
  getMinistryById,
  getMinistryMembers,
  updateMinistryStatus,
} from "@/lib/ministryApi";

import MinistryStatusBadge from "@/components/dashboard/ministries/MinistryStatusBadge";
import MinistryDetails from "@/components/dashboard/ministries/details/MinistryDetails";

export default function MinistryDetailsPage() {
  const params = useParams();
  const ministryId = params?.id;

  const [ministry, setMinistry] = useState(null);
  const [members, setMembers] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!ministryId) return;

    setLoading(true);
    setError("");

    try {
      const [ministryResponse, membersResponse, leadersResponse] =
        await Promise.all([
          getMinistryById(ministryId),
          getMinistryMembers(ministryId, "Member"),
          getMinistryMembers(ministryId, "Ministry Leader"),
        ]);

      setMinistry(ministryResponse?.data || null);

      setMembers(
        Array.isArray(membersResponse?.data)
          ? membersResponse.data
          : []
      );

      setLeaders(
        Array.isArray(leadersResponse?.data)
          ? leadersResponse.data
          : []
      );
    } catch (err) {
      setError(err.message || "Unable to load ministry details.");
    } finally {
      setLoading(false);
    }
  }, [ministryId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  async function handleToggleStatus() {
    if (!ministry || updatingStatus) return;

    const nextStatus =
      ministry.status === "Active" ? "Inactive" : "Active";

    const action = nextStatus === "Inactive" ? "Deactivate" : "Activate";

    if (!window.confirm(`${action} "${ministry.name}"?`)) {
      return;
    }

    setUpdatingStatus(true);
    setError("");

    try {
      await updateMinistryStatus(ministry.id, nextStatus);
      await loadDetails();
    } catch (err) {
      setError(err.message || "Unable to update ministry status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-3xl bg-white p-12 text-sm text-body ring-1 ring-line">
        <Loader2 size={18} className="animate-spin text-primary" />
        Loading ministry details...
      </div>
    );
  }

  if (error && !ministry) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/ministries"
          className="inline-flex items-center gap-2 text-sm font-semibold text-body transition hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to ministries
        </Link>

        <div
          role="alert"
          className="rounded-3xl border border-danger/30 bg-danger/10 p-6 text-sm text-danger"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle size={18} />
            Could not load ministry
          </div>

          <p className="mt-2">{error}</p>

          <button
            type="button"
            onClick={loadDetails}
            className="mt-4 rounded-full bg-white px-5 py-2 font-semibold text-danger ring-1 ring-danger/30 transition hover:bg-danger/10 active:scale-[0.97]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!ministry) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-line">
        <h2 className="font-display text-xl font-semibold text-ink">
          Ministry not found
        </h2>

        <Link
          href="/dashboard/ministries"
          className="mt-4 inline-block text-sm font-semibold text-primary transition hover:text-primary-dark"
        >
          Return to ministries
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <Link
        href="/dashboard/ministries"
        className="inline-flex items-center gap-2 text-sm font-semibold text-body transition hover:text-primary"
      >
        <ArrowLeft size={16} />
        All ministries
      </Link>

      {error && (
        <div
          role="alert"
          className="rounded-3xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
        >
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line">
        <div
          aria-hidden="true"
          className="h-2 bg-gradient-to-r from-primary via-ember to-accent"
        />

        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-accent shadow-soft">
                <Building2 size={27} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                    {ministry.name}
                  </h1>

                  <MinistryStatusBadge status={ministry.status} />
                </div>

                <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-body">
                  {ministry.description || "No description provided."}
                </p>

                <p className="mt-3 text-xs text-body/70">
                  Ministry ID: {ministry.id}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={loadDetails}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>

              <button
                type="button"
                disabled={updatingStatus}
                onClick={handleToggleStatus}
                className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] disabled:opacity-50"
              >
                {updatingStatus
                  ? "Updating..."
                  : ministry.status === "Active"
                    ? "Deactivate"
                    : "Activate"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <MinistryDetails
        ministry={ministry}
        members={members}
        leaders={leaders}
        onRefresh={loadDetails}
      />
    </div>
  );
}