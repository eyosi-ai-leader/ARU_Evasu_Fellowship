"use client";

import { Building2 } from "lucide-react";

export default function CampusSwitcher({
  campuses = [],
  selectedId = null,
  onChange,
  disabled = false,
}) {
  // One campus (or none): nothing to switch, nothing to show.
  if (campuses.length < 2) return null;

  const options = [{ id: null, name: "All campuses" }, ...campuses];

  return (
    <div
      role="group"
      aria-label="Choose a campus"
      className="flex flex-wrap items-center gap-2 rounded-3xl bg-white p-3 shadow-card ring-1 ring-line sm:px-4"
    >
      <span className="mr-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 size={15} aria-hidden="true" />
        </span>
        Campus
      </span>

      {options.map((option) => {
        const active = (option.id ?? null) === (selectedId ?? null);

        return (
          <button
            key={option.id ?? "all"}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange?.(option.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-wait disabled:opacity-60 ${
              active
                ? "bg-primary text-white shadow-card"
                : "bg-white text-ink ring-1 ring-line hover:text-primary hover:ring-primary/40"
            }`}
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}