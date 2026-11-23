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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        href={`/dashboard/ministries/${ministry.id}`}
        className="block flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      >
        {/* Cover */}
        <div className="relative h-36 overflow-hidden bg-slate-900">
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

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

          {!active && (
            <span className="absolute right-3 top-3">
              <Chip>Inactive</Chip>
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="truncate text-base font-bold text-white drop-shadow">
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
            <p className="line-clamp-2 text-sm text-slate-500">
              {ministry.purpose || ministry.description}
            </p>
          )}

          <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500">
            {ministry.verseReference && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen size={13} aria-hidden="true" />
                {ministry.verseReference}
              </span>
            )}

            {ministry.meetingSchedule && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock size={13} aria-hidden="true" />
                {ministry.meetingSchedule}
              </span>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Members
              </dt>
              <dd className="mt-0.5 text-xl font-bold text-slate-900">
                {ministry.memberCount}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Leaders
              </dt>
              <dd className="mt-0.5 text-xl font-bold text-slate-900">
                {ministry.leaderCount}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            {ministry.leaderCount === 0 ? (
              <Chip tone="attention">No leader yet</Chip>
            ) : (
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-600">
                  {ministry.leaderCount > 1 ? "Leaders: " : "Leader: "}
                </span>
                {ministry.leaderNames}
              </p>
            )}
          </div>
        </div>
      </Link>

      {canManage && (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={() => onEdit(ministry)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <Pencil size={13} aria-hidden="true" />
            Edit
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus(ministry)}
            disabled={busy}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-amber-700 disabled:opacity-50"
          >
            <Power size={13} aria-hidden="true" />
            {active ? "Deactivate" : "Activate"}
          </button>

          <button
            type="button"
            onClick={() => onDelete(ministry)}
            disabled={busy}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={13} aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </article>
  );
}
