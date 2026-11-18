"use client";

import { useState } from "react";

import { Search, SlidersHorizontal, X } from "lucide-react";

import { ROLES, ROLE_NAMES } from "@/lib/roles";
import { getBatchOptions, getYearOptions } from "@/lib/studentBatch";

const ROLE_FILTER_ORDER = [
  ROLES.ADMIN,
  ROLES.FELLOWSHIP_ADMIN,
  ROLES.STAFF,
  ROLES.PASTOR,
  ROLES.SMALL_GROUP_LEADER,
  ROLES.MINISTRY_LEADER,
  ROLES.MEMBER,
];

const selectClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-auto";

// "Main Campus Fellowship" -> "Main Campus"
const shortCampusName = (name) =>
  String(name || "").replace(/\s+Fellowship$/i, "");

export default function MemberFilters({
  filters,
  onSearch,
  onStatusChange,
  onRoleChange,
  onCampusChange,
  onDepartmentChange,
  onBatchChange,
  onClear,
  hasFilters,
  campuses = [],
  departments = [],
  hideRoleFilter = false,
  hideBatchFilter = false,
}) {
  // Phones: the filters are folded away until the person taps "Filters".
  const [open, setOpen] = useState(false);

  const showCampus = campuses.length > 1;
  const showDepartment = departments.length > 0;

  const activeCount = [
    filters.status,
    filters.roleId,
    filters.fellowshipId,
    filters.departmentId,
    filters.batch,
  ].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        {/* Search (wide) */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={filters.search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Search by name, email, phone, student ID..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className="relative inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:hidden"
            >
              <SlidersHorizontal size={15} />

              <span>Filters</span>

              {activeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Controls */}
        <div
          className={`${
            open ? "grid" : "hidden"
          } grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center`}
        >
          {/* Status */}
          <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
            <SlidersHorizontal
              size={15}
              className="hidden shrink-0 text-slate-400 sm:block"
            />

            <select
              value={filters.status}
              onChange={(event) =>
                onStatusChange(event.target.value)
              }
              aria-label="Status"
              className="w-full bg-transparent text-sm font-medium text-slate-600 outline-none"
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Campus (only for people who manage more than one) */}
          {showCampus && (
            <select
              value={filters.fellowshipId}
              onChange={(event) =>
                onCampusChange(event.target.value)
              }
              aria-label="Campus"
              className={selectClass}
            >
              <option value="">All campuses</option>

              {campuses.map((campus) => (
                <option key={campus.id} value={String(campus.id)}>
                  {shortCampusName(campus.name)}
                </option>
              ))}
            </select>
          )}

          {/* Department (after a campus is known) */}
          {showDepartment && (
            <select
              value={filters.departmentId}
              onChange={(event) =>
                onDepartmentChange(event.target.value)
              }
              aria-label="Department"
              className={selectClass}
            >
              <option value="">All departments</option>

              {departments.map((department) => (
                <option
                  key={department.id}
                  value={String(department.id)}
                >
                  {department.name}
                </option>
              ))}
            </select>
          )}

          {/* Year of study or batch (the year they started, E.C.) */}
          {!hideBatchFilter && (
            <select
              value={filters.batch}
              onChange={(event) => onBatchChange(event.target.value)}
              aria-label="Year or batch"
              className={selectClass}
            >
              <option value="">All years &amp; batches</option>

              <optgroup label="Year of study">
                {getYearOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>

              <optgroup label="Batch (year started, E.C.)">
                {getBatchOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            </select>
          )}

          {/* Role */}
          {!hideRoleFilter && (
            <select
              value={filters.roleId}
              onChange={(event) =>
                onRoleChange(event.target.value)
              }
              aria-label="Role"
              className={selectClass}
            >
              <option value="">All roles</option>

              {ROLE_FILTER_ORDER.map((roleId) => (
                <option key={roleId} value={String(roleId)}>
                  {ROLE_NAMES[roleId]}
                </option>
              ))}
            </select>
          )}

          {/* Clear */}
          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:col-span-1"
            >
              <X size={15} />

              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}