"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  Loader2,
  LogOut,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";

import PersonMenu from "./PersonMenu";
import { Avatar, Chip } from "./parts";

function PersonRow({ person, label, linkable, busy, disabled, items }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-muted p-2.5 ring-1 ring-line">
      <Avatar name={person.name} />

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-body">
          {label}
        </p>

        {linkable ? (
          <Link
            href={`/dashboard/members/${person.memberId}`}
            className="block truncate text-sm font-semibold text-ink transition hover:text-primary"
          >
            {person.name}
          </Link>
        ) : (
          <p className="truncate text-sm font-semibold text-ink">
            {person.name}
          </p>
        )}

        {person.phone && (
          <a
            href={`tel:${person.phone}`}
            className="inline-flex items-center gap-1 text-xs text-body transition hover:text-primary"
          >
            <Phone size={11} aria-hidden="true" />
            {person.phone}
          </a>
        )}

        {person.familyCount > 1 && (
          <p className="text-[11px] font-semibold text-primary">
            In {person.familyCount} families
          </p>
        )}
      </div>

      {busy ? (
        <Loader2 size={16} className="animate-spin text-primary" />
      ) : (
        <PersonMenu
          items={items}
          label={`Actions for ${person.name}`}
          disabled={disabled}
        />
      )}
    </div>
  );
}

function EmptySlot({ label, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line p-2.5 text-left text-sm font-medium text-body transition hover:border-primary/50 hover:bg-primary/[0.03] hover:text-primary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Plus size={15} aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}

export default function FamilyCard({
  family,
  // How many families this small group has (a move needs a second one).
  familyTotal = 1,
  linkable = false,
  disabled = false,
  busyKey = "",
  onEdit,
  onDelete,
  onAdd,
  onPersonAction,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleting = busyKey === `delete-${family.id}`;

  const itemsFor = (person, role) => [
    {
      key: "move",
      label: "Move to another family...",
      icon: ArrowRightLeft,
      disabled: familyTotal < 2,
      onClick: () => onPersonAction("move", family, person, role),
    },
    {
      key: "also",
      label: "Also add to another family...",
      icon: Plus,
      disabled: familyTotal < 2,
      onClick: () => onPersonAction("also", family, person, role),
    },
    {
      key: "out",
      label: "Take out of this family",
      icon: UserMinus,
      onClick: () => onPersonAction("out", family, person, role),
    },
    { key: "divider", divider: true },
    {
      key: "transfer",
      label: "Move to another small group...",
      icon: Users,
      onClick: () => onPersonAction("transfer", family, person, role),
    },
    {
      key: "leave",
      label: "Remove from this small group",
      icon: LogOut,
      danger: true,
      onClick: () => onPersonAction("leave", family, person, role),
    },
  ];

  const row = (person, role, label) => (
    <PersonRow
      person={person}
      label={label}
      linkable={linkable}
      disabled={disabled}
      busy={busyKey === `remove-${person.memberId}`}
      items={itemsFor(person, role)}
    />
  );

  return (
    <article className="flex flex-col rounded-3xl bg-white p-5 shadow-card ring-1 ring-line transition duration-300 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold text-ink">
            {family.name}
          </h3>

          {family.description && (
            <p className="mt-1 line-clamp-2 text-sm text-body">
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
            className="flex h-9 w-9 items-center justify-center rounded-full text-body transition hover:bg-primary/10 hover:text-primary active:scale-95 disabled:opacity-50"
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            onClick={() => setConfirmDelete((value) => !value)}
            disabled={disabled}
            aria-label={`Delete ${family.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-body transition hover:bg-danger/10 hover:text-danger active:scale-95 disabled:opacity-50"
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
          className="mt-3 rounded-2xl border border-danger/30 bg-danger/10 p-4"
        >
          <p className="text-sm font-semibold text-danger">
            Delete {family.name}?
          </p>

          <p className="mt-1 text-xs leading-5 text-danger/90">
            Its people stay in the small group and appear under &quot;Members
            without a family yet&quot;.
          </p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] disabled:opacity-60"
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
              className="inline-flex items-center gap-2 rounded-full bg-danger px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-danger/90 active:scale-[0.97] disabled:opacity-60"
            >
              {deleting && <Loader2 size={13} className="animate-spin" />}
              Yes, delete
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {family.father ? (
          row(family.father, "Father", "Father")
        ) : (
          <EmptySlot
            label="Add a father"
            disabled={disabled}
            onClick={() => onAdd(family, "Father")}
          />
        )}

        {family.mother ? (
          row(family.mother, "Mother", "Mother")
        ) : (
          <EmptySlot
            label="Add a mother"
            disabled={disabled}
            onClick={() => onAdd(family, "Mother")}
          />
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-body">
          Children ({family.childCount})
        </p>

        <button
          type="button"
          onClick={() => onAdd(family, "Child")}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 active:scale-[0.97] disabled:opacity-50"
        >
          <Plus size={13} aria-hidden="true" />
          Add children
        </button>
      </div>

      {family.children.length === 0 ? (
        <p className="mt-2 text-sm text-body">No children yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {family.children.map((child) => (
            <li key={child.memberId}>{row(child, "Child", "Child")}</li>
          ))}
        </ul>
      )}
    </article>
  );
}