import { Archive, Building2, UserRound, Users } from "lucide-react";

function Tile({ icon: Icon, label, value, attention = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${
        attention ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">{label}</p>

        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            attention ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default function MinistryStats({ ministries = [] }) {
  const active = ministries.filter((item) => item.status === "Active");

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <Tile icon={Building2} label="Active ministries" value={active.length} />

      <Tile
        icon={Users}
        label="Ministry memberships"
        value={ministries.reduce((sum, item) => sum + item.memberCount, 0)}
      />

      <Tile
        icon={UserRound}
        label="Without a leader"
        value={active.filter((item) => item.leaderCount === 0).length}
        attention={active.some((item) => item.leaderCount === 0)}
      />

      <Tile
        icon={Archive}
        label="Inactive ministries"
        value={ministries.length - active.length}
      />
    </div>
  );
}