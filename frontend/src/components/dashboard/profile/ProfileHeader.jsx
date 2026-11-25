"use client";

import { CalendarDays, CheckCircle2, Hash, Pencil } from "lucide-react";

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
    <section className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line">
      <div className="px-5 pb-6 pt-6 sm:px-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
          <div className="shrink-0 rounded-full ring-4 ring-white">
            <UserAvatar user={profile} className="h-24 w-24 text-2xl sm:h-28 sm:w-28" />
          </div>

          <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
            <h2 className="truncate font-display text-2xl font-semibold tracking-tight text-ink">
              {fullName}
            </h2>

            <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-body sm:justify-start">
              {profile.memberNumber && (
                <span className="inline-flex items-center gap-1.5">
                  <Hash size={13} aria-hidden="true" className="text-primary/70" />
                  {profile.memberNumber}
                </span>
              )}

              {memberSince && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays
                    size={13}
                    aria-hidden="true"
                    className="text-primary/70"
                  />
                  Member since {memberSince}
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Pencil size={16} aria-hidden="true" />
            Edit profile
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          {profile.roleName && (
            <span className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white">
              {profile.roleName}
            </span>
          )}

          <CampusBadge variant="pill" />

          {positions.map((position) => (
            <span
              key={position}
              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              {position}
            </span>
          ))}

          {profile.status && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                active
                  ? "bg-success/10 text-success"
                  : "bg-surface-muted text-body ring-1 ring-line"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? "bg-success" : "bg-body/50"
                }`}
              />
              {profile.status}
            </span>
          )}
        </div>

        {/* Completeness */}
        <div className="mt-6 rounded-2xl bg-surface-muted px-4 py-4 ring-1 ring-line">
          {completeness.complete ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 size={17} aria-hidden="true" />
              Your profile is complete.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-base font-semibold text-ink">
                  Profile {completeness.percent}% complete
                </p>
                <p className="text-xs text-body">
                  Helps your leaders reach you
                </p>
              </div>

              <div
                role="progressbar"
                aria-valuenow={completeness.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile completeness"
                className="mt-3 h-2.5 overflow-hidden rounded-full bg-line"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-ember to-accent transition-all duration-500"
                  style={{ width: `${completeness.percent}%` }}
                />
              </div>

              <ul className="mt-3 flex flex-wrap gap-2">
                {completeness.missing.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={onEdit}
                      className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      + {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}