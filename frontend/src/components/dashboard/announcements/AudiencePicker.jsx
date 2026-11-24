"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  Globe2,
  HeartHandshake,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import MemberPicker from "./MemberPicker";
import { Pill, groupByCampus } from "./parts";

/*
 * The audience is the union of its parts:
 * { everyone, campusIds, ministryIds, smallGroupIds, members: [{id, name}] }
 */
export const emptyAudience = {
  everyone: false,
  campusIds: [],
  ministryIds: [],
  smallGroupIds: [],
  members: [],
};

export const audienceIsEmpty = (audience) =>
  !audience.everyone &&
  audience.campusIds.length === 0 &&
  audience.ministryIds.length === 0 &&
  audience.smallGroupIds.length === 0 &&
  audience.members.length === 0;

// What the server expects.
export const toAudiencePayload = (audience) => {
  if (audienceIsEmpty(audience)) return null;

  if (audience.everyone) return { everyone: true };

  return {
    campusIds: audience.campusIds,
    ministryIds: audience.ministryIds,
    smallGroupIds: audience.smallGroupIds,
    memberIds: audience.members.map((member) => member.id),
  };
};

function Section({ icon: Icon, title, hint, count, open, onToggle, children }) {
  return (
    <div className="rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon size={17} aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">
            {title}
          </span>
          <span className="block text-xs text-slate-500">{hint}</span>
        </span>

        {count > 0 && <Pill tone="info">{count} selected</Pill>}

        <ChevronDown
          size={17}
          aria-hidden="true"
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && <div className="border-t border-slate-100 p-4">{children}</div>}
    </div>
  );
}

