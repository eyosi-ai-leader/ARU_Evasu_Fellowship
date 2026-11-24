"use client";

import { Building2, Check, GraduationCap } from "lucide-react";

import { getEntryYearOptions } from "@/lib/studentBatch";

import {
  CheckboxCard,
  FieldError,
  SectionCard,
  SegmentedRadio,
  SelectInput,
  TextInput,
} from "./RegisterFields";

export default function PublicRegisterCampusInfo({
  formData,
  errors,
  onChange,
  fellowships,
  fellowshipsLoading,
  fellowshipsError,
  onRetry,
  departments,
  departmentsLoading,
}) {
  const isGraduate = formData.academicStatus === "Graduate";

  // Entry year (E.C.): the year they started at the university.
  // Students: this year back to 7 years ago. Graduates: the last 30 years.
  const years = getEntryYearOptions(!isGraduate);

  const needsDepartment =
    formData.academicStatus === "Student" && departments.length > 0;

  const selectedFellowship = fellowships.find(
    (fellowship) => String(fellowship.id) === String(formData.fellowshipId)
  );

  return (
    <>
      <SectionCard
        icon={Building2}
        title="Campus fellowship"
        description="Pick the campus fellowship you belong to."
      >
        {fellowshipsError && (
          <div
            role="alert"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            <span>{fellowshipsError}</span>

            <button
              type="button"
              onClick={onRetry}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <div
          role="radiogroup"
          aria-label="Campus fellowship"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {fellowshipsLoading
            ? [0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-[76px] animate-pulse rounded-2xl bg-surface-muted lg:h-[150px]"
                />
              ))
            : fellowships.map((fellowship) => (
                <label
                  key={fellowship.id}
                  className="relative flex cursor-pointer items-center gap-3.5 rounded-2xl bg-white p-4 ring-1 ring-line transition duration-300 hover:-translate-y-0.5 hover:shadow-soft hover:ring-primary/40 has-[:checked]:bg-primary/[0.04] has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20 lg:min-h-[150px] lg:flex-col lg:items-start lg:justify-between lg:p-5"
                >
                  <input
                    type="radio"
                    name="fellowshipId"
                    value={fellowship.id}
                    checked={
                      String(formData.fellowshipId) === String(fellowship.id)
                    }
                    onChange={onChange}
                    className="peer sr-only"
                  />

                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition peer-checked:bg-gradient-to-br peer-checked:from-primary peer-checked:to-primary-dark peer-checked:text-accent lg:h-12 lg:w-12">
                    <Building2 size={20} aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1 text-sm font-semibold leading-5 text-ink lg:flex-none lg:text-[15px]">
                    {fellowship.name}
                  </span>

                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-white transition peer-checked:border-primary peer-checked:bg-primary peer-checked:[&>svg]:opacity-100 lg:absolute lg:right-4 lg:top-4">
                    <Check
                      size={12}
                      strokeWidth={3}
                      className="opacity-0"
                      aria-hidden="true"
                    />
                  </span>
                </label>
              ))}
        </div>

        <FieldError message={errors.fellowshipId} />
      </SectionCard>

      <SectionCard
        icon={GraduationCap}
        title="Your studies"
        description="This helps leaders find and support you."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SegmentedRadio
            className="sm:col-span-2"
            label="I am a"
            required
            name="academicStatus"
            value={formData.academicStatus}
            onChange={onChange}
            options={[
              { value: "Student", label: "Current student" },
              { value: "Graduate", label: "Graduate" },
            ]}
          />

          <SelectInput
            label="Entry year (E.C.)"
            required
            name="entryYear"
            value={formData.entryYear}
            onChange={onChange}
            error={errors.entryYear}
            hint="The year you started at the university"
          >
            <option value="">Select year</option>

            {years.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </SelectInput>

          {formData.fellowshipId && (
            <div>
              {departmentsLoading ? (
                <p className="pt-9 text-sm text-body">
                  Loading departments...
                </p>
              ) : departments.length > 0 ? (
                <SelectInput
                  label="Department"
                  required={needsDepartment}
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={onChange}
                  error={errors.departmentId}
                  hint={
                    selectedFellowship
                      ? `Showing departments of ${selectedFellowship.name}`
                      : undefined
                  }
                >
                  <option value="">Select department</option>

                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </SelectInput>
              ) : (
                <p className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-body ring-1 ring-line">
                  No departments are listed for this campus yet. You can
                  continue without one.
                </p>
              )}
            </div>
          )}

          <TextInput
            label="Student ID"
            name="studentId"
            value={formData.studentId}
            onChange={onChange}
            placeholder="Optional"
          />
        </div>

        <div className="mt-6">
          <CheckboxCard
            name="alumniContactConsent"
            checked={formData.alumniContactConsent}
            onChange={onChange}
            title="Stay in touch after graduation"
            description="Fellowship leaders may contact me after I graduate."
          />
        </div>
      </SectionCard>
    </>
  );
}