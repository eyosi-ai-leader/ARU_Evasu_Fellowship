"use client";

import { useEffect, useMemo, useState } from "react";
import { HeartHandshake, Home, Search, Users } from "lucide-react";

import { getMyCircles } from "@/lib/myCircleApi";

const CONFIG = {
  "small-groups": {
    icon: Users,
    title: "My Small Group",
    subtitle: "The people in your small group",
    empty:
      "You are not yet in a small group. Your fellowship leaders will place you in one soon.",
  },
  families: {
    icon: Home,
    title: "My Family",
    subtitle: "The people in your family",
    empty:
      "You have not been placed in a family yet. Your small group overseer will connect you when it is time.",
  },
  ministries: {
    icon: HeartHandshake,
    title: "My Ministry",
    subtitle: "The people you serve with",
    empty: "You have not joined a ministry yet.",
  },
};

const LEADER_ROLES = ["Overseer", "Leader", "Father", "Mother"];

const initials = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

function Avatar({ person }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-600">
      {person.profileImage ? (
        <img
          src={person.profileImage}
          alt={person.name}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(person.name)
      )}
    </span>
  );
}

function PersonCard({ person }) {
  const leader = LEADER_ROLES.includes(person.role);

  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <Avatar person={person} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {person.name}
          {person.isMe && (
            <span className="ml-2 text-xs font-medium text-slate-400">
              (You)
            </span>
          )}
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-500">
          {person.extra || person.role}
        </p>

        {person.phone && (
          <a
            href={`tel:${person.phone}`}
            className="mt-0.5 block truncate text-xs text-indigo-600 hover:underline"
          >
            {person.phone}
          </a>
        )}
      </div>

      {leader && (
        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
          {person.role}
        </span>
      )}
    </li>
  );
}

export default function MyCirclePage({ type }) {
  const config = CONFIG[type];
  const Icon = config.icon;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    getMyCircles(type)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load this page.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type]);

  const current = items[active] ?? null;

  const people = useMemo(() => {
    if (!current) return [];

    const term = search.trim().toLowerCase();

    if (!term) return current.members;

    return current.members.filter((person) =>
      `${person.name} ${person.role} ${person.extra || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [current, search]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
          </span>

          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {config.title}
            </h1>
            <p className="text-sm text-slate-500">{config.subtitle}</p>
          </div>
        </div>

        {items.length > 1 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActive(index);
                  setSearch("");
                }}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  index === active
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {loading && (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && !current && (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          {config.empty}
        </p>
      )}

      {!loading && !error && current && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900">
                {current.name}
              </h2>

              {current.subtitle && (
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {current.subtitle}
                </p>
              )}
            </div>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {current.memberCount}{" "}
              {current.memberCount === 1 ? "member" : "members"}
            </span>
          </div>

          <div className="relative mt-5">
            <Search
              size={16}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or role"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-600"
            />
          </div>

          {people.length > 0 ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {people.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No one matches your search.</p>
          )}
        </section>
      )}
    </div>
  );
}