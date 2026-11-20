"use client";

import {
  BriefcaseBusiness,
  Crown,
  Eye,
  HeartHandshake,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { ROLES } from "@/lib/roles";

const ROLE_ICONS = {
  [ROLES.ADMIN]: Crown,
  [ROLES.PASTOR]: ShieldCheck,
  [ROLES.SMALL_GROUP_LEADER]: Eye,
  [ROLES.MINISTRY_LEADER]: HeartHandshake,
  [ROLES.MEMBER]: UserRound,
  [ROLES.FELLOWSHIP_ADMIN]: ShieldCheck,
  [ROLES.STAFF]: BriefcaseBusiness,
};

export default function RoleDistribution({ roles, loading }) {
  if (loading && !roles) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-xl bg-slate-50"
            />
          ))}
        </div>
      </section>
    );
  }

  // Roles nobody holds are not shown (the Member role always is).
  const visible = (roles || []).filter(
    (role) => role.total > 0 || Number(role.roleId) === ROLES.MEMBER
  );

  if (visible.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          People by role
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Accounts in the campuses you are viewing, by system role.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((role) => {
          const Icon = ROLE_ICONS[Number(role.roleId)] || Users;

          return (
            <div
              key={role.roleId}
              className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                  <Icon size={18} aria-hidden="true" />
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {role.total}
                </span>
              </div>

              <p className="mt-3 text-sm font-medium text-slate-700">
                {role.roleName}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}