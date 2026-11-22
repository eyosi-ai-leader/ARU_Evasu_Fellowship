"use client";

import { Home, HeartHandshake, Users } from "lucide-react";

function Card({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        </span>

        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function Notice({ children }) {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
      {children}
    </p>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-700">
        {value || "Not assigned yet"}
      </span>
    </div>
  );
}

/*
 * A member can be in several small groups and several families, or none.
 */
export default function MyFellowshipCard({ fellowship }) {
  const smallGroups = fellowship?.smallGroups ?? [];
  const families = fellowship?.families ?? [];
  const ministries = fellowship?.ministries ?? [];

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <Card icon={Users} title="My Small Groups">
        {smallGroups.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {smallGroups.map((group) => (
              <li key={group.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-slate-800">
                  {group.name}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {group.overseers.length > 0
                    ? `${group.overseers.length > 1 ? "Overseers" : "Overseer"}: ${group.overseers.join(", ")}`
                    : "No overseer assigned yet"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <Notice>
            You are not yet in a small group. Your fellowship leaders will
            place you in one soon.
          </Notice>
        )}
      </Card>

      <Card icon={Home} title="My Families">
        {families.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {families.map((family) => (
              <li key={family.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {family.name}
                  </p>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {family.myRole}
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-slate-500">
                  {family.smallGroupName}
                </p>

                <Row label="Father" value={family.father} />
                <Row label="Mother" value={family.mother} />
              </li>
            ))}
          </ul>
        ) : smallGroups.length > 0 ? (
          <Notice>
            You have not been placed in a family yet. Your small group
            overseer will connect you when it is time.
          </Notice>
        ) : (
          <p className="text-sm leading-6 text-slate-500">
            Families belong to a small group. Once you are in a small group
            you can be placed in a family.
          </p>
        )}
      </Card>

      <Card icon={HeartHandshake} title="My Ministries">
        {ministries.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {ministries.map((ministry) => (
              <li
                key={ministry.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="text-sm font-medium text-slate-700">
                  {ministry.name}
                </span>

                {ministry.role === "Ministry Leader" && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                    Leader
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-slate-500">
            You have not joined a ministry yet.
          </p>
        )}
      </Card>
    </section>
  );
}