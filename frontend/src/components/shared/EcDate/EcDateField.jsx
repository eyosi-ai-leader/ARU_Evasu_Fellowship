"use client";

import {
  ETHIOPIAN_MONTHS,
  currentEthiopianYear,
  daysInEthiopianMonth,
  formatEcValue,
  parseEcValue,
} from "@/lib/ethiopianCalendar";

/*
 * A date the person picks in the Ethiopian calendar (E.C.):
 * Day, Month and Year as three drop-downs.
 *
 * value    "year-month-day" in E.C. ("" when empty)
 * onChange gets { target: { name, value } } like a normal input, so it
 *          works with the same handleChange as every other field.
 */

const selectClass = (error) =>
  `h-11 w-full rounded-xl border bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${
    error
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
  }`;

export default function EcDateField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  newestYearsAgo = 0,
  oldestYearsAgo = 80,
  help,
}) {
  const parts = parseEcValue(value);
  const now = currentEthiopianYear();

  const years = [];

  // Same year range names as the public registration form.
  for (let year = now - newestYearsAgo; year >= now - oldestYearsAgo; year -= 1) {
    years.push(year);
  }

  // A saved year outside the list must still be shown.
  if (parts.year && !years.includes(Number(parts.year))) {
    years.push(Number(parts.year));
    years.sort((a, b) => b - a);
  }

  const yearNumber = Number(parts.year) || now;
  const dayCount = daysInEthiopianMonth(yearNumber, Number(parts.month) || 1);

  function update(next) {
    const merged = { ...parts, ...next };

    // Keep the day valid when the month or year changes (Pagume has 5 or 6 days).
    if (merged.day && merged.month) {
      const max = daysInEthiopianMonth(
        Number(merged.year) || now,
        Number(merged.month)
      );

      if (Number(merged.day) > max) {
        merged.day = String(max);
      }
    }

    onChange({ target: { name, value: formatEcValue(merged) } });
  }

  return (
    <div>
      <label
        htmlFor={`${id}-day`}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
        <span className="ml-1.5 text-xs font-normal text-slate-400">
          (E.C.)
        </span>
      </label>

      <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
        <select
          id={`${id}-day`}
          value={parts.day}
          onChange={(event) => update({ day: event.target.value })}
          aria-label={`${label}: day`}
          aria-invalid={Boolean(error)}
          className={selectClass(error)}
        >
          <option value="">Day</option>

          {Array.from({ length: dayCount }, (_, index) => index + 1).map(
            (day) => (
              <option key={day} value={String(day)}>
                {day}
              </option>
            )
          )}
        </select>

        <select
          value={parts.month}
          onChange={(event) => update({ month: event.target.value })}
          aria-label={`${label}: month`}
          aria-invalid={Boolean(error)}
          className={selectClass(error)}
        >
          <option value="">Month</option>

          {ETHIOPIAN_MONTHS.map((month, index) => (
            <option key={month.en} value={String(index + 1)}>
              {month.en} ({month.am})
            </option>
          ))}
        </select>

        <select
          value={parts.year}
          onChange={(event) => update({ year: event.target.value })}
          aria-label={`${label}: year`}
          aria-invalid={Boolean(error)}
          className={selectClass(error)}
        >
          <option value="">Year</option>

          {years.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {help && !error && (
        <p className="mt-1.5 text-xs text-slate-400">{help}</p>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}