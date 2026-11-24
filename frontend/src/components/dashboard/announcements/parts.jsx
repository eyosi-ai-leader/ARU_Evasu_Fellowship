"use client";

import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Megaphone,
} from "lucide-react";

export const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

export const PRIORITIES = [
  { value: "normal", label: "Normal", hint: "A regular announcement." },
  {
    value: "important",
    label: "Important",
    hint: "Highlighted so people notice it.",
  },
  {
    value: "urgent",
    label: "Urgent",
    hint: "Shown in red. The email subject starts with “Urgent”.",
  },
];

const PRIORITY_STYLE = {
  urgent: {
    label: "Urgent",
    pill: "bg-red-50 text-red-700 ring-red-200",
    iconBox: "bg-red-100 text-red-600",
    border: "border-red-200",
    icon: AlertTriangle,
  },
  important: {
    label: "Important",
    pill: "bg-amber-50 text-amber-700 ring-amber-200",
    iconBox: "bg-amber-100 text-amber-600",
    border: "border-amber-200",
    icon: AlertCircle,
  },
  normal: {
    label: "Normal",
    pill: "bg-slate-100 text-slate-600 ring-slate-200",
    iconBox: "bg-indigo-100 text-indigo-600",
    border: "border-slate-200",
    icon: Megaphone,
  },
};

export const priorityStyle = (priority) =>
  PRIORITY_STYLE[priority] || PRIORITY_STYLE.normal;

const TONES = {
  neutral: "bg-slate-100 text-slate-600",
  info: "bg-indigo-50 text-indigo-700",
  good: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
};

export function Pill({ children, tone = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// Only shown for important and urgent announcements.
export function PriorityBadge({ priority }) {
  if (!priority || priority === "normal") return null;

  const style = priorityStyle(priority);
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${style.pill}`}
    >
      <Icon size={12} aria-hidden="true" />
      {style.label}
    </span>
  );
}

// A page of this portal opens in the same tab. Other links open in a new tab.
export function ActionLink({ url, label }) {
  if (!url) return null;

  const className =
    "inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2";

  if (url.startsWith("/")) {
    return (
      <Link href={url} className={className}>
        {label || "Open"}
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {label || "Open"}
      <ArrowUpRight size={15} aria-hidden="true" />
    </a>
  );
}

// "2026-12-05 18:30:00" (church time) -> "Sat, 5 Dec 2026, 6:30 PM"
export function formatWhen(value) {
  if (!value) return "";

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Value for <input type="datetime-local">, a few minutes from now.
export function nowForInput(offsetMinutes = 0) {
  const date = new Date(Date.now() + offsetMinutes * 60000);
  const pad = (number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// [["Main Campus", [item, ...]], ...] so each campus shows its own list.
export function groupByCampus(items) {
  const groups = new Map();

  items.forEach((item) => {
    const label = item.isGeneral
      ? "General Fellowship"
      : item.campusName || "Campus";

    if (!groups.has(label)) groups.set(label, []);

    groups.get(label).push(item);
  });

  return [...groups.entries()];
}