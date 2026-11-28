"use client";

import { Field, ReadOnlyBox, Section, fieldClass } from "./FormParts";

// Gregorian entry years, newest first.
// Students: this year back to 7 years ago. Graduates: the last 30 years.
function getEntryYears(isStudent) {
  const thisYear = new Date().getFullYear();
  const count = isStudent ? 8 : 31;

  return Array.from({ length: count }, (_, index) => {
    const year = thisYear - index;

    return { value: String(year), label: String(year) };
  });
}

/*
 * Campus, department, student information and home.
 *
 * mode "create": the campus is chosen (only campuses the person manages).
 * mode "edit":   the campus is shown but cannot be changed (moving a member
 *                to another campus is not supported yet).
 */
export default function MemberFellowshipInfo({
  form,
  errors = {},
  onChange,
  mode = "create",
  campuses = [],
  campusName = "",
  departments = [],
  departmentsLoading = false,
  smallGroup = "",
  family = "",
}) {
  const isStudent = form.academicStatus === "Student";
  const years = getEntryYears(isStudent);

  // A saved entry year outside the list must still be shown.
  if (
    form.entryYear &&
    !years.some((year) => year.value === String(form.entryYear))
  ) {
    years.push({
      value: String(form.entryYear),
      label: String(form.entryYear),
    });
  }

  return (
    <Section
      title="Fellowship & Student Information"
      description="Campus, department and when they started."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {mode === "create" ? (
          <Field
            id="fellowshipId"
            label="Campus fellowship"
            required
            error={errors.fellowshipId}
          >
            <select
              id="fellowshipId"
              name="fellowshipId"
              value={form.fellowshipId}
              onChange={onChange}
              aria-invalid={Boolean(errors.fellowshipId)}
              className={fieldClass(errors.fellowshipId)}
            >
              <option value="">Select campus</option>

              {campuses.map((campus) => (
                <option key={campus.id} value={String(campus.id)}>
                  {campus.name}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field
            id="campus"
            label="Campus fellowship"
            help="The campus can't be changed here."
          >
            <ReadOnlyBox>{campusName || "—"}</ReadOnlyBox>
          </Field>
        )}

        {mode === "edit" && (
          <>
            <Field
              id="smallGroup"
              label="Small groups"
              help="Set from the Small Groups page."
            >
              <ReadOnlyBox>{smallGroup || "Not yet in a small group"}</ReadOnlyBox>
            </Field>

            <Field
              id="family"
              label="Families"
              help="Set by the small group overseer."
            >
              <ReadOnlyBox>{family || "Not yet in a family"}</ReadOnlyBox>
            </Field>
          </>
        )}

        <Field
          id="departmentId"
          label="Department"
          required={mode === "create" && isStudent && departments.length > 0}
          error={errors.departmentId}
        >
          <select
            id="departmentId"
            name="departmentId"
            value={form.departmentId}
            onChange={onChange}
            disabled={!form.fellowshipId || departmentsLoading}
            aria-invalid={Boolean(errors.departmentId)}
            className={fieldClass(errors.departmentId)}
          >
            <option value="">
              {!form.fellowshipId
                ? "Select a campus first"
                : departmentsLoading
                  ? "Loading departments..."
                  : "Select department"}
            </option>

            {departments.map((department) => (
              <option key={department.id} value={String(department.id)}>
                {department.name}
              </option>
            ))}
          </select>
        </Field>

        <Field id="studentId" label="Student ID" error={errors.studentId}>
          <input
            id="studentId"
            type="text"
            name="studentId"
            value={form.studentId}
            onChange={onChange}
            placeholder="University student ID"
            autoComplete="off"
            className={fieldClass(errors.studentId)}
          />
        </Field>

        <Field id="academicStatus" label="Student or graduate">
          <select
            id="academicStatus"
            name="academicStatus"
            value={form.academicStatus}
            onChange={onChange}
            className={fieldClass(false)}
          >
            <option value="Student">Student</option>
            <option value="Graduate">Graduate</option>
          </select>
        </Field>

        <Field
          id="entryYear"
          label="Entry year"
          required={isStudent}
          error={errors.entryYear}
          help="The year they started at the university. The batch, year of study and expected graduation are worked out from it."
        >
          <select
            id="entryYear"
            name="entryYear"
            value={form.entryYear}
            onChange={onChange}
            aria-invalid={Boolean(errors.entryYear)}
            className={fieldClass(errors.entryYear)}
          >
            <option value="">Select year</option>

            {years.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(form.alumniContactConsent)}
            onChange={(event) =>
              onChange({
                target: {
                  name: "alumniContactConsent",
                  value: event.target.checked,
                },
              })
            }
            className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
          />

          <span className="text-sm leading-6 text-slate-600">
            <span className="block font-semibold text-slate-900">
              Stay in touch after graduation
            </span>
            Fellowship leaders may contact this member after they graduate.
          </span>
        </label>
      </div>
    </Section>
  );
}