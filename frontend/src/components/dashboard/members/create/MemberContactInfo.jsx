"use client";

import { Field, Section, fieldClass } from "./FormParts";

export default function MemberContactInfo({ form, errors = {}, onChange }) {
  return (
    <Section
      title="Contact Information"
      description="How to reach the member."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="email" label="Email" required error={errors.email}>
          <input
            id="email"
            type="email"
            name="email"
            inputMode="email"
            value={form.email}
            onChange={onChange}
            placeholder="member@example.com"
            autoComplete="off"
            aria-invalid={Boolean(errors.email)}
            className={fieldClass(errors.email)}
          />
        </Field>

        <Field id="phone" label="Phone" error={errors.phone}>
          <input
            id="phone"
            type="tel"
            name="phone"
            inputMode="tel"
            value={form.phone}
            onChange={onChange}
            placeholder="0911 000 000"
            className={fieldClass(errors.phone)}
          />
        </Field>

        <Field
          id="telegramUsername"
          label="Telegram username"
          error={errors.telegramUsername}
          help="Used for quick one-tap contact."
        >
          <input
            id="telegramUsername"
            type="text"
            name="telegramUsername"
            value={form.telegramUsername}
            onChange={onChange}
            placeholder="@username"
            autoCapitalize="none"
            autoComplete="off"
            className={fieldClass(errors.telegramUsername)}
          />
        </Field>

      </div>
    </Section>
  );
}