"use client";

import { Loader2, LogOut, Plus, Users } from "lucide-react";

import PersonMenu from "./PersonMenu";
import { Avatar, Chip } from "./parts";

/*
 * Members of this small group who are in none of its families.
 * A family is optional, so this is a reminder, not an error. Each person can
 * be placed in a family, moved to another small group, or removed.
 */
export default function UnassignedPanel({
  people = [],
  families = [],
  busyKey = "",
  disabled = false,
  onQuickAssign,
  onPersonAction,
}) {
  if (people.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">
        Members without a family yet ({people.length})
      </h2>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        They belong to this small group but are not in any of its families. A
        family is optional. Place them in a family, move them to another small
        group, or remove them from this one.
        {families.length === 0 ? " Create a family first to place them." : ""}
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

              {person.otherGroups && (
                <div className="mt-1">
                  <Chip tone="info">Also in {person.otherGroups}</Chip>
                </div>
              )}
            </div>

            {busyKey === `assign-${person.memberId}` ||
            busyKey === `remove-${person.memberId}` ? (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            ) : (
              <div className="flex items-center gap-1">
                <select
                  value=""
                  disabled={disabled || families.length === 0}
                  onChange={(event) =>
                    event.target.value &&
                    onQuickAssign(person, Number(event.target.value))
                  }
                  aria-label={`Add ${person.name} to a family as a child`}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-slate-400 disabled:opacity-50"
                >
                  <option value="">Add to family...</option>

                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>

                <PersonMenu
                  label={`Actions for ${person.name}`}
                  disabled={disabled}
                  items={[
                    {
                      key: "assign",
                      label: "Add to a family as father, mother or child...",
                      icon: Plus,
                      disabled: families.length === 0,
                      onClick: () => onPersonAction("assign", null, person),
                    },
                    {
                      key: "transfer",
                      label: "Move to another small group...",
                      icon: Users,
                      onClick: () => onPersonAction("transfer", null, person),
                    },
                    { key: "divider", divider: true },
                    {
                      key: "leave",
                      label: "Remove from this small group",
                      icon: LogOut,
                      danger: true,
                      onClick: () => onPersonAction("leave", null, person),
                    },
                  ]}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}