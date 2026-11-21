"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";

import { Chip, shortCampusName } from "./parts";

export default function SmallGroupCard({ group, showCampus = false, onEdit }) {
  const overseers = group.overseers || [];

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link
        href={`/dashboard/small-groups/${group.id}`}
        className="block flex-1 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-900">
              {group.name}
            </h3>

            {showCampus && (
              <p className="mt-0.5 text-xs text-slate-400">
                {shortCampusName(group.fellowshipName)}
              </p>
            )}
          </div>

          {group.status !== "Active" && <Chip>Inactive</Chip>}
        </div>

        {group.description && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">
            {group.description}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Families
            </dt>
            <dd className="mt-0.5 text-xl font-bold text-slate-900">
              {group.familyCount}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Members
            </dt>
            <dd className="mt-0.5 text-xl font-bold text-slate-900">
              {group.memberCount}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Overseers
            </dt>
            <dd className="mt-0.5 text-xl font-bold text-slate-900">
              {overseers.length}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          {overseers.length === 0 ? (
            <Chip tone="attention">No overseer yet</Chip>
          ) : (
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Overseers: </span>
              {overseers.map((overseer) => overseer.name).join(", ")}
            </p>
          )}

          {group.withoutFamily > 0 && (
            <Chip tone="attention">
              {group.withoutFamily} not yet in a family
            </Chip>
          )}
        </div>
      </Link>

      {group.canManage && onEdit && (
        <div className="border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={() => onEdit(group)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <Pencil size={13} aria-hidden="true" />
            Edit small group
          </button>
        </div>
      )}
    </article>
  );
}