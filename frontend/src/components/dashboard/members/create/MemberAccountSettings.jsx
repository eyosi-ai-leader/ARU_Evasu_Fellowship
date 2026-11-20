"use client";

import { Info, Mail } from "lucide-react";

import { Field, ReadOnlyBox, Section, fieldClass } from "./FormParts";

/*
 * Role, status and (when adding) the sign-in invitation.
 * Replaces MemberChurchInfo.
 */
export default function MemberAccountSettings({
  form,
  errors = {},
  onChange,
  roleOptions = [],
  roleLocked = false,
  roleLockedReason = "",
  roleHelp = "",
  memberNumber = "",
  showInvitation = true,
}) {
  const active = form.status === "Active";

  return (
    <Section
      title="Role & Account"
      description={
        showInvitation
          ? "Role, status and the sign-in invitation."
          : "Role and status of this member."
      }
    >
      <div
        className={`grid gap-5 md:grid-cols-2 ${
          memberNumber ? "lg:grid-cols-3" : ""
        }`}
      >
        {memberNumber && (
          <Field id="memberNumber" label="Member number">
            <ReadOnlyBox mono>{memberNumber}</ReadOnlyBox>
          </Field>
        )}

        <Field
          id="roleId"
          label="Role"
          required
          error={errors.roleId}
          help={roleLocked ? roleLockedReason : roleHelp || undefined}
        >
          <select
            id="roleId"
            name="roleId"
            value={form.roleId}
            onChange={onChange}
            disabled={roleLocked}
            aria-invalid={Boolean(errors.roleId)}
            className={fieldClass(errors.roleId)}
          >
            <option value="">Select role</option>

            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id="status" label="Status">
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={onChange}
            className={fieldClass(false)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </Field>
      </div>

      {showInvitation && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label
            className={`flex items-start gap-3 ${
              active ? "cursor-pointer" : "cursor-not-allowed opacity-70"
            }`}
          >
            <input
              type="checkbox"
              checked={active && Boolean(form.sendInvitation)}
              onChange={(event) =>
                onChange({
                  target: {
                    name: "sendInvitation",
                    value: event.target.checked,
                  },
                })
              }
              disabled={!active}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />

            <span>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Mail size={15} aria-hidden="true" />
                Send an invitation email now
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                {active
                  ? "The member gets a personal link to choose their own password and sign in. The link works once and expires after 48 hours."
                  : "Invitations are only sent to active members."}
              </span>
            </span>
          </label>

          {active && !form.sendInvitation && (
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-amber-700">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              Without an invitation this person can&apos;t sign in yet. You
              can send one later from Member Access, or from the Access column
              in the members list.
            </p>
          )}
        </div>
      )}
    </Section>
  );
}