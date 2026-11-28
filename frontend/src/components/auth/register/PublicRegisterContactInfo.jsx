"use client";

import { Mail, PhoneCall } from "lucide-react";

import { SectionCard, TextInput } from "./RegisterFields";

export default function PublicRegisterContactInfo({
  formData,
  errors,
  onChange,
}) {
  return (
    <>
      <SectionCard
        icon={Mail}
        title="Contact information"
        description="How can the fellowship reach you?"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Email"
            required
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="aru_EvaSUE@fellowship.com"
            autoComplete="email"
            error={errors.email}
          />

          <TextInput
            label="Phone"
            required
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            placeholder="09..."
            autoComplete="tel"
            error={errors.phone}
          />

          <TextInput
            label="Telegram username"
            name="telegramUsername"
            value={formData.telegramUsername}
            onChange={onChange}
            placeholder="@username"
            hint="Optional"
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={PhoneCall}
        title="Emergency contact"
        description="Optional. Someone we can call if we cannot reach you."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <TextInput
            label="Name"
            name="emergencyContactName"
            value={formData.emergencyContactName}
            onChange={onChange}
            placeholder="Full name"
          />

          <TextInput
            label="Phone"
            type="tel"
            name="emergencyContactPhone"
            value={formData.emergencyContactPhone}
            onChange={onChange}
            placeholder="09..."
          />

          <TextInput
            label="Relation"
            name="emergencyContactRelation"
            value={formData.emergencyContactRelation}
            onChange={onChange}
            placeholder="e.g. Mother"
          />
        </div>
      </SectionCard>
    </>
  );
}