function GroupedChecklist({ items, selectedIds, onChange, emptyText }) {
  const [term, setTerm] = useState("");

  const groups = useMemo(() => {
    const needle = term.trim().toLowerCase();

    return groupByCampus(
      items.filter((item) => !needle || item.name.toLowerCase().includes(needle))
    );
  }, [items, term]);

  const toggle = (id) =>
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((value) => value !== id)
        : [...selectedIds, id]
    );

  const setGroup = (ids, on) =>
    onChange(
      on
        ? [...new Set([...selectedIds, ...ids])]
        : selectedIds.filter((id) => !ids.includes(id))
    );

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="space-y-4">
      {items.length > 8 && (
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />

          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search"
            aria-label="Search the list"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
        </div>
      )}

      {groups.length === 0 && (
        <p className="text-sm text-slate-500">Nothing matches your search.</p>
      )}

      {groups.map(([label, list]) => {
        const ids = list.map((item) => item.id);
        const allOn = ids.every((id) => selectedIds.includes(id));

        return (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {label}
              </p>

              <button
                type="button"
                onClick={() => setGroup(ids, !allOn)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                {allOn ? "Clear" : "Select all"}
              </button>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2">
              {list.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 transition hover:bg-slate-50 has-[:checked]:border-slate-400 has-[:checked]:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggle(item.id)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />

                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                      {item.name}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Users size={12} aria-hidden="true" />
                      {item.memberCount}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function AudiencePicker({ options, value, onChange, delivery }) {
  const leaderOnly =
    !options.canSendToEveryone && options.campuses.length === 0;

  const [open, setOpen] = useState({
    campuses: false,
    ministries: leaderOnly && options.ministries.length > 0,
    groups: leaderOnly && options.smallGroups.length > 0,
    people: false,
  });

  const toggleSection = (key) =>
    setOpen((current) => ({ ...current, [key]: !current[key] }));

  const set = (patch) => onChange({ ...value, ...patch });

  const multiCampus =
    new Set(
      [...options.ministries, ...options.smallGroups].map(
        (item) => item.campusName
      )
    ).size > 1;

  const labelOf = (item) =>
    multiCampus && item.campusName ? `${item.name} · ${item.campusName}` : item.name;

  // The chips that say who this is for.
  const chips = [];

  if (value.everyone) {
    chips.push({
      key: "everyone",
      label: "Whole fellowship",
      remove: () => set({ everyone: false }),
    });
  } else {
    value.campusIds.forEach((id) => {
      const campus = options.campuses.find((item) => item.id === id);

      if (campus) {
        chips.push({
          key: `c${id}`,
          label: `${campus.name} (whole campus)`,
          remove: () =>
            set({ campusIds: value.campusIds.filter((item) => item !== id) }),
        });
      }
    });

    value.ministryIds.forEach((id) => {
      const ministry = options.ministries.find((item) => item.id === id);

      if (ministry) {
        chips.push({
          key: `m${id}`,
          label: labelOf(ministry),
          remove: () =>
            set({ ministryIds: value.ministryIds.filter((item) => item !== id) }),
        });
      }
    });

    value.smallGroupIds.forEach((id) => {
      const group = options.smallGroups.find((item) => item.id === id);

      if (group) {
        chips.push({
          key: `g${id}`,
          label: labelOf(group),
          remove: () =>
            set({
              smallGroupIds: value.smallGroupIds.filter((item) => item !== id),
            }),
        });
      }
    });

    if (value.members.length > 0) {
      chips.push({
        key: "people",
        label: `${value.members.length} ${
          value.members.length === 1 ? "person" : "people"
        }`,
        remove: () => set({ members: [] }),
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Who this is for */}
      <div
        aria-live="polite"
        className="min-h-[3.25rem] rounded-xl bg-slate-50 px-4 py-3"
      >
        {chips.length === 0 ? (
          <p className="text-sm text-slate-400">
            Choose who this is for. You can combine several choices.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li
                key={chip.key}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 py-1 pl-3 pr-1.5 text-xs font-semibold text-white"
              >
                {chip.label}

                <button
                  type="button"
                  onClick={chip.remove}
                  aria-label={`Remove ${chip.label}`}
                  className="rounded-full p-1 text-white/70 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {options.canSendToEveryone && (
        <label
          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition focus-within:ring-2 focus-within:ring-indigo-500 ${
            value.everyone
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 hover:bg-slate-50"
          }`}
        >
          <input
            type="checkbox"
            checked={value.everyone}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? { ...emptyAudience, everyone: true }
                  : emptyAudience
              )
            }
            className="sr-only"
          />

          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              value.everyone ? "bg-white/15" : "bg-slate-100 text-slate-600"
            }`}
          >
            <Globe2 size={17} aria-hidden="true" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">
              Whole fellowship
            </span>
            <span
              className={`block text-xs ${
                value.everyone ? "text-white/75" : "text-slate-500"
              }`}
            >
              Every active member of every campus.
            </span>
          </span>
        </label>
      )}

      {!value.everyone && (
        <div className="space-y-3">
          {options.campuses.length > 0 && (
            <Section
              icon={Building2}
              title="Whole campuses"
              hint="Everyone who belongs to a campus"
              count={value.campusIds.length}
              open={open.campuses}
              onToggle={() => toggleSection("campuses")}
            >
              <ul className="grid gap-2 sm:grid-cols-2">
                {options.campuses.map((campus) => (
                  <li key={campus.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 transition hover:bg-slate-50 has-[:checked]:border-slate-400 has-[:checked]:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={value.campusIds.includes(campus.id)}
                        onChange={() =>
                          set({
                            campusIds: value.campusIds.includes(campus.id)
                              ? value.campusIds.filter((id) => id !== campus.id)
                              : [...value.campusIds, campus.id],
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />

                      <span className="text-sm font-medium text-slate-800">
                        {campus.name}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {options.ministries.length > 0 && (
            <Section
              icon={HeartHandshake}
              title="Ministries"
              hint="Each campus has its own ministries"
              count={value.ministryIds.length}
              open={open.ministries}
              onToggle={() => toggleSection("ministries")}
            >
              <GroupedChecklist
                items={options.ministries}
                selectedIds={value.ministryIds}
                onChange={(ministryIds) => set({ ministryIds })}
                emptyText="There are no active ministries."
              />
            </Section>
          )}

          {options.smallGroups.length > 0 && (
            <Section
              icon={Users}
              title="Small groups"
              hint="The members of a small group"
              count={value.smallGroupIds.length}
              open={open.groups}
              onToggle={() => toggleSection("groups")}
            >
              <GroupedChecklist
                items={options.smallGroups}
                selectedIds={value.smallGroupIds}
                onChange={(smallGroupIds) => set({ smallGroupIds })}
                emptyText="There are no active small groups."
              />
            </Section>
          )}

          <Section
            icon={UserRound}
            title="Individual people"
            hint="Search and pick members one by one"
            count={value.members.length}
            open={open.people}
            onToggle={() => toggleSection("people")}
          >
            <MemberPicker
              selected={value.members}
              onChange={(members) => set({ members })}
              options={options}
              delivery={delivery}
              max={options.limits.maxPickedMembers}
            />
          </Section>
        </div>
      )}
    </div>
  );
}