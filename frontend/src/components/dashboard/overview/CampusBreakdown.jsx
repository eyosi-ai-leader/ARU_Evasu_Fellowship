"use client";

import { Building2 } from "lucide-react";

export default function CampusBreakdown({ campuses = [] }) {
  if (campuses.length < 2) return null;

  const max = Math.max(...campuses.map((campus) => campus.total), 1);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 size={19} aria-hidden="true" />
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Members by campus
          </h2>

          <p className="mt-1 text-sm leading-6 text-body">
            How the members are spread across the campuses you manage.
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {campuses.map((campus) => (
          <li
            key={campus.id}
            className="rounded-2xl p-3 transition hover:bg-surface-muted/70"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-ink">
                {campus.name}
              </p>

              <p className="shrink-0 text-xs text-body">
                <span className="font-display text-base font-semibold text-primary">
                  {campus.active}
                </span>{" "}
                active of {campus.total}
              </p>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface-muted ring-1 ring-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-ember transition-all duration-500"
                style={{
                  width: `${Math.max((campus.total / max) * 100, 2)}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}