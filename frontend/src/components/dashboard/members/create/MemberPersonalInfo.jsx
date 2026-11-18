"use client";

import EcDateField from "@/components/shared/EcDate/EcDateField";
import { Field, Section, fieldClass } from "./FormParts";

export default function MemberPersonalInfo({
  form,
  errors = {},
  onChange,
  genderRequired = true,
}) {
  return (
    <Section
      title="Personal Information"
      description="Basic information about the fellowship member."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="firstName" label="First name" required error={errors.firstName}>
          <input
            id="firstName"
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={onChange}
            placeholder="Enter first name"
            autoComplete="off"
            aria-invalid={Boolean(errors.firstName)}
            className={fieldClass(errors.firstName)}
          />
        </Field>

        <Field id="middleName" label="Middle name" error={errors.middleName}>
          <input
            id="middleName"
            type="text"
            name="middleName"
            value={form.middleName}
            onChange={onChange}
            placeholder="Enter middle name"
            autoComplete="off"
            className={fieldClass(errors.middleName)}
          />
        </Field>

        <Field id="lastName" label="Last name" required error={errors.lastName}>
          <input
            id="lastName"
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={onChange}
            placeholder="Enter last name"
            autoComplete="off"
            aria-invalid={Boolean(errors.lastName)}
            className={fieldClass(errors.lastName)}
          />
        </Field>

        <Field
          id="gender"
          label="Gender"
          required={genderRequired}
          error={errors.gender}
        >
          <select
            id="gender"
            name="gender"
            value={form.gender}
            onChange={onChange}
            aria-invalid={Boolean(errors.gender)}
            className={fieldClass(errors.gender)}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </Field>

        <EcDateField
          id="dateOfBirth"
          name="dateOfBirth"
          label="Date of birth"
          value={form.dateOfBirth}
          onChange={onChange}
          error={errors.dateOfBirth}
          newestYearsAgo={10}
          oldestYearsAgo={80}
        />
      </div>
    </Section>
  );
}