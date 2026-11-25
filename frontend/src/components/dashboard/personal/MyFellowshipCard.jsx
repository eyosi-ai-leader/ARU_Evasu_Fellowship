"use client";

import { useState } from "react";
import { ChevronDown, HeartHandshake, Home, Users } from "lucide-react";

import { formatEthiopianDate } from "@/lib/ethiopianCalendar"; // <- adjust path

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
    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
      {children}
    </p>
  );
}

function Detail({ label, children }) {
  if (!children) return null;

  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-700">
        {children}
      </span>
    </div>
  );
}

function Person({ name, phone }) {
  if (!name) return null;

  return (
    <span>
      {name}
      {phone && (
        <>
          {" · "}
          <a
            href={`tel:${phone}`}
            className="text-indigo-600 hover:underline"
          >
            {phone}
          </a>
        </>
      )}
    </span>
  );
}

function People({ people }) {
  if (!people || people.length === 0) return null;

  return (
    <div className="flex flex-col items-end gap-0.5">
      {people.map((person, index) => (
        <Person key={index} name={person.name} phone={person.phone} />
      ))}
    </div>
  );
}

/* One clickable row that opens its details. */
function Item({ title, subtitle, badge, open, onToggle, children }) {
  return (
    <li className="py-1 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-slate-50"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-800">
            {title}
          </span>

          {subtitle && (
            <span className="mt-0.5 block truncate text-xs text-slate-500">
              {subtitle}
            </span>
          )}
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {badge && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {badge}
            </span>
          )}

          <ChevronDown
            size={16}
            className={`text-slate-400 transition ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {open && (
        <div className="mx-2 mb-2 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2">
          {children}
        </div>
      )}
    </li>
  );
}

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

/*
 * A member can be in several small groups, families and ministries, or none.
 * Only the member's own belonging is shown here.
 */
export default function MyFellowshipCard({ fellowship }) {
  const smallGroups = fellowship?.smallGroups ?? [];
  const families = fellowship?.families ?? [];
  const ministries = fellowship?.ministries ?? [];

  // Which row is open, per card: "group-3", "family-7", "ministry-2".
  const [openKey, setOpenKey] = useState(null);

  const toggle = (key) => setOpenKey((current) => (current === key ? null : key));

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <Card icon={Users} title="My Small Groups">
        {smallGroups.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {smallGroups.map((group) => {
              const key = `group-${group.id}`;
              const contacts = group.overseerContacts ?? [];

              return (
                <Item
                  key={group.id}
                  title={group.name}
                  subtitle={
                    group.overseers.length > 0
                      ? `${group.overseers.length > 1 ? "Overseers" : "Overseer"}: ${group.overseers.join(", ")}`
                      : "No overseer assigned yet"
                  }
                  open={openKey === key}
                  onToggle={() => toggle(key)}
                >
                  <Detail label={contacts.length > 1 ? "Overseers" : "Overseer"}>
                    {contacts.length > 0 ? (
                      <People people={contacts} />
                    ) : (
                      "Not assigned yet"
                    )}
                  </Detail>
                  <Detail label="Members">{plural(group.memberCount, "member")}</Detail>
                  <Detail label="Families">{plural(group.familyCount, "family")}</Detail>
                </Item>
              );
            })}
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
            {families.map((family) => {
              const key = `family-${family.id}`;

              return (
                <Item
                  key={family.id}
                  title={family.name}
                  subtitle={family.smallGroupName}
                  badge={family.myRole}
                  open={openKey === key}
                  onToggle={() => toggle(key)}
                >
                  <Detail label="Father">
                    {family.father ? (
                      <Person name={family.father} phone={family.fatherPhone} />
                    ) : (
                      "Not assigned yet"
                    )}
                  </Detail>
                  <Detail label="Mother">
                    {family.mother ? (
                      <Person name={family.mother} phone={family.motherPhone} />
                    ) : (
                      "Not assigned yet"
                    )}
                  </Detail>
                  <Detail label="My role">{family.myRole}</Detail>
                  <Detail label="Small group">{family.smallGroupName}</Detail>
                  <Detail label="Family size">
                    {plural(family.memberCount, "member")}
                  </Detail>
                </Item>
              );
            })}
          </ul>
        ) : smallGroups.length > 0 ? (
          <Notice>
            You have not been placed in a family yet. Your small group
            overseer will connect you when it is time.
          </Notice>
        ) : (
          <Notice>
            Families belong to a small group. Once you are in a small group
            you can be placed in a family.
          </Notice>
        )}
      </Card>

      <Card icon={HeartHandshake} title="My Ministries">
        {ministries.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {ministries.map((ministry) => {
              const key = `ministry-${ministry.id}`;
              const isLeader = ministry.role === "Ministry Leader";

              return (
                <Item
                  key={ministry.id}
                  title={ministry.name}
                  subtitle={plural(ministry.memberCount, "member")}
                  badge={isLeader ? "Leader" : null}
                  open={openKey === key}
                  onToggle={() => toggle(key)}
                >
                  {ministry.description && (
                    <p className="py-2 text-sm leading-6 text-slate-600">
                      {ministry.description}
                    </p>
                  )}
                  <Detail label="My role">{ministry.role}</Detail>
                  <Detail label={ministry.leaders?.length > 1 ? "Leaders" : "Leader"}>
                    {ministry.leaders?.length > 0 ? (
                      <People people={ministry.leaders} />
                    ) : null}
                  </Detail>
                  <Detail label="Joined">
                    {ministry.assignedAt
                      ? formatEthiopianDate(ministry.assignedAt)
                      : null}
                  </Detail>
                </Item>
              );
            })}
          </ul>
        ) : (
          <Notice>You have not joined a ministry yet.</Notice>
        )}
      </Card>
    </section>
  );
}