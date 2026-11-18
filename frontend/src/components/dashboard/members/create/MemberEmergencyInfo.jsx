"use client";

import { Field, Section, fieldClass } from "./FormParts";

export default function MemberEmergencyInfo({ form, errors = {}, onChange }) {
  return (
    <Section
      title="Emergency Contact"
      description="Who to call if something happens."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <Field id="emergencyContactName" label="Name">
          <input
            id="emergencyContactName"
            type="text"
            name="emergencyContactName"
            value={form.emergencyContactName}
            onChange={onChange}
            placeholder="Full name"
            autoComplete="off"
            className={fieldClass(false)}
          />
        </Field>

        <Field
          id="emergencyContactPhone"
          label="Phone"
          error={errors.emergencyContactPhone}
        >
          <input
            id="emergencyContactPhone"
            type="tel"
            name="emergencyContactPhone"
            inputMode="tel"
            value={form.emergencyContactPhone}
            onChange={onChange}
            placeholder="0911 000 000"
            className={fieldClass(errors.emergencyContactPhone)}
          />
        </Field>

        <Field id="emergencyContactRelation" label="Relation">
          <input
            id="emergencyContactRelation"
            type="text"
            name="emergencyContactRelation"
            value={form.emergencyContactRelation}
            onChange={onChange}
            placeholder="Parent, brother, friend..."
            className={fieldClass(false)}
          />
        </Field>
      </div>
    </Section>
  );
}