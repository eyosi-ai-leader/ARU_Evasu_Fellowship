"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";

import { ROLES, ROLE_NAMES } from "@/lib/roles";

/*
 * Every role, with what it means in the fellowship.
 * Order: the roles anyone who manages members can give first, then the
 * three that only a Super Admin can give.
 */
const ROLE_OPTIONS = [
  {
    id: ROLES.PASTOR,
    description:
      "Leads a campus fellowship and manages its members and announcements.",
  },
  {
    id: ROLES.SMALL_GROUP_LEADER,
    description:
      "Leads a small group (family or Bible study group) and sees only that group's members.",
  },
  {
    id: ROLES.MINISTRY_LEADER,
    description:
      "Leads a ministry and manages its members.",
  },
  {
    id: ROLES.MEMBER,
    description:
      "Standard fellowship member access.",
  },
  {
    id: ROLES.FELLOWSHIP_ADMIN,
    description:
      "Administers one campus fellowship: members, ministries, small groups and announcements.",
    superAdminOnly: true,
  },
  {
    id: ROLES.STAFF,
    description:
      "Full-time servant with full access to the fellowships assigned to them.",
    superAdminOnly: true,
  },
  {
    id: ROLES.ADMIN,
    description:
      "Manages every fellowship, all accounts, roles and staff access.",
    superAdminOnly: true,
  },
];

export default function ChangeRoleModal({
  member,
  open,
  onClose,
  onConfirm,
  saving = false,
  // The role ids this person may give. Others are not shown.
  assignableRoleIds = [
    ROLES.PASTOR,
    ROLES.SMALL_GROUP_LEADER,
    ROLES.MINISTRY_LEADER,
    ROLES.MEMBER,
  ],
}) {
  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    if (member) {
      const currentRole =
        member.role_id !== undefined &&
        member.role_id !== null
          ? String(member.role_id)
          : "";

      setRoleId(currentRole);
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

  const options = ROLE_OPTIONS.filter((role) =>
    assignableRoleIds.includes(role.id)
  );

  const selectedIsAccessRole =
    Number(roleId) === ROLES.FELLOWSHIP_ADMIN ||
    Number(roleId) === ROLES.STAFF;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!roleId || !onConfirm) {
      return;
    }

    await onConfirm(
      member,
      Number(roleId)
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 px-0 py-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
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
        className="w-full max-w-md overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-role-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="change-role-title"
              className="text-sm font-bold text-slate-900"
            >
              Change Member Role
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Update the system role for{" "}
              <span className="font-semibold text-slate-500">
                {fullName}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[55vh] space-y-3 overflow-y-auto p-5 sm:p-6">
            <label className="block text-xs font-semibold text-slate-700">
              Member Role
            </label>

            <div className="space-y-2">
              {options.map((role) => {
                const selected =
                  roleId === String(role.id);

                return (
                  <button
                    key={role.id}
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      setRoleId(
                        String(role.id)
                      )
                    }
                    aria-pressed={selected}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-slate-400 bg-slate-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        selected
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <ShieldCheck size={15} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800">
                          {ROLE_NAMES[role.id]}
                        </span>

                        {selected && (
                          <Check
                            size={15}
                            className="shrink-0 text-slate-900"
                          />
                        )}
                      </span>

                      <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">
                        {role.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedIsAccessRole && (
              <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-4 text-slate-500">
                This person will manage{" "}
                <span className="font-semibold text-slate-700">
                  {member.fellowship_name || "their campus"}
                </span>
                . More campuses can be added to their access later.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                !roleId ||
                roleId ===
                  String(
                    member.role_id
                  )
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
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
                  Update Role
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}