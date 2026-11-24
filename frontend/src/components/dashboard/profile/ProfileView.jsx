import { Lock, Pencil } from "lucide-react";

import UserAvatar from "@/components/shared/Avatar/UserAvatar";
import { formatEthiopianDate } from "@/lib/ethiopianCalendar";

function Item({ label, value, className = "" }) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-body">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-line break-words text-sm font-medium text-ink">
        {value || <span className="font-normal text-body/60">Not set</span>}
      </dd>
    </div>
  );
}

export default function ProfileView({ profile, onEdit }) {
  const fullName = [profile.firstName, profile.middleName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  const memberSince = profile.createdAt
    ? formatEthiopianDate(profile.createdAt)
    : "";

  const active = profile.status === "Active";

  return (
    <div className="space-y-6">
      {/* Summary */}
      <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <UserAvatar
            user={profile}
            className="h-24 w-24 text-2xl"
          />

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="truncate font-display text-2xl font-semibold text-ink">
              {fullName}
            </h2>

            <p className="mt-1 text-sm text-body">
              {profile.roleName}
              {memberSince && ` · Joined ${memberSince}`}
            </p>

            {profile.status && (
              <span
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  active
                    ? "bg-success/10 text-success"
                    : "bg-surface-muted text-body ring-1 ring-line"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-success" : "bg-body"
                  }`}
                />
                {profile.status}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            <Pencil size={16} aria-hidden="true" />
            Edit profile
          </button>
        </div>
      </section>

      {/* Personal */}
      <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line">
        <h2 className="font-display text-lg font-semibold text-ink">
          Personal information
        </h2>

        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Item label="Full name" value={fullName} />
          <Item label="Gender" value={profile.gender} />
          <Item
            label="Date of birth (E.C.)"
            value={formatEthiopianDate(profile.dateOfBirth)}
          />
        </dl>
      </section>

      {/* Contact */}
      <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line">
        <h2 className="font-display text-lg font-semibold text-ink">
          Contact information
        </h2>

        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Item label="Email" value={profile.email} />
          <Item label="Phone number" value={profile.phone} />
          <Item
            label="Address"
            value={profile.address}
            className="sm:col-span-2"
          />
        </dl>
      </section>

      {/* Fellowship record */}
      <section className="rounded-3xl bg-surface-muted p-6 ring-1 ring-line">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock size={18} aria-hidden="true" />
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Fellowship record
            </h2>
            <p className="mt-1 text-sm leading-6 text-body">
              These details are managed by the fellowship office. Contact them
              if something needs to change.
            </p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Item label="Member number" value={profile.memberNumber} />
          <Item label="Role" value={profile.roleName} />
          <Item label="Status" value={profile.status} />
          <Item
            label="Baptism date (E.C.)"
            value={formatEthiopianDate(profile.baptismDate)}
          />
        </dl>
      </section>
    </div>
  );
}