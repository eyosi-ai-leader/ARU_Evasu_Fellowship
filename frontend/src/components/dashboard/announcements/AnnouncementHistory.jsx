"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Pin,
  PinOff,
  RotateCcw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

import AnnouncementDetails from "./AnnouncementDetails";
import { Pill, PriorityBadge, formatWhen } from "./parts";
import {
  cancelAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  pinAnnouncement,
  retryAnnouncement,
} from "@/lib/announcementApi";

const STATUS = {
  scheduled: { label: "Scheduled", className: "bg-indigo-50 text-indigo-700" },
  sending: { label: "Sending", className: "bg-blue-50 text-blue-700" },
  sent: { label: "Sent", className: "bg-emerald-50 text-emerald-700" },
  partial: { label: "Partly sent", className: "bg-amber-50 text-amber-700" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700" },
  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
};

const IN_DASHBOARD = {
  label: "In dashboard",
  className: "bg-emerald-50 text-emerald-700",
};

const DELIVERY_LABEL = {
  both: "Dashboard + email",
  dashboard: "Dashboard only",
  email: "Email only",
};

const FILTERS = [
  { value: "", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sending", label: "Sending" },
  { value: "sent", label: "Sent" },
  { value: "partial", label: "Partly sent" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AnnouncementHistory() {
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [busy, setBusy] = useState(null); // { id, action }
  const [expandedId, setExpandedId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  // First page, and again whenever the search or filter changes.
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(
      async () => {
        try {
          const data = await listAnnouncements({
            search: search.trim(),
            status,
            page: 1,
          });

          if (cancelled) return;

          setItems(data.items);
          setTotal(data.total);
          setHasMore(data.hasMore);
          setPage(1);
          setError("");
        } catch (err) {
          if (!cancelled) setError(err.message);
        }
      },
      search ? 300 : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, status]);

  // Updates the items already on screen (progress, scheduled -> sent).
  const refresh = useCallback(async () => {
    try {
      const data = await listAnnouncements({
        search: search.trim(),
        status,
        page: 1,
      });

      setItems((current) => {
        if (!current) return data.items;

        const fresh = new Map(data.items.map((item) => [item.id, item]));

        return current.map((item) => fresh.get(item.id) || item);
      });
    } catch {
      /* keep what is on screen */
    }
  }, [search, status]);

  const hasSending = items?.some((item) => item.status === "sending");
  const hasScheduled = items?.some((item) => item.status === "scheduled");

  useEffect(() => {
    if (!hasSending && !hasScheduled) return;

    const timer = setInterval(refresh, hasSending ? 4000 : 30000);

    return () => clearInterval(timer);
  }, [hasSending, hasScheduled, refresh]);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(""), 5000);

    return () => clearTimeout(timer);
  }, [notice]);

  async function loadMore() {
    if (loadingMore) return;

    setLoadingMore(true);
    setError("");

    try {
      const data = await listAnnouncements({
        search: search.trim(),
        status,
        page: page + 1,
      });

      setItems((current) => {
        const known = new Set(current.map((item) => item.id));

        return [...current, ...data.items.filter((item) => !known.has(item.id))];
      });

      setHasMore(data.hasMore);
      setTotal(data.total);
      setPage(page + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function run(item, action, work, onDone) {
    if (busy) return;

    setBusy({ id: item.id, action });
    setError("");

    try {
      await work();
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
      setConfirmId(null);
    }
  }

  const handleRetry = (item) =>
    run(item, "retry", () => retryAnnouncement(item.id), refresh);

  const handlePin = (item) =>
    run(item, "pin", () => pinAnnouncement(item.id, !item.pinned), () => {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, pinned: !item.pinned } : entry
        )
      );

      setNotice(
        item.pinned
          ? "The announcement was unpinned."
          : "The announcement is pinned to the top of the inbox."
      );
    });

  const handleCancel = (item) =>
    run(item, "cancel", () => cancelAnnouncement(item.id), async () => {
      setNotice("The scheduled announcement was cancelled. Nothing was sent.");
      await refresh();
    });

  const handleDelete = (item) =>
    run(item, "delete", () => deleteAnnouncement(item.id), () => {
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setTotal((current) => Math.max(0, current - 1));

      if (expandedId === item.id) setExpandedId(null);

      setNotice("The announcement was deleted.");
    });

  if (!items && !error) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500"
      >
        <Loader2 size={18} className="animate-spin" />
        Loading announcements...
      </div>
    );
  }

  const searching = search.trim().length > 0 || status !== "";

  return (
    <div className="space-y-4">
      {(total > 0 || searching) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by subject or audience"
                aria-label="Search announcements"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setItems(null);
              }}
              aria-label="Filter by status"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-slate-400"
            >
              {FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm text-slate-500">
            {total} {total === 1 ? "announcement" : "announcements"}
          </p>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {items && items.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {searching
            ? "No announcements match."
            : "No announcements have been sent yet."}
        </div>
      )}

      {items?.map((item) => {
        const scheduled = item.status === "scheduled";
        const cancelled = item.status === "cancelled";
        const unsent = scheduled || cancelled;

        const hasEmails = item.emailTotal > 0;
        const dashboardOnly = item.delivery !== "email" && !hasEmails;
        const showsInDashboard = item.delivery !== "email";

        const badge = unsent
          ? STATUS[item.status]
          : dashboardOnly
            ? IN_DASHBOARD
            : STATUS[item.status] || STATUS.sending;

        const done = item.sent + item.failed;
        const percent = hasEmails ? Math.round((done / item.emailTotal) * 100) : 0;

        const expanded = expandedId === item.id;
        const confirming = confirmId === item.id;
        const working = busy?.id === item.id ? busy.action : null;

        return (
          <article
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-slate-900">
                    {item.subject}
                  </h3>

                  <PriorityBadge priority={item.priority} />

                  {item.pinned && (
                    <Pill tone="info">
                      <Pin size={11} aria-hidden="true" />
                      Pinned
                    </Pill>
                  )}

                  {item.category && <Pill>{item.category}</Pill>}
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {item.audience} · {DELIVERY_LABEL[item.delivery]} · by{" "}
                  {item.sender} · {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>

            {scheduled && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
                <CalendarClock size={16} aria-hidden="true" />
                Goes out {formatWhen(item.scheduledAt)}
              </p>
            )}

            {!unsent && (
              <div className="mt-4">
                {hasEmails && (
                  <div
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Email sending progress"
                    className="h-2 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}

                <p className={`${hasEmails ? "mt-2" : ""} text-xs text-slate-500`}>
                  {hasEmails &&
                    `${item.sent} of ${item.emailTotal} emailed${
                      item.failed > 0 ? ` · ${item.failed} failed` : ""
                    }`}
                  {hasEmails && showsInDashboard && " · "}
                  {showsInDashboard &&
                    `${item.readCount} of ${item.total} read in the dashboard`}
                  {item.optedOut > 0 && ` · ${item.optedOut} opted out of email`}
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : item.id)}
                aria-expanded={expanded}
                className="inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {expanded ? "Hide details" : "View details"}
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {item.canCancel && (
                  <button
                    type="button"
                    onClick={() => handleCancel(item)}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
                  >
                    {working === "cancel" ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <XCircle size={15} aria-hidden="true" />
                    )}
                    Cancel sending
                  </button>
                )}

                {item.canRetry && (
                  <button
                    type="button"
                    onClick={() => handleRetry(item)}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
                  >
                    {working === "retry" ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <RotateCcw size={15} aria-hidden="true" />
                    )}
                    Retry unsent
                  </button>
                )}

                {!cancelled && item.delivery !== "email" && (
                  <button
                    type="button"
                    onClick={() => handlePin(item)}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
                  >
                    {working === "pin" ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : item.pinned ? (
                      <PinOff size={15} aria-hidden="true" />
                    ) : (
                      <Pin size={15} aria-hidden="true" />
                    )}
                    {item.pinned ? "Unpin" : "Pin"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setConfirmId(confirming ? null : item.id)}
                  disabled={item.status === "sending" || Boolean(busy)}
                  title={
                    item.status === "sending"
                      ? "Wait until sending finishes to delete this announcement."
                      : undefined
                  }
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={15} aria-hidden="true" />
                  Delete
                </button>
              </div>
            </div>

            {confirming && (
              <div
                role="alertdialog"
                aria-label="Confirm deleting this announcement"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <p className="text-sm font-semibold text-red-900">
                  Delete &quot;{item.subject}&quot;?
                </p>

                <p className="mt-1 text-sm text-red-800">
                  {unsent
                    ? "It will be removed from this list and will not be sent."
                    : showsInDashboard
                      ? "It will be removed from this list and from every member's dashboard and notifications. Emails that were already sent can't be recalled."
                      : "It will be removed from this list. Emails that were already sent can't be recalled."}
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    disabled={Boolean(busy)}
                    className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-900 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    Keep it
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {working === "delete" && (
                      <Loader2 size={15} className="animate-spin" />
                    )}
                    {working === "delete" ? "Deleting..." : "Yes, delete"}
                  </button>
                </div>
              </div>
            )}

            {expanded &&
              (unsent ? (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-5">
                  <p className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    {item.message}
                  </p>

                  <p className="text-xs text-slate-500">
                    {cancelled
                      ? "This announcement was cancelled and nothing was sent."
                      : "The people it reaches are worked out at the moment it is sent."}
                    {item.expiresAt &&
                      ` Hidden from the inbox after ${formatWhen(item.expiresAt)}.`}
                  </p>
                </div>
              ) : (
                <AnnouncementDetails
                  announcementId={item.id}
                  onChanged={refresh}
                />
              ))}
          </article>
        );
      })}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
          >
            {loadingMore && <Loader2 size={15} className="animate-spin" />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}