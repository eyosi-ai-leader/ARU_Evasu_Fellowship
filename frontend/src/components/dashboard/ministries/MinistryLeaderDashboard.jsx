"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarClock, HeartHandshake } from "lucide-react";

import { getMyMinistries } from "@/lib/ministryApi";
import { Chip } from "@/components/dashboard/small-groups/parts";

import {
  coverGradient,
  normalizeMinistry,
  optimizedImage,
} from "./ministryUtils";

export default function MinistryLeaderDashboard() {
  const [ministries, setMinistries] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getMyMinistries()
      .then((response) => {
        if (!cancelled) {
          setMinistries(
            (Array.isArray(response?.data) ? response.data : []).map(
              normalizeMinistry
            )
          );
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load your ministries.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      aria-label="My ministries"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">My ministries</h2>

          <p className="mt-1 text-sm text-slate-500">
            The ministries you lead and the people who serve in them.
          </p>
        </div>

        <Link
          href="/dashboard/ministries"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Manage
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {!ministries && !error && (
        <div className="mt-5 h-28 animate-pulse rounded-xl bg-slate-100" />
      )}

      {ministries && ministries.length === 0 && (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          You do not currently lead an active ministry.
        </p>
      )}

      {ministries && ministries.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ministries.map((ministry) => (
            <Link
              key={ministry.id}
              href="/dashboard/ministries"
              className="group block overflow-hidden rounded-xl border border-slate-100 bg-slate-50 transition hover:border-slate-200 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="relative h-20 overflow-hidden bg-slate-900">
                {ministry.imageUrl ? (
                  <img
                    src={optimizedImage(ministry.imageUrl, 600)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className={`h-full w-full bg-gradient-to-br ${coverGradient(
                      ministry.name
                    )}`}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
              </div>

              <div className="p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <HeartHandshake size={16} aria-hidden="true" />
                </span>

                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">
                    {ministry.name}
                  </h3>

                  {(ministry.purpose || ministry.description) && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                      {ministry.purpose || ministry.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                {ministry.verseReference && (
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen size={12} aria-hidden="true" />
                    {ministry.verseReference}
                  </span>
                )}

                {ministry.meetingSchedule && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock size={12} aria-hidden="true" />
                    {ministry.meetingSchedule}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Chip tone="info">{ministry.memberCount} members</Chip>
                <Chip>{ministry.leaderCount} leaders</Chip>
              </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
