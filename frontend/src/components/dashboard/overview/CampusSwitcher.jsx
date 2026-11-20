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
      className="flex flex-wrap items-center gap-2"
    >
      <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Building2 size={14} aria-hidden="true" />
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
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-wait disabled:opacity-60 ${
              active
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}