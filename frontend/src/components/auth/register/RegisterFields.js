"use client";

import { useId } from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";

const controlBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export const controlClass = (hasError) =>
  `${controlBase} ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
      : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10"
  }`;

export function FieldError({ message }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"
    >
      <AlertCircle size={13} aria-hidden="true" />
      {message}
    </p>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  className = "",
  children,
}) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </label>
      )}

      {children}

      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}

      <FieldError message={error} />
    </div>
  );
}

export function TextInput({
  label,
  required,
  hint,
  error,
  className = "",
  trailing,
  ...props
}) {
  const id = useId();

  return (
    <Field
      label={label}
      required={required}
      hint={hint}
      error={error}
      htmlFor={id}
      className={className}
    >
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          className={`${controlClass(Boolean(error))} ${
            trailing ? "pr-12" : ""
          }`}
          {...props}
        />

        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {trailing}
          </div>
        )}
      </div>
    </Field>
  );
}

export function SelectInput({
  label,
  required,
  hint,
  error,
  className = "",
  children,
  ...props
}) {
  const id = useId();

  return (
    <Field
      label={label}
      required={required}
      hint={hint}
      error={error}
      htmlFor={id}
      className={className}
    >
      <div className="relative">
        <select
          id={id}
          aria-invalid={Boolean(error)}
          className={`${controlClass(Boolean(error))} appearance-none pr-11`}
          {...props}
        >
          {children}
        </select>

        <ChevronDown
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </Field>
  );
}

/**
 * Two or three options in one pill (for example Male / Female).
 */
export function SegmentedRadio({
  label,
  required,
  error,
  name,
  value,
  onChange,
  options,
  className = "",
}) {
  return (
    <Field
      label={label}
      required={required}
      error={error}
      className={className}
    >
      <div
        role="radiogroup"
        aria-label={label}
        className={`grid gap-1 rounded-xl bg-slate-100 p-1 ${
          error ? "ring-1 ring-red-300" : ""
        }`}
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              className="peer sr-only"
            />

            <span className="flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow-sm peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-500/20">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </Field>
  );
}

export function CheckboxCard({
  name,
  checked,
  onChange,
  title,
  description,
  error,
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3.5 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50/60 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-indigo-500/15">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />

        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-white transition peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-checked:[&>svg]:opacity-100">
          <Check
            size={13}
            strokeWidth={3}
            className="opacity-0 transition"
            aria-hidden="true"
          />
        </span>

        <span className="min-w-0">
          <span className="block text-sm font-medium text-slate-800">
            {title}
          </span>

          {description && (
            <span className="mt-0.5 block text-sm leading-6 text-slate-500">
              {description}
            </span>
          )}
        </span>
      </label>

      <FieldError message={error} />
    </div>
  );
}

export function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Icon size={20} aria-hidden="true" />
          </span>
        )}

        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h2>

          {description && (
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}