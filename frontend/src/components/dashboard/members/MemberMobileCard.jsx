"use client";

import Link from "next/link";
import {
  Building2,
  ChevronRight,
  GraduationCap,
  Home,
  MapPin,
  Mail,
  Phone,
  Send,
  UserRound,
  Users,
} from "lucide-react";

/*
 * Phone-first member card.
 *
 * - The whole top part is one big tap target that opens the member.
 * - Call / Telegram / Email are large one-tap buttons (44px high).
 * - The management buttons (edit, delete, more...) come from the table
 *   as `actions`, so the permission rules stay in ONE place.
 * - Leadership badges and "not yet in a small group / family" labels come
 *   from `info` (the table works them out).
 */

function Avatar({ info }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm">
      {info.profileImage ? (
        <img
          src={info.profileImage}
          alt={info.fullName}
          className="h-full w-full object-cover"
        />
      ) : (
        info.initials || <UserRound size={18} />
      )}
    </div>
  );
}

function StatusDot({ status }) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {status}
    </span>
  );
}

function QuickButton({ href, icon: Icon, label, external = false }) {
  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition active:bg-slate-100"
    >
      <Icon size={15} className="shrink-0 text-slate-500" />
      <span className="truncate">{label}</span>
    </a>
  );
}

/*
 * Where the person belongs. An overseer already knows the small group, so
 * they see the family only. Everyone else sees the small group and family.
 */
function PlacementLine({ placement, mode }) {
  if (mode === "smallGroup") {
    return (
      <div className="flex items-center gap-2">
        <Home size={14} className="shrink-0 text-slate-300" />

        {placement.family ? (
          <dd className="min-w-0 truncate font-medium text-slate-600">
            {placement.family}
          </dd>
        ) : (
          <dd className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            Not yet in a family
          </dd>
        )}
      </div>
    );
  }

  if (!placement.hasSmallGroup) {
    return (
      <div className="flex items-center gap-2">
        <Users size={14} className="shrink-0 text-slate-300" />

        <dd className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          Not yet in a small group
        </dd>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Users size={14} className="shrink-0 text-slate-300" />

      <dd className="min-w-0 truncate font-medium text-slate-600">
        {placement.smallGroup}
        {placement.family ? (
          ` · ${placement.family}`
        ) : (
          <span className="font-semibold text-amber-600"> · Not yet in a family</span>
        )}
      </dd>
    </div>
  );
}

const cleanTelegram = (value) =>
  String(value || "").trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");

export default function MemberMobileCard({
  member,
  info,
  mode,
  showCampus = false,
  actions = null,
}) {
  const isMinistry = mode === "ministry";

  const academicLine = [info.academic.department, info.academic.yearText]
    .filter(Boolean)
    .join(" · ");

  const telegram = cleanTelegram(member.telegram_username);

  const positions = info.positions || [];

  const showPlacement =
    (mode === "manage" || mode === "smallGroup") &&
    Boolean(info.placement?.hasCampus);

  const top = (
    <div className="flex items-center gap-3">
      <Avatar info={info} />

      <div className="min-w-0 flex-1">
        <p
          title={info.fullName}
          className="truncate text-[15px] font-bold leading-5 text-slate-900"
        >
          {info.fullName}
        </p>

        <p className="mt-0.5 truncate font-mono text-[11px] font-medium text-slate-400">
          {info.memberNumber}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusDot status={info.status} />

          {info.access && mode === "manage" && (
            <span
              title={info.access.title}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${info.access.className}`}
            >
              {info.access.label}
            </span>
          )}

          {positions.map((position) => (
            <span
              key={position}
              className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600"
            >
              {position}
            </span>
          ))}
        </div>
      </div>

      {info.canView && (
        <ChevronRight size={18} className="shrink-0 text-slate-300" />
      )}
    </div>
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Tap the top part to open the member */}
      {info.canView ? (
        <Link
          href={`/dashboard/members/${member.id}`}
          aria-label={`Open ${info.fullName}`}
          className="block p-4 transition active:bg-slate-50"
        >
          {top}
        </Link>
      ) : (
        <div className="p-4">{top}</div>
      )}

      {/* Facts */}
      {(academicLine ||
        (isMinistry && info.ministryName) ||
        (showCampus && info.campus) ||
        showPlacement) && (
        <dl className="space-y-1.5 px-4 pb-3 text-xs text-slate-500">
          {!isMinistry && academicLine && (
            <div className="flex items-center gap-2">
              <GraduationCap size={14} className="shrink-0 text-slate-300" />
              <dd className="min-w-0 truncate font-medium text-slate-600">
                {academicLine}
              </dd>
            </div>
          )}

          {showPlacement && (
            <PlacementLine placement={info.placement} mode={mode} />
          )}

          {isMinistry && (
            <div className="flex items-center gap-2">
              <Building2 size={14} className="shrink-0 text-slate-300" />
              <dd className="min-w-0 truncate font-medium text-slate-600">
                {info.ministryName}
                {info.displayedRole ? ` · ${info.displayedRole}` : ""}
              </dd>
            </div>
          )}

          {showCampus && info.campus && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0 text-slate-300" />
              <dd className="min-w-0 truncate">{info.campus}</dd>
            </div>
          )}
        </dl>
      )}

      {/* One-tap contact buttons */}
      {(info.phone || telegram || info.email) && (
        <div className="flex gap-2 border-t border-slate-100 px-3 py-3">
          {info.phone && (
            <QuickButton
              href={`tel:${info.phone}`}
              icon={Phone}
              label="Call"
            />
          )}

          {telegram && (
            <QuickButton
              href={`https://t.me/${telegram}`}
              icon={Send}
              label="Telegram"
              external
            />
          )}

          {info.email && (
            <QuickButton
              href={`mailto:${info.email}`}
              icon={Mail}
              label="Email"
            />
          )}
        </div>
      )}

      {/* Management buttons (edit, delete, more...) */}
      {actions && (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
          <span className="truncate pl-1 text-[11px] font-medium text-slate-400">
            {info.displayedRole}
          </span>

          {actions}
        </div>
      )}
    </article>
  );
}