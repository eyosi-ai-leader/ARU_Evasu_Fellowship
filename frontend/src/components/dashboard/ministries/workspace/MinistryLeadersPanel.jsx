"use client";

import {
  Loader2,
  Phone,
  Plus,
  ShieldCheck,
  UserMinus,
  UserRound,
} from "lucide-react";

import PersonMenu from "@/components/dashboard/small-groups/PersonMenu";
import {
  Avatar,
  secondaryButton,
} from "@/components/dashboard/small-groups/parts";

function LeaderAvatar({ leader }) {
  if (leader.profileImage) {
    return (
      <img
        src={leader.profileImage}
        alt=""
        className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
      />
    );
  }

  return <Avatar name={leader.name} className="h-12 w-12 text-sm" />;
}

export default function MinistryLeadersPanel({
  leaders = [],
  canManage = false,
  disabled = false,
  busyKey = "",
  onAdd,
  onDemote,
  onRemove,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Leaders</h2>

          <p className="mt-1 text-sm text-slate-500">
            {canManage
              ? "The people who lead this ministry. A ministry can have several leaders."
              : "The people who lead this ministry. Only a campus leader can change them."}
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
            Add leader
          </button>
        )}
      </div>

      {leaders.length === 0 ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This ministry has no leader yet.
          {canManage ? " Appoint one so someone can look after the team." : ""}
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {leaders.map((leader) => (
            <li
              key={leader.key}
              className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <LeaderAvatar leader={leader} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {leader.name}
                  </p>

                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                    <ShieldCheck size={11} aria-hidden="true" />
                    Ministry leader
                  </span>
                </div>

                {canManage &&
                  (busyKey === `leader-${leader.memberId}` ? (
                    <Loader2
                      size={16}
                      className="mt-2 animate-spin text-slate-400"
                    />
                  ) : (
                    <PersonMenu
                      label={`Actions for ${leader.name}`}
                      disabled={disabled}
                      items={[
                        {
                          key: "demote",
                          label: "Make a regular member",
                          icon: UserRound,
                          onClick: () => onDemote(leader),
                        },
                        {
                          key: "remove",
                          label: "Remove from ministry",
                          icon: UserMinus,
                          danger: true,
                          onClick: () => onRemove(leader),
                        },
                      ]}
                    />
                  ))}
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-500">
                {leader.email && <p className="truncate">{leader.email}</p>}

                {leader.phone && (
                  <a
                    href={`tel:${leader.phone}`}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    <Phone size={11} aria-hidden="true" />
                    {leader.phone}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
