"use client";

/*
 * Small pieces shared by every section of the Add / Edit member forms,
 * so all the fields look and behave the same on phones and computers.
 */

export const fieldClass = (error) =>
  `h-11 w-full rounded-2xl border bg-white px-4 text-sm text-ink outline-none transition placeholder:text-body/60 focus:ring-4 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-body/60 ${
    error
      ? "border-danger/50 focus:border-danger focus:ring-danger/10"
      : "border-line focus:border-primary focus:ring-primary/10"
  }`;

export function Section({ title, description, children }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-line sm:p-7">
      <div className="mb-5 sm:mb-6">
        <h2 className="flex items-center gap-3 font-display text-lg font-semibold text-ink">
          <span
            aria-hidden="true"
            className="h-5 w-1 rounded-full bg-accent"
          />
          {title}
        </h2>

        {description && (
          <p className="mt-1 pl-4 text-sm text-body">{description}</p>
        )}
      </div>

      {children}
    </section>
  );
}

export function Field({ id, label, required, error, help, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-ink"
      >
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>

      {children}

      {help && !error && (
        <p className="mt-1.5 text-xs text-body">{help}</p>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function ReadOnlyBox({ children, mono = false }) {
  return (
    <div
      className={`flex h-11 items-center rounded-2xl bg-surface-muted px-4 text-sm font-medium text-body ring-1 ring-line ${
        mono ? "font-mono" : ""
      }`}
    >
      {children}
    </div>
  );
}