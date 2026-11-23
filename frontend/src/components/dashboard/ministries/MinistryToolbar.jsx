import { Plus, Search } from "lucide-react";

import {
  primaryButton,
} from "@/components/dashboard/small-groups/parts";

import { campusLabel } from "./ministryUtils";

const selectClass =
  "h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

export default function MinistryToolbar({
  search,
  onSearch,
  status,
  onStatus,
  campusId = "",
  onCampus,
  campuses = [],
  onCreate,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search ministries..."
            aria-label="Search ministries"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
          />
        </div>

        {campuses.length > 1 && (
          <select
            value={campusId}
            onChange={(event) => onCampus(event.target.value)}
            aria-label="Campus"
            className={selectClass}
          >
            <option value="">All campuses and General Fellowship</option>

            {campuses.map((campus) => (
              <option key={campus.id} value={String(campus.id)}>
                {campusLabel(campus)}
              </option>
            ))}
          </select>
        )}

        <select
          value={status}
          onChange={(event) => onStatus(event.target.value)}
          aria-label="Status"
          className={selectClass}
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <button type="button" onClick={onCreate} className={primaryButton}>
        <Plus size={16} />
        New ministry
      </button>
    </div>
  );
}