"use client";

import { useState } from "react";
import { Loader2, Mail, Trash2, UserCheck, UserX } from "lucide-react";

import { ACCESS_STATES } from "./accessStates";
import { timeAgo } from "@/lib/timeAgo";

export default function AccessRow({
  item,
  selected,
  onToggle,
  busy,
  anyBusy,
  onInvite,
  onToggleStatus,
  onDelete,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const state = ACCESS_STATES[item.state] || ACCESS_STATES.never_signed_in;
  const inactive = item.memberStatus === "Inactive";

  const invitation = item.invitedAt
    ? `Invitation sent ${timeAgo(item.invitedAt)}${
        item.inviteCount > 1 ? ` (${item.inviteCount} times)` : ""
      }`
    : "No invitation sent yet";

  return (
    <li className="px-4 py-5 transition hover:bg-primary/[0.02] sm:px-6">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          disabled={!item.canInvite || anyBusy}
          aria-label={`Select ${item.name}`}
          className="mt-1 h-4 w-4 shrink-0 rounded border-line text-primary focus:ring-primary/30 disabled:opacity-30"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink">
              {item.name}
              {item.isSelf && (
                <span className="ml-2 text-xs font-normal text-body">
                  (you)
                </span>
              )}
            </p>

            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${state.className}`}
            >
              {state.label}
            </span>

            {inactive && (
              <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">
                Inactive
              </span>
            )}
          </div>

          <p className="truncate text-xs text-body">{item.email}</p>

          <p className="mt-1 text-xs text-body/80">
            {item.role}
            {item.memberNumber && ` · ${item.memberNumber}`} · Joined{" "}
            {new Date(item.joinedAt).toLocaleDateString()}
          </p>

          <p className="mt-0.5 text-xs text-body/80">
            {item.lastLoginAt
              ? `Last signed in ${timeAgo(item.lastLoginAt)}`
              : invitation}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {item.canInvite && (
              <button
                type="button"
                onClick={onInvite}
                disabled={anyBusy}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-dark active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-60"
              >
                {busy === "invite" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Mail size={13} aria-hidden="true" />
                )}
                {item.invitedAt ? "Resend invitation" : "Send invitation"}
              </button>
            )}

            {!item.isSelf && (
              <button
                type="button"
                onClick={onToggleStatus}
                disabled={anyBusy}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-60"
              >
                {busy === "status" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : inactive ? (
                  <UserCheck size={13} aria-hidden="true" />
                ) : (
                  <UserX size={13} aria-hidden="true" />
                )}
                {inactive ? "Activate" : "Mark inactive"}
              </button>
            )}

            {item.canDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete((current) => !current)}
                disabled={anyBusy}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-body transition hover:bg-danger/10 hover:text-danger active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-danger/20 disabled:opacity-60"
              >
                <Trash2 size={13} aria-hidden="true" />
                Delete
              </button>
            )}
          </div>

          {confirmDelete && (
            <div
              role="alertdialog"
              aria-label={`Confirm deleting ${item.name}`}
              className="mt-3 rounded-2xl border border-danger/30 bg-danger/10 p-4"
            >
              <p className="text-sm font-semibold text-danger">
                Delete {item.name}?
              </p>

              <p className="mt-1 text-sm text-ink/80">
                This permanently removes the account and any ministry
                assignments. It can&apos;t be undone. To keep the record, mark
                them inactive instead.
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={anyBusy}
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] disabled:opacity-60"
                >
                  Keep them
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await onDelete();
                    setConfirmDelete(false);
                  }}
                  disabled={anyBusy}
                  className="inline-flex items-center gap-2 rounded-full bg-danger px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
                >
                  {busy === "delete" && (
                    <Loader2 size={15} className="animate-spin" />
                  )}
                  {busy === "delete" ? "Deleting..." : "Yes, delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}