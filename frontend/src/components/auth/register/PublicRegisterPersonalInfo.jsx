"use client";

import { UserRound } from "lucide-react";

import GregorianDateField from "./GregorianDateField";
import {
  SectionCard,
  SegmentedRadio,
  TextInput,
} from "./RegisterFields";

export default function PublicRegisterPersonalInfo({
  formData,
  errors,
  onChange,
}) {
  return (
    <SectionCard
      icon={UserRound}
      title="Personal information"
      description="Tell us a little about yourself."
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <TextInput
          label="First name"
          required
          name="firstName"
          value={formData.firstName}
          onChange={onChange}
          placeholder="First name"
          autoComplete="given-name"
          error={errors.firstName}
        />

        <TextInput
          label="Middle name"
          name="middleName"
          value={formData.middleName}
          onChange={onChange}
          placeholder="Middle name"
          error={errors.middleName}
        />

        <TextInput
          label="Last name"
          required
          name="lastName"
          value={formData.lastName}
          onChange={onChange}
          placeholder="Last name"
          autoComplete="family-name"
          error={errors.lastName}
        />

        <SegmentedRadio
          className="sm:col-span-3"
          label="Gender"
          required
          name="gender"
          value={formData.gender}
          onChange={onChange}
          error={errors.gender}
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
          ]}
        />

        <GregorianDateField
          className="sm:col-span-3"
          label="Date of birth"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={onChange}
          error={errors.dateOfBirth}
          autoComplete="bday"
          newestYearsAgo={10}
          oldestYearsAgo={80}
        />
      </div>
    </SectionCard>
  );
}