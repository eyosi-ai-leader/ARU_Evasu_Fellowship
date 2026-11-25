"use client";

import { useId } from "react";

import { Field, controlClass } from "./RegisterFields";

// Formats a Date as YYYY-MM-DD using the local time zone.
function toInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function GregorianDateField({
  label,
  hint,
  error,
  className = "",
  newestYearsAgo = 0,
  oldestYearsAgo = 100,
  ...props
}) {
  const id = useId();

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
    <Field
      label={label}
      hint={hint}
      error={error}
      htmlFor={id}
      className={className}
    >
      <input
        id={id}
        type="date"
        min={toInputValue(oldest)}
        max={toInputValue(newest)}
        aria-invalid={Boolean(error)}
        className={controlClass(Boolean(error))}
        {...props}
      />
    </Field>
  );
}