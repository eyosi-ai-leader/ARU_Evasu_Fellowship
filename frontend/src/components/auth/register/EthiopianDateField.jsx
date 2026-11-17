"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";

import {
  ETHIOPIAN_MONTHS,
  currentEthiopianYear,
  daysInEthiopianMonth,
  formatEcValue,
  parseEcValue,
} from "@/lib/ethiopianCalendar";

import { Field, controlClass } from "./RegisterFields";

function MiniSelect({ label, value, onChange, hasError, children }) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={onChange}
        className={`${controlClass(hasError)} appearance-none pr-9`}
      >
        {children}
      </select>

      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

const maxDayFor = (year, month) => {
  if (!month) return 30;

  if (Number(month) === 13) {
    return year ? daysInEthiopianMonth(Number(year), 13) : 6;
  }

  return 30;
};

/**
 * Date picker in the Ethiopian calendar.
 *
 * value    "year-month-day" in E.C. (or "")
 * onChange gets an event-like object { target: { name, value } }
 * newestYearsAgo / oldestYearsAgo: the year list runs from
 *   (this E.C. year - newestYearsAgo) back to (this E.C. year - oldestYearsAgo)
 */
export default function EthiopianDateField({
  label,
  required,
  hint,
  error,
  name,
  value,
  onChange,
  newestYearsAgo = 0,
  oldestYearsAgo = 80,
  className = "",
}) {
  const id = useId();
  const parts = parseEcValue(value);

  const thisYear = currentEthiopianYear();
  const newest = thisYear - newestYearsAgo;
  const oldest = thisYear - oldestYearsAgo;

  const years = Array.from(
    { length: newest - oldest + 1 },
    (_, index) => newest - index
  );

  const days = Array.from(
    { length: maxDayFor(parts.year, parts.month) },
    (_, index) => index + 1
  );

  const update = (key, nextValue) => {
    const next = { ...parts, [key]: nextValue };

    // Keep the day valid for the chosen month / year (for example Pagume).
    if (
      next.day &&
      Number(next.day) > maxDayFor(next.year, next.month)
    ) {
      next.day = "";
    }

    onChange({
      target: { name, value: formatEcValue(next), type: "text" },
    });
  };

  const hasError = Boolean(error);

  return (
    <Field
      label={`${label} (E.C.)`}
      required={required}
      hint={hint}
      error={error}
      htmlFor={id}
      className={className}
    >
      <div
        id={id}
        role="group"
        aria-label={`${label} in the Ethiopian calendar`}
        className="grid grid-cols-[0.9fr_1.9fr_1.1fr] gap-2"
      >
        <MiniSelect
          label="Day"
          value={parts.day}
          hasError={hasError}
          onChange={(event) => update("day", event.target.value)}
        >
          <option value="">Day</option>

          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </MiniSelect>

        <MiniSelect
          label="Month"
          value={parts.month}
          hasError={hasError}
          onChange={(event) => update("month", event.target.value)}
        >
          <option value="">Month</option>

          {ETHIOPIAN_MONTHS.map((month, index) => (
            <option key={month.en} value={index + 1}>
              {month.en} ({month.am})
            </option>
          ))}
        </MiniSelect>

        <MiniSelect
          label="Year"
          value={parts.year}
          hasError={hasError}
          onChange={(event) => update("year", event.target.value)}
        >
          <option value="">Year</option>

          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </MiniSelect>
      </div>
    </Field>
  );
}