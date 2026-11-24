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
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-ember text-sm font-bold text-white shadow-card">
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
          ? "bg-success/10 text-success"
          : "bg-surface-muted text-body ring-1 ring-line"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-success" : "bg-body/50"
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
      className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-white px-2 text-xs font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] active:bg-primary/5"
    >
      <Icon size={15} className="shrink-0 text-primary" />
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
        <Home size={14} className="shrink-0 text-body/50" />

        {placement.family ? (
          <dd className="min-w-0 truncate font-medium text-ink">
            {placement.family}
          </dd>
        ) : (
          <dd className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-ink ring-1 ring-accent/40">
            Not yet in a family
          </dd>
        )}
      </div>
    );
  }

  if (!placement.hasSmallGroup) {
    return (
      <div className="flex items-center gap-2">
        <Users size={14} className="shrink-0 text-body/50" />

        <dd className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-ink ring-1 ring-accent/40">
          Not yet in a small group
        </dd>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Users size={14} className="shrink-0 text-body/50" />

      <dd className="min-w-0 truncate font-medium text-ink">
        {placement.smallGroup}
        {placement.family ? (
          ` · ${placement.family}`
        ) : (
          <span className="font-semibold text-ember"> · Not yet in a family</span>
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
          className="truncate font-display text-[15px] font-semibold leading-5 text-ink"
        >
          {info.fullName}
        </p>

        <p className="mt-0.5 truncate font-mono text-[11px] font-medium text-body">
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
              className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
            >
              {position}
            </span>
          ))}
        </div>
      </div>

      {info.canView && (
        <ChevronRight size={18} className="shrink-0 text-body/50" />
      )}
    </div>
  );

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line">
      {/* Tap the top part to open the member */}
      {info.canView ? (
        <Link
          href={`/dashboard/members/${member.id}`}
          aria-label={`Open ${info.fullName}`}
          className="block p-4 transition active:bg-primary/5"
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
        <dl className="space-y-1.5 px-4 pb-3 text-xs text-body">
          {!isMinistry && academicLine && (
            <div className="flex items-center gap-2">
              <GraduationCap size={14} className="shrink-0 text-body/50" />
              <dd className="min-w-0 truncate font-medium text-ink">
                {academicLine}
              </dd>
            </div>
          )}

          {showPlacement && (
            <PlacementLine placement={info.placement} mode={mode} />
          )}

          {isMinistry && (
            <div className="flex items-center gap-2">
              <Building2 size={14} className="shrink-0 text-body/50" />
              <dd className="min-w-0 truncate font-medium text-ink">
                {info.ministryName}
                {info.displayedRole ? ` · ${info.displayedRole}` : ""}
              </dd>
            </div>
          )}

          {showCampus && info.campus && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0 text-body/50" />
              <dd className="min-w-0 truncate">{info.campus}</dd>
            </div>
          )}
        </dl>
      )}

      {/* One-tap contact buttons */}
      {(info.phone || telegram || info.email) && (
        <div className="flex gap-2 border-t border-line px-3 py-3">
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
        <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-muted/60 px-3 py-2">
          <span className="truncate pl-1 text-[11px] font-medium text-body">
            {info.displayedRole}
          </span>

          {actions}
        </div>
      )}
    </article>
  );
}