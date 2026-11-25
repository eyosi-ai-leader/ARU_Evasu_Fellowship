"use client";

import { useState } from "react";

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
      <dt className="text-xs font-semibold uppercase tracking-wide text-body">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-line break-words text-sm font-medium text-ink">
        {value || <span className="font-normal text-body/60">Not set</span>}
      </dd>
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-7">
      <h2 className="flex items-center gap-3 font-display text-lg font-semibold text-ink">
        <span aria-hidden="true" className="h-5 w-1 rounded-full bg-accent" />
        {title}
      </h2>

      {description && (
        <p className="mt-1 pl-4 text-sm text-body">{description}</p>
      )}

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

  const telegram = profile.telegramUsername
    ? `@${profile.telegramUsername.replace(/^@/, "")}`
    : "";

  return (
    <div className="space-y-6">
      <ProfileHeader profile={profile} onEdit={onEdit} />

      <div
        role="tablist"
        aria-label="Profile sections"
        className="inline-flex gap-1 rounded-full bg-white p-1 ring-1 ring-line"
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
            className={`rounded-full px-6 py-2 text-sm font-semibold transition duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              tab === item.id
                ? "bg-primary text-white shadow-soft"
                : "text-body hover:text-ink"
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
              <Item
                label="Baptism date"
                value={formatDate(profile.baptismDate)}
              />
            </dl>
          </Section>

          <Section title="Contact information">
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Item label="Email" value={profile.email} />
              <Item label="Phone number" value={profile.phone} />
              <Item label="Telegram" value={telegram} />
            </dl>
          </Section>

          <Section
            title="Where you are from"
            description="Where you or your family lived before coming to campus."
          >
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Item label="Region" value={profile.homeRegion} />
              <Item label="City or town" value={profile.homeTown} />
              <Item
                label="Specific place or area"
                value={profile.address}
                className="sm:col-span-2"
              />
            </dl>
          </Section>

          <Section
            title="Emergency contact"
            description="Someone your leaders can call if they cannot reach you."
          >
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Item label="Name" value={profile.emergencyContactName} />
              <Item label="Phone number" value={profile.emergencyContactPhone} />
              <Item label="Relation" value={profile.emergencyContactRelation} />
            </dl>
          </Section>
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