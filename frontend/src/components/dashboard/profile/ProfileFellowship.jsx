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
    <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        </span>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            {title}
          </h2>
          {description && <p className="text-sm text-body">{description}</p>}
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-body">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-ink">
        {value || <span className="font-normal text-body/60">Not set</span>}
      </dd>
    </div>
  );
}

const pillLink =
  "inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/*
 * state: { status: "loading" | "ready" | "error", data, error }
 */
export default function ProfileFellowship({ state, onRetry }) {
  const { access } = useAccess();

  if (state.status === "loading") {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 rounded-3xl bg-white py-14 text-sm text-body ring-1 ring-line"
      >
        <Loader2 size={18} className="animate-spin text-primary" />
        Loading your fellowship details...
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="rounded-3xl border border-danger/30 bg-danger/10 p-6 text-center"
      >
        <p className="text-sm text-danger">{state.error}</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.97]"
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
      <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-line">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 size={26} aria-hidden="true" />
        </div>

        <p className="mt-4 font-display text-lg font-semibold text-ink">
          Your account is not linked to a member record
        </p>

        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-body">
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
          <p className="mt-5 rounded-2xl border border-accent/40 bg-accent/20 px-4 py-3 text-sm font-medium text-ink">
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
              <dt className="text-xs font-semibold uppercase tracking-wide text-body">
                Academic status
              </dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    member.academicStatus === "Graduate"
                      ? "bg-surface-muted text-body ring-1 ring-line"
                      : "bg-primary/10 text-primary"
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
                <Link href="/dashboard/ministries" className={pillLink}>
                  <HeartHandshake
                    size={15}
                    aria-hidden="true"
                    className="text-primary"
                  />
                  {ministry.name || "Ministry"}
                </Link>
              </li>
            ))}

            {groupsLed.map((group) => (
              <li key={`g-${group.id}`}>
                <Link
                  href={`/dashboard/small-groups/${group.id}`}
                  className={pillLink}
                >
                  <Users size={15} aria-hidden="true" className="text-primary" />
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