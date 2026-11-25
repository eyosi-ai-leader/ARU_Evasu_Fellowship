"use client";

import { useId } from "react";
import { BookOpen, GraduationCap, MapPin, ShieldCheck, Users } from "lucide-react";

import {
  ETHIOPIA_REGIONS,
  OTHER_OPTION,
  getCities,
} from "@/lib/ethiopiaLocations";
import GregorianDateField from "./GregorianDateField";

import {
  Field,
  SectionCard,
  SegmentedRadio,
  SelectInput,
  TextInput,
  controlClass,
} from "./RegisterFields";

const HIGH_SCHOOL_MINISTRIES = [
  "Evangelical students' fellowship",
  "Bible study or Christian club",
  "Worship or choir team",
  "Prayer team",
  "Evangelism or outreach",
  "Sunday school or youth group",
  "Media or technical team",
  "Ushering or hospitality",
];

const CHURCH_MINISTRIES = [
  "Choir or worship team",
  "Sunday school or children's ministry",
  "Youth ministry",
  "Prayer ministry",
  "Evangelism or outreach",
  "Ushering or hospitality",
  "Media or technical team",
  "Bible study or small group",
  "Counseling or care ministry",
  "Church administration",
];

const MINISTRY_ROLES = ["Member", "Leader", "Volunteer or helper", "Other"];

const JOURNEY_MAX = 1000;

function TextArea({
  label,
  hint,
  error,
  value,
  maxLength,
  className = "",
  ...props
}) {
  const id = useId();

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      htmlFor={id}
      className={className}
    >
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        className={`${controlClass(Boolean(error))} resize-none`}
        {...props}
      />

      <p className="mt-1.5 text-right text-xs text-body/60">
        {value.length}/{maxLength}
      </p>
    </Field>
  );
}

function MinistryBlock({
  icon: Icon,
  title,
  description,
  prefix,
  options,
  formData,
  errors,
  onChange,
}) {
  const ministry = formData[`${prefix}Name`];

  return (
    <div className="rounded-2xl bg-surface-muted/60 p-5 ring-1 ring-line">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon size={18} aria-hidden="true" />
        </span>

        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>

          <p className="mt-0.5 text-xs leading-5 text-body">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput
          label="Which ministry?"
          name={`${prefix}Name`}
          value={ministry}
          onChange={onChange}
        >
          <option value="">I did not take part</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}

          <option value={OTHER_OPTION}>Other (write it below)</option>
        </SelectInput>

        {ministry && (
          <SelectInput
            label="Your role"
            required
            name={`${prefix}Role`}
            value={formData[`${prefix}Role`]}
            onChange={onChange}
            error={errors[`${prefix}Role`]}
          >
            <option value="">Select role</option>

            {MINISTRY_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </SelectInput>
        )}

        {ministry === OTHER_OPTION && (
          <TextInput
            className="sm:col-span-2"
            label="Ministry name"
            required
            name={`${prefix}Other`}
            value={formData[`${prefix}Other`]}
            onChange={onChange}
            placeholder="e.g. Drama team"
            error={errors[`${prefix}Other`]}
          />
        )}
      </div>
    </div>
  );
}

export default function PublicRegisterBackgroundInfo({
  formData,
  errors,
  onChange,
}) {
  const cities = getCities(formData.homeRegion);

  return (
    <>
      <SectionCard
        icon={MapPin}
        title="Where you are from"
        description="Where you or your family lived before you came to campus. All optional."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectInput
            label="Region"
            name="homeRegion"
            value={formData.homeRegion}
            onChange={onChange}
          >
            <option value="">Select region</option>

            {ETHIOPIA_REGIONS.map((region) => (
              <option key={region.name} value={region.name}>
                {region.label ?? region.name}
              </option>
            ))}
          </SelectInput>

          <SelectInput
            label="City or town"
            name="homeCity"
            value={formData.homeCity}
            onChange={onChange}
            disabled={!formData.homeRegion}
          >
            <option value="">
              {formData.homeRegion ? "Select city or town" : "Select region first"}
            </option>

            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}

            {formData.homeRegion && (
              <option value={OTHER_OPTION}>Other (write your town)</option>
            )}
          </SelectInput>

          {formData.homeCity === OTHER_OPTION && (
            <TextInput
              className="sm:col-span-2"
              label="Your city or town"
              required
              name="homeTownOther"
              value={formData.homeTownOther}
              onChange={onChange}
              placeholder="Type the name of your town"
              error={errors.homeTownOther}
            />
          )}

          <TextInput
            className="sm:col-span-2"
            label="Specific place or area"
            name="address"
            value={formData.address}
            onChange={onChange}
            placeholder="e.g. woreda, kebele, village or neighborhood"
            hint="Optional"
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={BookOpen}
        title="Spiritual background"
        description="All optional. Share only what you are comfortable with."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Church you attended before"
            name="previousChurch"
            value={formData.previousChurch}
            onChange={onChange}
          />

          <GregorianDateField
            label="Baptism date"
            name="baptismDate"
            value={formData.baptismDate}
            onChange={onChange}
            error={errors.baptismDate}
            newestYearsAgo={0}
            oldestYearsAgo={70}
          />

          <SegmentedRadio
            className="sm:col-span-2"
            label="Are you a new Christian?"
            name="newChristian"
            value={formData.newChristian}
            onChange={onChange}
            options={[
              { value: "no", label: "No" },
              { value: "yes", label: "Yes, I recently started" },
            ]}
          />
        </div>

        <div className="mt-6 space-y-4">
          <MinistryBlock
            icon={GraduationCap}
            title="High school fellowship or ministry"
            description="Did you serve in a fellowship or ministry in high school?"
            prefix="highSchoolMinistry"
            options={HIGH_SCHOOL_MINISTRIES}
            formData={formData}
            errors={errors}
            onChange={onChange}
          />

          <MinistryBlock
            icon={Users}
            title="Church ministry"
            description="Have you served in a ministry at your church?"
            prefix="churchMinistry"
            options={CHURCH_MINISTRIES}
            formData={formData}
            errors={errors}
            onChange={onChange}
          />
        </div>

        <TextArea
          className="mt-6"
          label="Your spiritual journey"
          name="spiritualJourney"
          value={formData.spiritualJourney}
          onChange={onChange}
          rows={5}
          maxLength={JOURNEY_MAX}
          placeholder="Tell us how you came to know Christ, how you have grown, and what you hope for in this fellowship."
          hint="Optional. Only fellowship leaders can read this."
        />

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-surface-muted p-4 ring-1 ring-line">
          <ShieldCheck
            size={20}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-primary"
          />

          <p className="text-sm leading-6 text-body">
            <span className="font-semibold text-ink">
              Your account will be registered as a Member.
            </span>{" "}
            Your role and account status are managed by the fellowship
            leaders and cannot be changed during registration.
          </p>
        </div>
      </SectionCard>
    </>
  );
}