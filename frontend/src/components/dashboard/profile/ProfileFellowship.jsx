"use client";

import Link from "next/link";
import {
  Building2,
  GraduationCap,
  HeartHandshake,
  Loader2,
  RotateCw,
  Users,
} from "lucide-react";

import { useAccess } from "@/components/dashboard/access/AccessProvider";
import MyFellowshipCard from "@/components/dashboard/personal/MyFellowshipCard";
import { formatMonth } from "./profileFormat";

function Card({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        </span>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">
        {value || <span className="font-normal text-slate-400">Not set</span>}
      </dd>
    </div>
  );
}

/*
 * state: { status: "loading" | "ready" | "error", data, error }
 */
export default function ProfileFellowship({ state, onRetry }) {
  const { access } = useAccess();

  if (state.status === "loading") {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-14 text-sm text-slate-500"
      >
        <Loader2 size={18} className="animate-spin" />
        Loading your fellowship details...
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
      >
        <p className="text-sm text-red-700">{state.error}</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <RotateCw size={15} aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  const member = state.data?.member;

  if (!member) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <Building2 className="mx-auto text-slate-300" size={28} aria-hidden="true" />

        <p className="mt-3 text-sm font-semibold text-slate-800">
          Your account is not linked to a member record
        </p>

        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
          Membership details such as campus, small group and ministries appear
          here once your account is linked to a fellowship member record.
        </p>
      </div>
    );
  }

  const hasStudies = Boolean(
    member.department ||
      member.studentId ||
      member.entryYear ||
      member.graduationYear
  );

  const ministriesLed = access?.positions?.ministriesLed || [];
  const groupsLed = access?.positions?.smallGroups || [];
  const leads = ministriesLed.length + groupsLed.length > 0;

  return (
    <div className="space-y-6">
      <Card
        icon={Building2}
        title="Campus and membership"
        description="Where you belong in the fellowship."
      >
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Item label="Campus" value={member.campusName} />
          <Item label="Member number" value={member.memberNumber} />
          <Item label="Member since" value={formatMonth(member.joinedAt)} />
          <Item label="Status" value={member.status} />
        </dl>

        {!member.campusName && (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You have not been placed in a campus yet. Your fellowship leaders
            will place you soon.
          </p>
        )}
      </Card>

      {hasStudies && (
        <Card
          icon={GraduationCap}
          title="Studies"
          description="Your university details."
        >
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Item label="Department" value={member.department} />
            <Item label="Student ID" value={member.studentId} />
            <Item label="Entry year" value={member.entryYear} />
            <Item label="Expected graduation" value={member.graduationYear} />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Academic status
              </dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    member.academicStatus === "Graduate"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  {member.academicStatus || "Student"}
                </span>
              </dd>
            </div>
          </dl>
        </Card>
      )}

      {leads && (
        <Card
          icon={HeartHandshake}
          title="Where I lead"
          description="The ministries and small groups you look after."
        >
          <ul className="flex flex-wrap gap-2">
            {ministriesLed.map((ministry) => (
              <li key={`m-${ministry.id}`}>
                <Link
                  href="/dashboard/ministries"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                >
                  <HeartHandshake size={15} aria-hidden="true" />
                  {ministry.name || "Ministry"}
                </Link>
              </li>
            ))}

            {groupsLed.map((group) => (
              <li key={`g-${group.id}`}>
                <Link
                  href={`/dashboard/small-groups/${group.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                >
                  <Users size={15} aria-hidden="true" />
                  {group.name || "Small group"}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <MyFellowshipCard fellowship={state.data?.fellowship ?? null} />
    </div>
  );
}