"use client";

import Link from "next/link";
import { CalendarClock, Pencil } from "lucide-react";

import { Chip, shortCampusName } from "./parts";

export default function SmallGroupCard({ group, showCampus = false, onEdit }) {
  const overseers = group.overseers || [];
  const full = group.capacity && group.memberCount >= group.capacity;

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <Link
        href={`/dashboard/small-groups/${group.id}`}
        className="block flex-1 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold text-ink">
              {group.name}
            </h3>

            {showCampus && (
              <p className="mt-0.5 text-xs font-medium text-primary">
                {shortCampusName(group.fellowshipName)}
              </p>
            )}
          </div>

          {group.status !== "Active" && <Chip>Inactive</Chip>}
        </div>

        {(group.purpose || group.description) && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-body">
            {group.purpose || group.description}
          </p>
        )}

        {group.meetingSchedule && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-body">
            <CalendarClock
              size={13}
              aria-hidden="true"
              className="text-primary/70"
            />
            {group.meetingSchedule}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-body">
              Families
            </dt>
            <dd className="mt-0.5 font-display text-2xl font-semibold text-primary">
              {group.familyCount}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-body">
              Members
            </dt>
            <dd className="mt-0.5 font-display text-2xl font-semibold text-primary">
              {group.memberCount}
              {group.capacity ? (
                <span className="font-sans text-sm font-medium text-body">
                  {" "}
                  / {group.capacity}
                </span>
              ) : null}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-body">
              Overseers
            </dt>
            <dd className="mt-0.5 font-display text-2xl font-semibold text-primary">
              {overseers.length}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          {overseers.length === 0 ? (
            <Chip tone="attention">No overseer yet</Chip>
          ) : (
            <p className="text-xs text-body">
              <span className="font-semibold text-ink">Overseers: </span>
              {overseers.map((overseer) => overseer.name).join(", ")}
            </p>
          )}

          {full && <Chip tone="attention">Full</Chip>}

          {group.withoutFamily > 0 && (
            <Chip tone="attention">
              {group.withoutFamily} without a family yet
            </Chip>
          )}
        </div>
      </Link>

      {group.canManage && onEdit && (
        <div className="border-t border-line bg-surface-muted/60 px-5 py-3">
          <button
            type="button"
            onClick={() => onEdit(group)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-body transition hover:text-primary"
          >
            <Pencil size={13} aria-hidden="true" />
            Edit small group
          </button>
        </div>
      )}
    </article>
  );
}