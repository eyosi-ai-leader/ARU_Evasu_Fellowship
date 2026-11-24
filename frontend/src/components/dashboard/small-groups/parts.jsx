"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

// "Main Campus Fellowship" -> "Main Campus"
export const shortCampusName = (name) =>
  String(name || "").replace(/\s+Fellowship$/i, "");

export const initialsOf = (name) =>
  String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export const inputClass =
  "h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-4 focus:ring-primary/10";

export const primaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-dark active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10";

export const secondaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10";

export function Avatar({ name, className = "h-9 w-9 text-xs" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-ember font-bold text-white shadow-sm ${className}`}
    >
      {initialsOf(name) || "?"}
    </span>
  );
}

const CHIP_TONES = {
  neutral: "bg-surface-muted text-body ring-1 ring-line",
  good: "bg-success/10 text-success",
  attention: "bg-accent/20 text-ink ring-1 ring-accent/40",
  info: "bg-primary/10 text-primary",
};

export function Chip({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${CHIP_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/*
 * The frame every dialog on these pages uses (same look as Change Role).
 * Escape or a click on the dark layer closes it, unless it is busy.
 */
export function ModalShell({
  title,
  subtitle,
  onClose,
  busy = false,
  wide = false,
  children,
  footer,
}) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape" && !busy) onClose?.();
    };

    document.addEventListener("keydown", handleKey);

    return () => document.removeEventListener("keydown", handleKey);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-soft ring-1 ring-line sm:rounded-3xl ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-xs leading-5 text-body">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-body transition hover:bg-surface-muted hover:text-ink active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {children}
        </div>

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-muted/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}