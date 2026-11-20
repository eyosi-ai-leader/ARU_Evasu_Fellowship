"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";

import { getRoleOptions } from "@/lib/memberApi";

/*
 * Roles are given together with the campus:
 *   campusMode "none"   Member, Super Admin (no campus to choose)
 *   campusMode "member" Main Leader (leads the campus the member belongs to)
 *   campusMode "one"    Fellowship Admin (exactly one campus)
 *   campusMode "many"   Staff (all campuses, or a chosen list)
 *
 * What the person may give comes from the server, so nobody sees a role
 * they cannot give.
 */
const ROLE_ORDER = [2, 6, 7, 1, 5];

const ROLE_DESCRIPTIONS = {
  2: "Leads the campus fellowship they belong to: members, ministries, small groups and announcements.",
  6: "Administers one campus fellowship: members, ministries, small groups and announcements.",
  7: "Full-time servant with full access to the campuses you choose.",
  1: "Manages every campus, all accounts, roles and staff access.",
  5: "Standard fellowship member access. Removes any leadership or admin access.",
};

const shortCampusName = (name) =>
  String(name || "").replace(/\s+Fellowship$/i, "");

export default function ChangeRoleModal({
  member,
  open,
  onClose,
  onConfirm,
  saving = false,
  error = "",
}) {
  const [options, setOptions] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");

  const [roleId, setRoleId] = useState("");
  const [campusId, setCampusId] = useState(""); // Fellowship Admin
  const [campusIds, setCampusIds] = useState([]); // Staff
  const [allCampuses, setAllCampuses] = useState(false); // Staff

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    setOptionsError("");

    try {
      setOptions(await getRoleOptions());
    } catch (err) {
      setOptionsError(err.message || "We couldn't load the roles.");
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadOptions();
  }, [open, loadOptions]);

  // Start from what the member is now.
  useEffect(() => {
    if (!open || !member) return;

    const ownCampus =
      member.fellowship_id !== undefined && member.fellowship_id !== null
        ? String(member.fellowship_id)
        : "";

    setRoleId(
      member.role_id !== undefined && member.role_id !== null
        ? String(member.role_id)
        : ""
    );
    setCampusId(ownCampus);
    setCampusIds(ownCampus ? [ownCampus] : []);
    setAllCampuses(false);
  }, [open, member]);

  if (!open || !member) {
    return null;
  }

  const fullName =
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    "Unnamed member";

  const roles = [...(options?.roles || [])].sort(
    (a, b) => ROLE_ORDER.indexOf(a.id) - ROLE_ORDER.indexOf(b.id)
  );

  const campuses = (options?.campuses || []).filter(
    (campus) => campus.type === "regular"
  );

  const selectedRole =
    roles.find((role) => String(role.id) === roleId) || null;

  const mode = selectedRole?.campusMode || "none";

  const unchanged =
    roleId === String(member.role_id) &&
    (mode === "none" || mode === "member");

  // What is still missing, in plain words.
  let problem = "";

  if (!selectedRole) {
    problem = "Choose a role.";
  } else if (mode === "member" && member.status !== "Active") {
    problem = "Activate this member first. Only an active member can lead.";
  } else if (mode === "member" && !member.fellowship_id) {
    problem = "This member has no campus yet.";
  } else if (mode === "one" && !campusId) {
    problem = "Choose the campus this person will administer.";
  } else if (mode === "many" && !allCampuses && campusIds.length === 0) {
    problem = 'Choose "All campuses" or at least one campus.';
  }

  const toggleCampus = (id) => {
    setCampusIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (problem || unchanged || !onConfirm) return;

    const payload = { roleId: Number(roleId) };

    if (mode === "member") {
      payload.fellowshipIds = [Number(member.fellowship_id)];
    }

    if (mode === "one") {
      payload.fellowshipIds = [Number(campusId)];
    }

    if (mode === "many") {
      if (allCampuses) {
        payload.allCampuses = true;
      } else {
        payload.fellowshipIds = campusIds.map(Number);
      }
    }

    await onConfirm(member, payload);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 px-0 py-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
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
              Change Role
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Role and campus for{" "}
              <span className="font-semibold text-slate-500">{fullName}</span>
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

        <form onSubmit={handleSubmit}>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5 sm:p-6">
            {loadingOptions && (
              <div
                role="status"
                className="flex items-center gap-2 text-sm text-slate-500"
              >
                <Loader2 size={16} className="animate-spin" />
                Loading roles...
              </div>
            )}

            {optionsError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
              >
                {optionsError}{" "}
                <button
                  type="button"
                  onClick={loadOptions}
                  className="font-semibold underline"
                >
                  Try again
                </button>
              </div>
            )}

            {!loadingOptions && !optionsError && (
              <>
                {/* Roles */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-700">
                    Role
                  </p>

                  <div className="space-y-2">
                    {roles.map((role) => {
                      const selected = roleId === String(role.id);

                      return (
                        <button
                          key={role.id}
                          type="button"
                          disabled={saving}
                          onClick={() => setRoleId(String(role.id))}
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
                                {role.label}
                              </span>

                              {selected && (
                                <Check
                                  size={15}
                                  className="shrink-0 text-slate-900"
                                />
                              )}
                            </span>

                            <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">
                              {ROLE_DESCRIPTIONS[role.id]}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Campus: what is asked depends on the role */}
                {mode === "member" && (
                  <div className="rounded-xl bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">
                    <p className="font-semibold text-slate-700">Campus</p>
                    <p>
                      {shortCampusName(member.fellowship_name) ||
                        "Not set"}{" "}
                      (the campus {fullName} belongs to). A Main Leader leads
                      their own campus. To lead another campus, move the
                      member there first.
                    </p>
                  </div>
                )}

                {mode === "one" && (
                  <fieldset>
                    <legend className="mb-2 text-xs font-semibold text-slate-700">
                      Campus to administer
                    </legend>

                    <div className="space-y-1.5">
                      {campuses.map((campus) => (
                        <label
                          key={campus.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <input
                            type="radio"
                            name="role-campus"
                            checked={campusId === String(campus.id)}
                            onChange={() => setCampusId(String(campus.id))}
                            disabled={saving}
                            className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-400"
                          />
                          {shortCampusName(campus.name)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                {mode === "many" && (
                  <fieldset>
                    <legend className="mb-2 text-xs font-semibold text-slate-700">
                      Campuses
                    </legend>

                    <div className="space-y-1.5">
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={allCampuses}
                          onChange={(event) =>
                            setAllCampuses(event.target.checked)
                          }
                          disabled={saving}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                        />
                        All campuses
                      </label>

                      {campuses.map((campus) => (
                        <label
                          key={campus.id}
                          className={`flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 ${
                            allCampuses
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              allCampuses ||
                              campusIds.includes(String(campus.id))
                            }
                            onChange={() => toggleCampus(String(campus.id))}
                            disabled={saving || allCampuses}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                          />
                          {shortCampusName(campus.name)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-4 text-slate-500">
                  Small group overseers and ministry leaders are appointed
                  from their small group or ministry, where you choose the
                  group or ministry. They don&apos;t change a person&apos;s
                  role.
                </p>

                {problem && selectedRole && !unchanged && (
                  <p className="text-xs font-medium text-amber-700">
                    {problem}
                  </p>
                )}
              </>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
              >
                {error}
              </div>
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
                loadingOptions ||
                Boolean(optionsError) ||
                Boolean(problem) ||
                unchanged
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
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