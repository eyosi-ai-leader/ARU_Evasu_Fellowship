"use client";

import { Building2, Globe2 } from "lucide-react";

import { useAccess } from "@/components/dashboard/access/AccessProvider";
import { getCampusIdentity } from "@/components/dashboard/access/campusIdentity";

function Mark({ identity, onDark }) {
  if (identity.kind === "all" || identity.kind === "general") {
    return <Globe2 size={13} aria-hidden="true" className="shrink-0" />;
  }

  if (identity.dot) {
    return (
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ring-2 ${identity.dot} ${
          onDark ? "ring-white/40" : "ring-slate-100"
        }`}
      />
    );
  }

  return <Building2 size={13} aria-hidden="true" className="shrink-0" />;
}

/*
 * The campus a person belongs to or serves.
 *   variant "inline"  a quiet line (the sidebar role card)
 *   variant "pill"    a small rounded label (the header, the welcome area)
 *   onDark            the inline variant sits on a dark background
 *   fallback          shown while the campus is not known yet
 */
export default function CampusBadge({
  variant = "inline",
  onDark = false,
  className = "",
  fallback = null,
}) {
  const { access } = useAccess();
  const identity = getCampusIdentity(access);

  if (!identity) return fallback;

  if (variant === "pill") {
    return (
      <span
        title={identity.title}
        className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
          identity.muted
            ? "border-slate-200 bg-slate-50 text-slate-400"
            : "border-slate-200 bg-white text-slate-700 shadow-sm"
        } ${className}`}
      >
        <span className="sr-only">Campus: </span>
        <Mark identity={identity} />
        <span className="truncate">{identity.label}</span>
      </span>
    );
  }

  return (
    <span
      title={identity.title}
      className={`flex items-center gap-1.5 text-xs font-medium ${
        onDark
          ? "text-white/80"
          : identity.muted
            ? "text-slate-300"
            : "text-slate-500"
      } ${className}`}
    >
      <span className="sr-only">Campus: </span>
      <Mark identity={identity} onDark={onDark} />
      <span className="truncate">{identity.label}</span>
    </span>
  );
}