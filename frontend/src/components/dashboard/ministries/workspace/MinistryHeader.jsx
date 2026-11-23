"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Download,
  HeartHandshake,
  MapPin,
  Pencil,
  Phone,
  Power,
  Printer,
  Trash2,
} from "lucide-react";

import {
  Chip,
  secondaryButton,
} from "@/components/dashboard/small-groups/parts";
import { coverGradient, optimizedImage, shortCampus } from "../ministryUtils";

export default function MinistryHeader({
  ministry,
  backHref = "",
  canToggleStatus = false,
  canDelete = false,
  busy = false,
  canExport = true,
  onEdit,
  onToggleStatus,
  onDelete,
  onExport,
  onPrint,
}) {
  const active = ministry.status === "Active";

  return (
    <div>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          All ministries
        </Link>
      )}

      {/* Cover: the ministry image sits behind its name and details */}
      <section className="relative mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-sm">
        {ministry.imageUrl ? (
          <img
            src={optimizedImage(ministry.imageUrl, 1600)}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${
              active ? "" : "grayscale"
            }`}
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${coverGradient(
              ministry.name
            )}`}
          >
            <HeartHandshake
              size={150}
              className="absolute -right-6 -top-6 text-white/10"
              aria-hidden="true"
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-950/25" />

        <div className="relative flex min-h-[260px] flex-col justify-between gap-8 p-5 sm:p-8">
          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-2">
            {canExport && (
              <>
                <button type="button" onClick={onExport} className={secondaryButton}>
                  <Download size={14} />
                  Export
                </button>

                <button type="button" onClick={onPrint} className={secondaryButton}>
                  <Printer size={14} />
                  Print
                </button>
              </>
            )}

            <button type="button" onClick={onEdit} className={secondaryButton}>
              <Pencil size={14} />
              Edit
            </button>

            {canToggleStatus && (
              <button
                type="button"
                onClick={onToggleStatus}
                disabled={busy}
                className={secondaryButton}
              >
                <Power size={14} />
                {active ? "Deactivate" : "Activate"}
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={busy}
                className={`${secondaryButton} !border-red-200 !text-red-600 hover:!bg-red-50`}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight drop-shadow sm:text-3xl">
                {ministry.name}
              </h1>

              <Chip>
                {ministry.isGeneral
                  ? "General Fellowship"
                  : shortCampus(ministry.fellowshipName) || "Ministry"}
              </Chip>

              {!active && <Chip tone="attention">Inactive</Chip>}
            </div>

            {ministry.purpose && (
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/90">
                {ministry.purpose}
              </p>
            )}

            {ministry.verseReference && (
              <figure className="mt-4 max-w-2xl rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                {ministry.verseText && (
                  <blockquote className="text-sm italic leading-6 text-white/90">
                    &ldquo;{ministry.verseText}&rdquo;
                  </blockquote>
                )}

                <figcaption className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-200">
                  <BookOpen size={13} aria-hidden="true" />
                  {ministry.verseReference}
                </figcaption>
              </figure>
            )}

            {ministry.description && (
              <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-white/80">
                {ministry.description}
              </p>
            )}

            {(ministry.meetingSchedule ||
              ministry.meetingPlace ||
              ministry.contactPhone) && (
              <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/80">
                {ministry.meetingSchedule && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock size={13} aria-hidden="true" />
                    {ministry.meetingSchedule}
                  </span>
                )}

                {ministry.meetingPlace && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} aria-hidden="true" />
                    {ministry.meetingPlace}
                  </span>
                )}

                {ministry.contactPhone && (
                  <a
                    href={`tel:${ministry.contactPhone}`}
                    className="inline-flex items-center gap-1.5 hover:text-white"
                  >
                    <Phone size={13} aria-hidden="true" />
                    {ministry.contactPhone}
                  </a>
                )}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
