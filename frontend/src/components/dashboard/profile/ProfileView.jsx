"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

import ProfileFellowship from "./ProfileFellowship";
import ProfileHeader from "./ProfileHeader";
import { formatDate } from "./profileFormat";

const TABS = [
  { id: "about", label: "About me" },
  { id: "fellowship", label: "Fellowship" },
];

function Item({ label, value, className = "" }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-line break-words text-sm font-medium text-slate-800">
        {value || <span className="font-normal text-slate-400">Not set</span>}
      </dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export default function ProfileView({
  profile,
  fellowship,
  onEdit,
  onReloadFellowship,
}) {
  const [tab, setTab] = useState("about");

  const fullName = [profile.firstName, profile.middleName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  const campusName = fellowship?.data?.member?.campusName || "";

  return (
    <div className="space-y-6">
      <ProfileHeader profile={profile} onEdit={onEdit} />

      <div
        role="tablist"
        aria-label="Profile sections"
        className="inline-flex rounded-xl bg-slate-100 p-1"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            id={`profile-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`profile-panel-${item.id}`}
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              tab === item.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "about" && (
        <div
          id="profile-panel-about"
          role="tabpanel"
          aria-labelledby="profile-tab-about"
          className="space-y-6"
        >
          <Section title="Personal information">
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Item label="Full name" value={fullName} />
              <Item label="Gender" value={profile.gender} />
              <Item
                label="Date of birth"
                value={formatDate(profile.dateOfBirth)}
              />
            </dl>
          </Section>

          <Section title="Contact information">
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Item label="Email" value={profile.email} />
              <Item label="Phone number" value={profile.phone} />
              <Item
                label="Address"
                value={profile.address}
                className="sm:col-span-2"
              />
            </dl>
          </Section>

          {/* Church record */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-start gap-3">
              <Lock
                size={18}
                className="mt-0.5 text-slate-400"
                aria-hidden="true"
              />

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Fellowship record
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  These details are managed by your fellowship leaders. Contact
                  them if something needs to change.
                </p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Item label="Member number" value={profile.memberNumber} />
              <Item label="Campus" value={campusName} />
              <Item label="Role" value={profile.roleName} />
              <Item label="Status" value={profile.status} />
              <Item
                label="Baptism date"
                value={formatDate(profile.baptismDate)}
              />
            </dl>
          </section>
        </div>
      )}

      {tab === "fellowship" && (
        <div
          id="profile-panel-fellowship"
          role="tabpanel"
          aria-labelledby="profile-tab-fellowship"
        >
          <ProfileFellowship state={fellowship} onRetry={onReloadFellowship} />
        </div>
      )}
    </div>
  );
}