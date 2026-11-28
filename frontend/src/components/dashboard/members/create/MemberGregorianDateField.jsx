"use client";

import { Field, fieldClass } from "./FormParts";

// Formats a Date as YYYY-MM-DD using the local time zone.
function toInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
 * Gregorian (G.C.) date input for the dashboard member forms.
 * Same behavior as the public registration GregorianDateField.
 */
export default function MemberGregorianDateField({
  id,
  name,
  label,
  help,
  error,
  value,
  onChange,
  required = false,
  newestYearsAgo = 0,
  oldestYearsAgo = 100,
}) {
  const today = new Date();

  const newest = new Date(
    today.getFullYear() - newestYearsAgo,
    today.getMonth(),
    today.getDate()
  );

  const oldest = new Date(
    today.getFullYear() - oldestYearsAgo,
    today.getMonth(),
    today.getDate()
  );

  return (
    <Field id={id} label={label} help={help} required={required} error={error}>
      <input
        id={id}
        type="date"
        name={name}
        value={value || ""}
        onChange={onChange}
        min={toInputValue(oldest)}
        max={toInputValue(newest)}
        aria-invalid={Boolean(error)}
        className={fieldClass(error)}
      />
    </Field>
  );
}