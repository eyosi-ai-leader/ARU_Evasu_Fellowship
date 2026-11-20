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
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-700">
        {value || "Not assigned yet"}
      </span>
    </div>
  );
}

export default function MyFellowshipCard({ fellowship }) {
  const smallGroup = fellowship?.smallGroup ?? null;
  const family = fellowship?.family ?? null;
  const ministries = fellowship?.ministries ?? [];

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <Card icon={Users} title="My Small Group">
        {smallGroup ? (
          <div className="divide-y divide-slate-100">
            <Row label="Small group" value={smallGroup.name} />
            <Row
              label={smallGroup.overseers.length > 1 ? "Overseers" : "Overseer"}
              value={smallGroup.overseers.join(", ")}
            />
          </div>
        ) : (
          <Notice>
            You are not yet in a small group. Your fellowship leaders will
            place you in one soon.
          </Notice>
        )}
      </Card>

      <Card icon={Home} title="My Family">
        {family ? (
          <div className="divide-y divide-slate-100">
            <Row label="Family" value={family.name} />
            <Row label="Father" value={family.father} />
            <Row label="Mother" value={family.mother} />
            <Row label="My place" value={family.myRole} />
          </div>
        ) : smallGroup ? (
          <Notice>
            You have not been placed in a family yet. Your small group
            overseer will connect you soon.
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