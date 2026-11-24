"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

import useMyAccess from "@/lib/useMyAccess";
import { deleteEvent, listEvents, setEventStatus } from "@/lib/eventsApi";
import { shortCampusName } from "@/components/dashboard/small-groups/parts";

import EventListItem from "./EventListItem";

const SAVED_MESSAGES = {
  created: "The event was created and is now live.",
  updated: "The event was updated.",
};

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

export default function EventsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { campuses } = useMyAccess();

  const [canCreate, setCanCreate] = useState(false);

  const [tab, setTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [campusId, setCampusId] = useState("");

  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(null); // { id, action }
  const [reloadKey, setReloadKey] = useState(0);

  // Message shown after saving in the editor.
  useEffect(() => {
    const saved = params.get("saved");

    if (saved && SAVED_MESSAGES[saved]) {
      setNotice(SAVED_MESSAGES[saved]);
      router.replace("/dashboard/events", { scroll: false });
    }
  }, [params, router]);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(""), 6000);

    return () => clearTimeout(timer);
  }, [notice]);

  // First page, and again when the tab, search, campus or data changes.
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(
      async () => {
        try {
          const data = await listEvents({
            scope: tab,
            search: search.trim(),
            page: 1,
            fellowshipId: campusId,
          });

          if (cancelled) return;

          setItems(data.items);
          setCanCreate(Boolean(data.canCreate));
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
  }, [tab, search, campusId, reloadKey]);

  function changeTab(id) {
    setTab(id);
    setItems(null);
    setNotice("");
  }

  async function loadMore() {
    if (loadingMore) return;

    setLoadingMore(true);
    setError("");

    try {
      const data = await listEvents({
        scope: tab,
        search: search.trim(),
        page: page + 1,
        fellowshipId: campusId,
      });

      setItems((current) => {
        const known = new Set(current.map((item) => item.id));

        return [...current, ...data.items.filter((item) => !known.has(item.id))];
      });

      setHasMore(data.hasMore);
      setPage(page + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function run(item, action, call, text) {
    if (busy) return;

    setBusy({ id: item.id, action });
    setError("");
    setNotice("");

    try {
      await call();
      setNotice(text);
      setReloadKey((current) => current + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const handleToggleCancel = (item) => {
    const next = item.cancelled ? "published" : "cancelled";

    return run(
      item,
      "status",
      () => setEventStatus(item.id, next),
      item.cancelled
        ? `"${item.title}" is open again.`
        : `"${item.title}" was cancelled. People will see it marked as cancelled.`
    );
  };

  const handleDelete = (item) =>
    run(
      item,
      "delete",
      () => deleteEvent(item.id),
      `"${item.title}" was deleted.`
    );

  const searching = search.trim().length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-accent shadow-soft">
            <CalendarDays size={21} strokeWidth={2} />
          </div>

          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
              Events
            </h1>

            <p className="mt-0.5 text-sm text-body">
              {canCreate
                ? "Add and manage events for your campus, ministries and small groups."
                : "Upcoming gatherings and activities for you."}
            </p>
          </div>
        </div>

        {canCreate && (
          <Link
            href="/dashboard/events/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Plus size={17} aria-hidden="true" />
            Add event
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Event period"
          className="inline-flex gap-1 rounded-full bg-white p-1 ring-1 ring-line"
        >
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              onClick={() => changeTab(entry.id)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                tab === entry.id
                  ? "bg-primary text-white shadow-soft"
                  : "text-body hover:text-ink"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {campuses.length > 1 && (
            <select
              value={campusId}
              onChange={(event) => {
                setCampusId(event.target.value);
                setItems(null);
              }}
              aria-label="Campus"
              className="h-11 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="">All campuses</option>

              {campuses.map((campus) => (
                <option key={campus.id} value={String(campus.id)}>
                  {shortCampusName(campus.name)}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-body/60"
              aria-hidden="true"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search events"
              aria-label="Search events"
              className="h-11 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-3xl border border-success/30 bg-success/10 px-5 py-3 text-sm text-success"
        >
          <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />
          <span className="flex-1">{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
            className="rounded-full p-1.5 transition hover:bg-success/20"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-3xl border border-danger/30 bg-danger/10 px-5 py-3 text-sm text-danger"
        >
          {error}
        </div>
      )}

      {!items && !error && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-3xl bg-white py-16 text-sm text-body ring-1 ring-line"
        >
          <Loader2 size={18} className="animate-spin text-primary" />
          Loading events...
        </div>
      )}

      {items && items.length === 0 && (
        <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-line">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays size={24} aria-hidden="true" />
          </div>

          <p className="mt-4 font-display text-lg font-semibold text-ink">
            {searching
              ? "No events match your search."
              : tab === "upcoming"
                ? "No upcoming events."
                : "No past events yet."}
          </p>

          {canCreate && tab === "upcoming" && !searching && (
            <Link
              href="/dashboard/events/new"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-dark"
            >
              <Plus size={15} aria-hidden="true" />
              Add the first event
            </Link>
          )}
        </div>
      )}

      {items?.map((item) => (
        <EventListItem
          key={item.id}
          item={item}
          busy={busy?.id === item.id ? busy.action : null}
          anyBusy={Boolean(busy)}
          onToggleCancel={() => handleToggleCancel(item)}
          onDelete={() => handleDelete(item)}
          onChanged={() => setReloadKey((current) => current + 1)}
        />
      ))}

      {items && total > 0 && (
        <p className="text-center text-xs font-medium text-body">
          Showing {items.length} of {total}
        </p>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
          >
            {loadingMore && <Loader2 size={15} className="animate-spin" />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}