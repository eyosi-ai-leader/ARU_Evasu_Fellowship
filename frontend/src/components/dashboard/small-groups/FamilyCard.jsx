"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Pencil, Phone, Plus, Trash2, X } from "lucide-react";

import { Avatar, Chip } from "./parts";

function PersonRow({ person, label, linkable, busy, disabled, onRemove }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
      <Avatar name={person.name} />

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        {linkable ? (
          <Link
            href={`/dashboard/members/${person.memberId}`}
            className="block truncate text-sm font-semibold text-slate-800 hover:text-indigo-600"
          >
            {person.name}
          </Link>
        ) : (
          <p className="truncate text-sm font-semibold text-slate-800">
            {person.name}
          </p>
        )}

        {person.phone && (
          <a
            href={`tel:${person.phone}`}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
          >
            <Phone size={11} aria-hidden="true" />
            {person.phone}
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled || busy}
        aria-label={`Take ${person.name} out of this family`}
        title="Take out of this family"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <X size={15} />}
      </button>
    </div>
  );
}

function EmptySlot({ label, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 p-2.5 text-left text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
        <Plus size={15} aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}

export default function FamilyCard({
  family,
  linkable = false,
  disabled = false,
  busyKey = "",
  onEdit,
  onDelete,
  onAdd,
  onRemove,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleting = busyKey === `delete-${family.id}`;

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-slate-900">
            {family.name}
          </h3>

          {family.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {family.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(family)}
            disabled={disabled}
            aria-label={`Edit ${family.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            onClick={() => setConfirmDelete((value) => !value)}
            disabled={disabled}
            aria-label={`Delete ${family.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {family.needsParent && (
        <div className="mt-3">
          <Chip tone="attention">Needs a father or mother</Chip>
        </div>
      )}

      {confirmDelete && (
        <div
          role="alertdialog"
          aria-label={`Confirm deleting ${family.name}`}
          className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3"
        >
          <p className="text-sm font-semibold text-red-900">
            Delete {family.name}?
          </p>

          <p className="mt-1 text-xs text-red-800">
            Its people stay in the small group and appear under &quot;Not yet
            in a family&quot;.
          </p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-100 disabled:opacity-60"
            >
              Keep it
            </button>

            <button
              type="button"
              onClick={async () => {
                await onDelete(family);
                setConfirmDelete(false);
              }}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting && <Loader2 size={13} className="animate-spin" />}
              Yes, delete
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {family.father ? (
          <PersonRow
            person={family.father}
            label="Father"
            linkable={linkable}
            disabled={disabled}
            busy={busyKey === `remove-${family.father.memberId}`}
            onRemove={() => onRemove(family, family.father)}
          />
        ) : (
          <EmptySlot
            label="Add a father"
            disabled={disabled}
            onClick={() => onAdd(family, "Father")}
          />
        )}

        {family.mother ? (
          <PersonRow
            person={family.mother}
            label="Mother"
            linkable={linkable}
            disabled={disabled}
            busy={busyKey === `remove-${family.mother.memberId}`}
            onRemove={() => onRemove(family, family.mother)}
          />
        ) : (
          <EmptySlot
            label="Add a mother"
            disabled={disabled}
            onClick={() => onAdd(family, "Mother")}
          />
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Children ({family.childCount})
        </p>

        <button
          type="button"
          onClick={() => onAdd(family, "Child")}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900 disabled:opacity-50"
        >
          <Plus size={13} aria-hidden="true" />
          Add children
        </button>
      </div>

      {family.children.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">No children yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {family.children.map((child) => (
            <li key={child.memberId}>
              <PersonRow
                person={child}
                label="Child"
                linkable={linkable}
                disabled={disabled}
                busy={busyKey === `remove-${child.memberId}`}
                onRemove={() => onRemove(family, child)}
              />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}