"use client";

import Link from "next/link";
import { Loader2, Phone, Search, UserPlus, Users } from "lucide-react";

import PersonMenu from "@/components/dashboard/small-groups/PersonMenu";
import {
  Avatar,
  Chip,
  primaryButton,
} from "@/components/dashboard/small-groups/parts";

function PersonAvatar({ person }) {
  if (person.profileImage) {
    return (
      <img
        src={person.profileImage}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
      />
    );
  }

  return <Avatar name={person.name} className="h-10 w-10 text-xs" />;
}

export default function MinistryMembersPanel({
  people = [],
  total = 0,
  statusFilter,
  onStatusFilter,
  search,
  onSearch,
  canAdd = true,
  disabled = false,
  busyKey = "",
  linkToMember = false,
  onAdd,
  getItems,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Members</h2>

          <p className="mt-1 text-sm text-slate-500">
            Fellowship members can serve in several ministries.
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={disabled || !canAdd}
          className={primaryButton}
        >
          <UserPlus size={15} />
          Add members
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search members"
            aria-label="Search members"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => onStatusFilter(event.target.value)}
          aria-label="Show assignments"
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-slate-400"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="All">All</option>
        </select>

        <p className="text-xs text-slate-400 sm:ml-auto">
          {people.length} of {total} shown
        </p>
      </div>

      {people.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Users className="mx-auto text-slate-300" size={28} />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            {total === 0 ? "No members yet" : "No member matches your search"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {total === 0
              ? "Add the first members of this ministry."
              : "Try another search or filter."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {people.map((person) => {
            const items = getItems(person);
            const inactive = person.status !== "Active";

            return (
              <li
                key={person.key}
                className={`group relative rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  inactive
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={inactive ? "opacity-60" : ""}>
                    <PersonAvatar person={person} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {linkToMember ? (
                      <Link
                        href={`/dashboard/members/${person.memberId}`}
                        className="block truncate text-sm font-semibold text-slate-800 hover:text-indigo-600"
                      >
                        {person.name}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {person.name}
                      </p>
                    )}

                    {person.memberNumber && (
                      <p className="truncate text-xs text-slate-400">
                        {person.memberNumber}
                      </p>
                    )}
                  </div>

                  {busyKey === `member-${person.memberId}` ? (
                    <Loader2
                      size={16}
                      className="mt-2 animate-spin text-slate-400"
                    />
                  ) : (
                    <PersonMenu
                      items={items}
                      label={`Actions for ${person.name}`}
                      disabled={disabled}
                    />
                  )}
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  {person.email && (
                    <p className="truncate">{person.email}</p>
                  )}

                  {person.phone && (
                    <a
                      href={`tel:${person.phone}`}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <Phone size={11} aria-hidden="true" />
                      {person.phone}
                    </a>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Chip tone={inactive ? "neutral" : "good"}>
                    {inactive ? "Inactive" : "Active"}
                  </Chip>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
