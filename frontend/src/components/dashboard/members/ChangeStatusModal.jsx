"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Loader2,
  UserRoundCheck,
  X,
} from "lucide-react";

const statuses = [
  {
    value: "Active",
    label: "Active",
    description:
      "Member is currently active in the fellowship.",
  },
  {
    value: "Inactive",
    label: "Inactive",
    description:
      "Member is currently inactive in the fellowship.",
  },
];

export default function ChangeStatusModal({
  member,
  open,
  onClose,
  onConfirm,
  saving = false,
}) {
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    if (member) {
      setStatus(
        member.status || "Active"
      );
    }
  }, [member]);

  if (!open || !member) {
    return null;
  }

  const firstName =
    member.first_name ||
    member.firstName ||
    "";

  const lastName =
    member.last_name ||
    member.lastName ||
    "";

  const fullName =
    `${firstName} ${lastName}`.trim() ||
    "Unnamed member";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!onConfirm) {
      return;
    }

    await onConfirm(
      member,
      status
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/50 px-0 py-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose?.();
        }
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-soft sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-status-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRoundCheck size={20} />
            </span>

            <div>
              <h2
                id="change-status-title"
                className="font-display text-lg font-semibold text-ink"
              >
                Change Member Status
              </h2>

              <p className="mt-1 text-xs text-body">
                Update the membership status for{" "}
                <span className="font-semibold text-ink">
                  {fullName}
                </span>
                .
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-body transition hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 p-5 sm:p-6">
            <label className="block text-xs font-semibold text-ink">
              Membership Status
            </label>

            <div className="space-y-2">
              {statuses.map((item) => {
                const selected =
                  status === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      setStatus(item.value)
                    }
                    aria-pressed={selected}
                    className={`flex w-full items-start gap-3 rounded-2xl p-3.5 text-left transition ${
                      selected
                        ? "bg-primary/[0.04] ring-2 ring-primary"
                        : "bg-white ring-1 ring-line hover:ring-primary/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-primary bg-primary"
                          : "border-line bg-white"
                      }`}
                    >
                      {selected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>

                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-ink">
                        {item.label}
                      </span>

                      <span className="mt-0.5 block text-[11px] leading-4 text-body">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-muted/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-xs font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                status ===
                  (member.status ||
                    "Active")
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-white transition hover:bg-primary-dark active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
            >
              {saving ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  Updating...
                </>
              ) : (
                <>
                  <Check size={15} />
                  Update Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}