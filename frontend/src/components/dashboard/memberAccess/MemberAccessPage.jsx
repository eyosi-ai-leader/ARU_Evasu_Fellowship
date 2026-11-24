"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailWarning,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";

import AccessRow from "./AccessRow";
import { FILTERS, csvCell, ACCESS_STATES } from "./accessStates";
import CampusBadge from "@/components/dashboard/access/CampusBadge";
import { shortCampusName } from "@/components/dashboard/small-groups/parts";
import {
  deleteMemberAccount,
  exportMemberAccess,
  inviteMember,
  inviteMembers,
  listMemberAccess,
  setMemberStatus,
} from "@/lib/memberAccessApi";
import { useAccess } from "@/components/dashboard/access/AccessProvider";
import useMyAccess from "@/lib/useMyAccess";

const BULK_LIMIT = 25;

const plural = (count, one, many) => (count === 1 ? one : many);

const FILTER_ICONS = {
  never: UserX,
  invited: Mail,
  expired: Clock,
  unverified: MailWarning,
  signed_in: UserCheck,
  all: Users,
};

export default function MemberAccessPage() {
  const { access, loading: accessLoading } = useAccess();
  const { campuses } = useMyAccess();

  const [filter, setFilter] = useState("never");
  const [search, setSearch] = useState("");
  const [campusId, setCampusId] = useState("");

  const [items, setItems] = useState(null);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(null); // { id, action }
  const [bulkState, setBulkState] = useState("idle"); // idle | confirm | sending
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const isStaff = Boolean(access?.capabilities?.includes("fellowship:manage"));
  const showCampus = campuses.length > 1;

  // First page, and again when the filter, search, campus or data changes.
  useEffect(() => {
    if (!isStaff) return;

    let cancelled = false;

    const timer = setTimeout(
      async () => {
        try {
          const data = await listMemberAccess({
            filter,
            search: search.trim(),
            fellowshipId: campusId,
            page: 1,
          });

          if (cancelled) return;

          setItems(data.items);
          setTotal(data.total);
          setSummary(data.summary);
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
  }, [isStaff, filter, search, campusId, reloadKey]);

  function reload() {
    setSelected(new Set());
    setReloadKey((current) => current + 1);
  }

  function changeFilter(id) {
    setFilter(id);
    setSelected(new Set());
    setNotice(null);
  }

  function changeCampus(value) {
    setCampusId(value);
    setItems(null);
    setSelected(new Set());
    setNotice(null);
  }

  async function loadMore() {
    if (loadingMore) return;

    setLoadingMore(true);
    setError("");

    try {
      const data = await listMemberAccess({
        filter,
        search: search.trim(),
        fellowshipId: campusId,
        page: page + 1,
      });

      setItems((current) => {
        const known = new Set(current.map((item) => item.memberId));

        return [
          ...current,
          ...data.items.filter((item) => !known.has(item.memberId)),
        ];
      });

      setHasMore(data.hasMore);
      setPage(page + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function runRow(item, action, call, successText) {
    if (busy || bulkState === "sending") return;

    setBusy({ id: item.memberId, action });
    setError("");
    setNotice(null);

    try {
      await call();
      setNotice({ type: "success", text: successText });
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const handleInvite = (item) =>
    runRow(
      item,
      "invite",
      () => inviteMember(item.memberId),
      `An invitation email was sent to ${item.name}.`
    );

  const handleStatus = (item) => {
    const next = item.memberStatus === "Inactive" ? "Active" : "Inactive";

    return runRow(
      item,
      "status",
      () => setMemberStatus(item.memberId, next),
      `${item.name} is now ${next.toLowerCase()}.`
    );
  };

  const handleDelete = (item) =>
    runRow(
      item,
      "delete",
      () => deleteMemberAccount(item.memberId),
      `${item.name} was deleted.`
    );

  function toggleOne(memberId) {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(memberId)) {
        next.delete(memberId);
      } else if (next.size < BULK_LIMIT) {
        next.add(memberId);
      }

      return next;
    });
  }

  const selectable = items ? items.filter((item) => item.canInvite) : [];

  const allShownSelected =
    selectable.length > 0 &&
    selectable.slice(0, BULK_LIMIT).every((item) => selected.has(item.memberId));

  function toggleAllShown() {
    if (allShownSelected) {
      setSelected(new Set());
      return;
    }

    setSelected(
      new Set(selectable.slice(0, BULK_LIMIT).map((item) => item.memberId))
    );
  }

  async function handleBulk() {
    setBulkState("sending");
    setError("");
    setNotice(null);

    try {
      const result = await inviteMembers([...selected]);

      const problems = [...result.skipped, ...result.failed].map(
        (entry) => `${entry.name}: ${entry.reason}`
      );

      setNotice({
        type: problems.length > 0 ? "warning" : "success",
        text: `${result.sent} ${plural(result.sent, "invitation", "invitations")} sent${
          problems.length > 0 ? `, ${problems.length} could not be sent.` : "."
        }`,
        details: problems,
      });

      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkState("idle");
    }
  }

  async function handleExport() {
    if (exporting) return;

    setExporting(true);
    setError("");

    try {
      const rows = await exportMemberAccess({
        filter,
        search: search.trim(),
        fellowshipId: campusId,
      });

      const header = [
        "Name",
        "Email",
        "Role",
        "Campus",
        "Member number",
        "Access status",
        "Member status",
        "Joined",
        "Last signed in",
        "Invitation last sent",
        "Invitations sent",
      ];

      const lines = rows.map((row) => [
        row.name,
        row.email,
        row.role,
        row.campusName,
        row.memberNumber,
        ACCESS_STATES[row.state]?.label || row.state,
        row.memberStatus,
        row.joinedAt ? new Date(row.joinedAt).toLocaleDateString() : "",
        row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : "",
        row.invitedAt ? new Date(row.invitedAt).toLocaleString() : "",
        row.inviteCount,
      ]);

      const csv = [header, ...lines]
        .map((line) => line.map(csvCell).join(","))
        .join("\r\n");

      const blob = new Blob([`\uFEFF${csv}`], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "member-access.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  if (accessLoading) return null;

  if (!isStaff) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center shadow-card ring-1 ring-line">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </span>

        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
          You don&apos;t have access to this page
        </h1>

        <p className="mt-2 text-sm text-body">
          Member access can be managed by campus leaders and administrators.
        </p>
      </div>
    );
  }

  const bulkSending = bulkState === "sending";
  const searching = search.trim().length > 0;
  const activeFilter = FILTERS.find((entry) => entry.id === filter);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-accent shadow-soft">
            <KeyRound size={20} strokeWidth={2} />
          </div>

          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-0.5 w-5 rounded-full bg-accent" />
              Management
            </p>

            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
              Member Access
            </h1>
          </div>
        </div>

        <CampusBadge variant="pill" />
      </div>

      <p className="-mt-3 max-w-2xl text-sm leading-6 text-body">
        See who hasn&apos;t signed in yet, and send them an invitation to set
        their password.
      </p>

      {/* Summary tiles (they also work as filters) */}
      <div
        role="group"
        aria-label="Filter members"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {FILTERS.map((entry) => {
          const active = filter === entry.id;
          const value = summary ? summary[entry.count] : "-";
          const Icon = FILTER_ICONS[entry.id] || Users;

          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={active}
              onClick={() => changeFilter(entry.id)}
              className={`flex items-center gap-3 rounded-2xl p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                active
                  ? "bg-gradient-to-br from-primary to-primary-dark text-white shadow-soft"
                  : "bg-white text-body shadow-card ring-1 ring-line"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  active ? "bg-white/15 text-accent" : "bg-primary/10 text-primary"
                }`}
              >
                <Icon size={17} aria-hidden="true" />
              </span>

              <span className="min-w-0">
                <span
                  className={`block font-display text-2xl font-semibold leading-tight ${
                    active ? "text-white" : "text-ink"
                  }`}
                >
                  {value}
                </span>

                <span
                  className={`block truncate text-xs font-medium ${
                    active ? "text-white/80" : "text-body"
                  }`}
                >
                  {entry.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {activeFilter && <p className="text-sm text-body">{activeFilter.hint}</p>}

      <p className="rounded-2xl bg-surface-muted px-4 py-3 text-xs leading-5 text-body ring-1 ring-line">
        Sign-in tracking is new. Members who signed in before it was added
        appear as &quot;Never signed in&quot; until their next sign-in.
      </p>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-card ring-1 ring-line lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-body"
              aria-hidden="true"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or number"
              aria-label="Search members"
              className="h-11 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>

          {campuses.length > 1 && (
            <select
              value={campusId}
              onChange={(event) => changeCampus(event.target.value)}
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
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-60"
        >
          {exporting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Download size={15} aria-hidden="true" />
          )}
          Download CSV
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className={`rounded-2xl px-4 py-3 text-sm ring-1 ${
            notice.type === "warning"
              ? "bg-accent/20 text-ink ring-accent/40"
              : "bg-success/10 text-success ring-success/30"
          }`}
        >
          <div className="flex items-start gap-3">
            {notice.type === "warning" ? (
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}

            <div className="min-w-0 flex-1">
              <p>{notice.text}</p>

              {notice.details?.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {notice.details.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss message"
              className="rounded-full p-1 transition hover:bg-ink/5"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </div>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="rounded-3xl bg-primary/[0.04] p-4 ring-2 ring-primary/30">
          {bulkState === "idle" ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">
                {selected.size} selected
                {selected.size >= BULK_LIMIT &&
                  ` (the limit is ${BULK_LIMIT} at a time)`}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="rounded-full px-5 py-2 text-sm font-semibold text-body transition hover:bg-primary/10 hover:text-primary"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => setBulkState("confirm")}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.97]"
                >
                  <Mail size={15} aria-hidden="true" />
                  Send invitations
                </button>
              </div>
            </div>
          ) : (
            <div role="alertdialog" aria-label="Confirm sending invitations">
              <p className="text-sm font-semibold text-ink">
                Email an invitation to {selected.size}{" "}
                {plural(selected.size, "member", "members")}?
              </p>

              <p className="mt-1 text-sm text-body">
                Each one gets a personal link to set their password. It takes
                about a second per email, so please keep this page open.
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setBulkState("idle")}
                  disabled={bulkSending}
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] disabled:opacity-60"
                >
                  Go back
                </button>

                <button
                  type="button"
                  onClick={handleBulk}
                  disabled={bulkSending}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.97] disabled:opacity-60"
                >
                  {bulkSending && <Loader2 size={15} className="animate-spin" />}
                  {bulkSending ? "Sending..." : "Yes, send them"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {!items && !error && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-3xl bg-white py-16 text-sm text-body shadow-card ring-1 ring-line"
        >
          <Loader2 size={18} className="animate-spin text-primary" />
          Loading members...
        </div>
      )}

      {items && items.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line bg-white p-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users size={22} />
          </span>

          <p className="mt-4 text-sm font-semibold text-ink">
            {searching
              ? "No members match your search"
              : filter === "never"
                ? "Everyone has signed in"
                : "No members in this group"}
          </p>

          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-body">
            {searching
              ? "Try another name, email or member number."
              : filter === "never"
                ? "There is nobody to follow up right now."
                : "Choose another group above to see more members."}
          </p>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-muted/60 px-4 py-3 sm:px-6">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={allShownSelected}
                onChange={toggleAllShown}
                disabled={selectable.length === 0 || bulkSending}
                className="h-4 w-4 rounded border-line text-primary focus:ring-primary/30 disabled:opacity-30"
              />
              Select shown (up to {BULK_LIMIT})
            </label>

            <p className="text-xs text-body">
              {total} {plural(total, "member", "members")}
            </p>
          </div>

          <ul className="divide-y divide-line">
            {items.map((item) => (
              <AccessRow
                key={item.memberId}
                item={item}
                selected={selected.has(item.memberId)}
                onToggle={() => toggleOne(item.memberId)}
                busy={busy?.id === item.memberId ? busy.action : null}
                anyBusy={Boolean(busy) || bulkSending}
                showCampus={showCampus}
                onInvite={() => handleInvite(item)}
                onToggleStatus={() => handleStatus(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </ul>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-60"
          >
            {loadingMore && <Loader2 size={15} className="animate-spin" />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}