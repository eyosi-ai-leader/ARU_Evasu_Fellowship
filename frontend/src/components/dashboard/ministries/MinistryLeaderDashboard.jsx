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
      className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="h-0.5 w-5 rounded-full bg-accent" />
            Serving
          </p>

          <h2 className="mt-1 font-display text-lg font-semibold text-ink">
            My ministries
          </h2>

          <p className="mt-1 text-sm text-body">
            The ministries you lead and the people who serve in them.
          </p>
        </div>

        <Link
          href="/dashboard/ministries"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 hover:text-primary-dark active:scale-[0.97]"
        >
          Manage
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      {!ministries && !error && (
        <div className="mt-5 h-28 animate-pulse rounded-2xl bg-surface-muted" />
      )}

      {ministries && ministries.length === 0 && (
        <p className="mt-5 rounded-2xl border border-dashed border-line bg-surface-muted px-4 py-6 text-center text-sm text-body">
          You do not currently lead an active ministry.
        </p>
      )}

      {ministries && ministries.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ministries.map((ministry) => (
            <Link
              key={ministry.id}
              href="/dashboard/ministries"
              className="group block overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line transition duration-300 hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="relative h-20 overflow-hidden bg-primary-dark">
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

                <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
              </div>

              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <HeartHandshake size={16} aria-hidden="true" />
                  </span>

                  <div className="min-w-0">
                    <h3 className="truncate font-display font-semibold text-ink">
                      {ministry.name}
                    </h3>

                    {(ministry.purpose || ministry.description) && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-body">
                        {ministry.purpose || ministry.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-body">
                  {ministry.verseReference && (
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen size={12} className="text-primary" aria-hidden="true" />
                      {ministry.verseReference}
                    </span>
                  )}

                  {ministry.meetingSchedule && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock size={12} className="text-primary" aria-hidden="true" />
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