"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarClock,
  HeartHandshake,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";

import { Chip } from "@/components/dashboard/small-groups/parts";
import { coverGradient, optimizedImage, shortCampus } from "./ministryUtils";

export default function MinistryCard({
  ministry,
  showCampus = false,
  canManage = false,
  busy = false,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  const active = ministry.status === "Active";

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <Link
        href={`/dashboard/ministries/${ministry.id}`}
        className="block flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        {/* Cover */}
        <div className="relative h-36 overflow-hidden bg-ink">
          {ministry.imageUrl ? (
            <img
              src={optimizedImage(ministry.imageUrl, 800)}
              alt=""
              loading="lazy"
              className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                active ? "" : "grayscale"
              }`}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${coverGradient(
                ministry.name
              )}`}
            >
              <HeartHandshake
                size={44}
                className="text-white/30"
                aria-hidden="true"
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />

          {!active && (
            <span className="absolute right-3 top-3">
              <Chip>Inactive</Chip>
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="truncate font-display text-lg font-semibold text-white drop-shadow">
              {ministry.name}
            </h3>

            {(showCampus || ministry.isGeneral) && (
              <p className="mt-0.5 text-xs font-medium text-white/80">
                {ministry.isGeneral
                  ? "General Fellowship"
                  : shortCampus(ministry.fellowshipName)}
              </p>
            )}
          </div>
        </div>

        <div className="p-5">
          {(ministry.purpose || ministry.description) && (
            <p className="line-clamp-2 text-sm leading-6 text-body">
              {ministry.purpose || ministry.description}
            </p>
          )}

          <div className="mt-3 flex flex-col gap-1 text-xs text-body">
            {ministry.verseReference && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen
                  size={13}
                  aria-hidden="true"
                  className="text-primary/70"
                />
                {ministry.verseReference}
              </span>
            )}

            {ministry.meetingSchedule && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock
                  size={13}
                  aria-hidden="true"
                  className="text-primary/70"
                />
                {ministry.meetingSchedule}
              </span>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-body">
                Members
              </dt>
              <dd className="mt-0.5 font-display text-2xl font-semibold text-primary">
                {ministry.memberCount}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-body">
                Leaders
              </dt>
              <dd className="mt-0.5 font-display text-2xl font-semibold text-primary">
                {ministry.leaderCount}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            {ministry.leaderCount === 0 ? (
              <Chip tone="attention">No leader yet</Chip>
            ) : (
              <p className="text-xs text-body">
                <span className="font-semibold text-ink">
                  {ministry.leaderCount > 1 ? "Leaders: " : "Leader: "}
                </span>
                {ministry.leaderNames}
              </p>
            )}
          </div>
        </div>
      </Link>

      {canManage && (
        <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-muted/60 px-5 py-3">
          <button
            type="button"
            onClick={() => onEdit(ministry)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-body transition hover:text-primary"
          >
            <Pencil size={13} aria-hidden="true" />
            Edit
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus(ministry)}
            disabled={busy}
            className="inline-flex items-center gap-2 text-xs font-semibold text-body transition hover:text-ember disabled:opacity-50"
          >
            <Power size={13} aria-hidden="true" />
            {active ? "Deactivate" : "Activate"}
          </button>

          <button
            type="button"
            onClick={() => onDelete(ministry)}
            disabled={busy}
            className="inline-flex items-center gap-2 text-xs font-semibold text-body transition hover:text-danger disabled:opacity-50"
          >
            <Trash2 size={13} aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </article>
  );
}