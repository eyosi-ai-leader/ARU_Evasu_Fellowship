"use client";

import { CheckCircle2, Hash, Pencil, CalendarDays } from "lucide-react";

import UserAvatar from "@/components/shared/Avatar/UserAvatar";
import { useAccess } from "@/components/dashboard/access/AccessProvider";
import CampusBadge from "@/components/dashboard/access/CampusBadge";
import { getProfileCompleteness } from "./profileCompleteness";
import { formatMonth } from "./profileFormat";

export default function ProfileHeader({ profile, onEdit }) {
  const { access } = useAccess();

  const fullName = [profile.firstName, profile.middleName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  const active = profile.status === "Active";
  const memberSince = formatMonth(profile.createdAt);
  const completeness = getProfileCompleteness(profile);

  // Positions held next to the role, for example a member who leads a ministry.
  const positions = [
    ...(access?.positions?.smallGroups?.length > 0
      ? ["Small group overseer"]
      : []),
    ...(access?.positions?.ministriesLed?.length > 0
      ? ["Ministry leader"]
      : []),
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <UserAvatar
            user={profile}
            className="h-24 w-24 text-2xl ring-1 ring-slate-200"
          />

          <div className="min-w-0 text-center sm:text-left">
            <h2 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {fullName}
            </h2>

            <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-slate-500 sm:justify-start">
              {profile.memberNumber && (
                <span className="inline-flex items-center gap-1.5">
                  <Hash size={13} aria-hidden="true" />
                  {profile.memberNumber}
                </span>
              )}

              {memberSince && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={13} aria-hidden="true" />
                  Member since {memberSince}
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          <Pencil size={16} aria-hidden="true" />
          Edit profile
        </button>
      </div>

      {/* Role, campus, status */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        {profile.roleName && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {profile.roleName}
          </span>
        )}

        <CampusBadge variant="pill" />

        {positions.map((position) => (
          <span
            key={position}
            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            {position}
          </span>
        ))}

        {profile.status && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                active ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            {profile.status}
          </span>
        )}
      </div>

      {/* Completeness */}
      <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
        {completeness.complete ? (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={17} aria-hidden="true" />
            Your profile is complete.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">
                Profile {completeness.percent}% complete
              </p>
              <p className="text-xs text-slate-400">
                Helps your leaders reach you
              </p>
            </div>

            <div
              role="progressbar"
              aria-valuenow={completeness.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completeness"
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
            >
              <div
                className="h-full rounded-full bg-slate-900 transition-all"
                style={{ width: `${completeness.percent}%` }}
              />
            </div>

            <ul className="mt-3 flex flex-wrap gap-2">
              {completeness.missing.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  >
                    + {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}