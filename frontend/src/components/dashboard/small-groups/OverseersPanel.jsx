"use client";

import { Loader2, Plus, X } from "lucide-react";

import { Avatar, secondaryButton } from "./parts";

export default function OverseersPanel({
  overseers = [],
  canManage,
  busyId = null,
  disabled = false,
  onAdd,
  onRemove,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Overseers</h2>

          <p className="mt-1 text-sm text-slate-500">
            The people who look after the families of this small group.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={onAdd}
            disabled={disabled}
            className={secondaryButton}
          >
            <Plus size={14} />
            Add overseer
          </button>
        )}
      </div>

      {overseers.length === 0 ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This small group has no overseer yet.
          {canManage ? " Add one so someone can look after its families." : ""}
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {overseers.map((overseer) => (
            <li
              key={overseer.memberId}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-1.5 pr-3"
            >
              <Avatar name={overseer.name} className="h-7 w-7 text-[10px]" />

              <span className="text-sm font-medium text-slate-700">
                {overseer.name}
              </span>

              {canManage && (
                <button
                  type="button"
                  onClick={() => onRemove(overseer)}
                  disabled={disabled || busyId === overseer.memberId}
                  aria-label={`Remove ${overseer.name} as overseer`}
                  className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {busyId === overseer.memberId ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <X size={13} />
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}