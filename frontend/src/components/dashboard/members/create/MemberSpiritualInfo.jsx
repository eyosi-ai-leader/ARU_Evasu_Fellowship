"use client";

import MemberGregorianDateField from "./MemberGregorianDateField";
import { OTHER_OPTION } from "@/lib/ethiopiaLocations";
import {
  CHURCH_MINISTRIES,
  HIGH_SCHOOL_MINISTRIES,
  MINISTRY_ROLES,
} from "@/lib/ministryOptions";
import { Field, Section, fieldClass } from "./FormParts";

function MinistryBlock({
  title,
  description,
  prefix,
  options,
  form,
  errors,
  onChange,
}) {
  const ministry = form[`${prefix}Name`];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 md:col-span-2">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

      <p className="mt-0.5 mb-4 text-xs leading-5 text-slate-500">
        {description}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${prefix}Name`} label="Which ministry?">
          <select
            id={`${prefix}Name`}
            name={`${prefix}Name`}
            value={ministry}
            onChange={(event) => {
              onChange(event);

              // A new ministry clears the typed name and, if cleared, the role.
              onChange({ target: { name: `${prefix}Other`, value: "" } });

              if (!event.target.value) {
                onChange({ target: { name: `${prefix}Role`, value: "" } });
              }
            }}
            className={fieldClass(false)}
          >
            <option value="">Did not take part</option>

            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}

            <option value={OTHER_OPTION}>Other (write it below)</option>
          </select>
        </Field>

        {ministry && (
          <Field
            id={`${prefix}Role`}
            label="Their role"
            required
            error={errors[`${prefix}Role`]}
          >
            <select
              id={`${prefix}Role`}
              name={`${prefix}Role`}
              value={form[`${prefix}Role`]}
              onChange={onChange}
              aria-invalid={Boolean(errors[`${prefix}Role`])}
              className={fieldClass(errors[`${prefix}Role`])}
            >
              <option value="">Select role</option>

              {MINISTRY_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>
        )}

        {ministry === OTHER_OPTION && (
          <div className="sm:col-span-2">
            <Field
              id={`${prefix}Other`}
              label="Ministry name"
              required
              error={errors[`${prefix}Other`]}
            >
              <input
                id={`${prefix}Other`}
                type="text"
                name={`${prefix}Other`}
                value={form[`${prefix}Other`]}
                onChange={onChange}
                placeholder="e.g. Drama team"
                aria-invalid={Boolean(errors[`${prefix}Other`])}
                className={fieldClass(errors[`${prefix}Other`])}
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MemberSpiritualInfo({ form, errors = {}, onChange }) {
  return (
    <Section
      title="Spiritual Background"
      description="All of this is optional."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="previousChurch" label="Church attended before">
          <input
            id="previousChurch"
            type="text"
            name="previousChurch"
            value={form.previousChurch}
            onChange={onChange}
            className={fieldClass(false)}
          />
        </Field>

        <MemberGregorianDateField
          id="baptismDate"
          name="baptismDate"
          label="Baptism date"
          value={form.baptismDate}
          onChange={onChange}
          error={errors.baptismDate}
          newestYearsAgo={0}
          oldestYearsAgo={70}
        />

        <Field id="newChristian" label="Is the member a new Christian?">
          <select
            id="newChristian"
            name="newChristian"
            value={form.newChristian}
            onChange={onChange}
            className={fieldClass(false)}
          >
            <option value="no">No</option>
            <option value="yes">Yes, they recently started</option>
          </select>
        </Field>

        <MinistryBlock
          title="High school fellowship or ministry"
          description="Did they serve in a fellowship or ministry in high school?"
          prefix="highSchoolMinistry"
          options={HIGH_SCHOOL_MINISTRIES}
          form={form}
          errors={errors}
          onChange={onChange}
        />

        <MinistryBlock
          title="Church ministry"
          description="Have they served in a ministry at their church?"
          prefix="churchMinistry"
          options={CHURCH_MINISTRIES}
          form={form}
          errors={errors}
          onChange={onChange}
        />

        <div className="md:col-span-2">
          <Field
            id="spiritualJourney"
            label="Spiritual journey"
            help={`${form.spiritualJourney.length}/1000. Only fellowship leaders can read this.`}
          >
            <textarea
              id="spiritualJourney"
              name="spiritualJourney"
              value={form.spiritualJourney}
              onChange={onChange}
              rows={4}
              maxLength={1000}
              placeholder="How they came to know Christ and how they have grown."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </Field>
        </div>
      </div>
    </Section>
  );
}