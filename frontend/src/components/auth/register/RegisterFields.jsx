"use client";

import { useId } from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";

// Pill shape for inputs and selects. Textareas stay rounded-2xl.
const controlBase =
  "w-full rounded-full [&:is(textarea)]:rounded-2xl border bg-white px-5 py-3 text-[15px] text-ink shadow-xs outline-none transition placeholder:text-body/60 focus:ring-4 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-body/60";

export const controlClass = (hasError) =>
  `${controlBase} ${
    hasError
      ? "border-danger/50 focus:border-danger focus:ring-danger/10"
      : "border-line hover:border-primary/30 focus:border-primary focus:ring-primary/10"
  }`;

export function FieldError({ message }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 px-1 text-xs font-medium text-danger"
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
          className="mb-1.5 block px-1 text-sm font-medium text-ink"
        >
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}

      {children}

      {hint && !error && (
        <p className="mt-1.5 px-1 text-xs text-body">{hint}</p>
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
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-body"
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
        className={`grid gap-1 rounded-full bg-surface-muted p-1 ring-1 ${
          error ? "ring-danger/40" : "ring-line"
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

            <span className="flex items-center justify-center rounded-full px-3 py-2.5 text-sm font-medium text-body transition hover:text-primary peer-checked:bg-white peer-checked:text-primary peer-checked:shadow-card peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20">
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
      <label className="flex cursor-pointer items-start gap-3.5 rounded-2xl bg-white p-4 ring-1 ring-line transition hover:ring-primary/40 has-[:checked]:bg-primary/[0.04] has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />

        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-line bg-white text-white transition peer-checked:border-primary peer-checked:bg-primary peer-checked:[&>svg]:opacity-100">
          <Check
            size={13}
            strokeWidth={3}
            className="opacity-0 transition"
            aria-hidden="true"
          />
        </span>

        <span className="min-w-0">
          <span className="block text-sm font-medium text-ink">
            {title}
          </span>

          {description && (
            <span className="mt-0.5 block text-sm leading-6 text-body">
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
    <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon size={20} aria-hidden="true" />
          </span>
        )}

        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            {title}
          </h2>

          {description && (
            <p className="mt-0.5 text-sm text-body">{description}</p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}