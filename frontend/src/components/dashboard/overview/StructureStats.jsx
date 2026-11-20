"use client";

import {
  AlertTriangle,
  HeartHandshake,
  Home,
  UserX,
  Users,
} from "lucide-react";

function Tile({ icon: Icon, label, value, hint, attention = false, loading }) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        attention
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          attention ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
        }`}
      >
        <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>

      <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        {loading ? "..." : value}
      </h3>

      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

export default function StructureStats({ structure, loading }) {
  if (!structure && !loading) return null;

  const value = (key) => structure?.[key] ?? 0;

  return (
    <section
      aria-label="Fellowship structure"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      <Tile
        icon={Users}
        label="Small groups"
        value={value("smallGroups")}
        hint="Active small groups"
        loading={loading}
      />

      <Tile
        icon={Home}
        label="Families"
        value={value("families")}
        hint="Families inside the small groups"
        loading={loading}
      />

      <Tile
        icon={HeartHandshake}
        label="Ministries"
        value={value("ministries")}
        hint="Active ministries"
        loading={loading}
      />

      <Tile
        icon={UserX}
        label="Not yet in a small group"
        value={value("membersWithoutSmallGroup")}
        hint="Active members to place in a small group"
        attention={value("membersWithoutSmallGroup") > 0}
        loading={loading}
      />

      <Tile
        icon={AlertTriangle}
        label="Without an overseer"
        value={value("smallGroupsWithoutLeader")}
        hint="Small groups that need an overseer"
        attention={value("smallGroupsWithoutLeader") > 0}
        loading={loading}
      />
    </section>
  );
}