"use client";

import { Loader2 } from "lucide-react";

import { Avatar } from "./parts";

/*
 * People who are in this small group but not in a family yet.
 * Choosing a family adds them to it as a child.
 */
export default function UnassignedPanel({
  people = [],
  families = [],
  busyKey = "",
  disabled = false,
  onAssign,
}) {
  if (people.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">
        Not yet in a family ({people.length})
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        These members belong to this small group and still need a family.
        {families.length === 0 ? " Create a family first." : ""}
      </p>

      <ul className="mt-4 space-y-2">
        {people.map((person) => (
          <li
            key={person.memberId}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-100 bg-white p-3"
          >
            <Avatar name={person.name} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {person.name}
              </p>

              <p className="truncate text-xs text-slate-400">
                {[person.memberNumber, person.department, person.phone]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            {busyKey === `assign-${person.memberId}` ? (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            ) : (
              <select
                value=""
                disabled={disabled || families.length === 0}
                onChange={(event) =>
                  event.target.value &&
                  onAssign(person, Number(event.target.value))
                }
                aria-label={`Add ${person.name} to a family`}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-slate-400 disabled:opacity-50"
              >
                <option value="">Add to family...</option>

                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}