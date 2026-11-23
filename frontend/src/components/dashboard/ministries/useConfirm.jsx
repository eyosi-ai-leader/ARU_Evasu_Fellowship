"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";

const TONES = {
  danger: {
    circle: "bg-red-50 text-red-600 ring-8 ring-red-50/60",
    button: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-300",
  },
  warning: {
    circle: "bg-amber-50 text-amber-600 ring-8 ring-amber-50/60",
    button: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-300",
  },
  default: {
    circle: "bg-slate-100 text-slate-700 ring-8 ring-slate-100/60",
    button: "bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-300",
  },
};

function ConfirmDialog({
  title,
  message,
  note,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  icon: Icon = AlertTriangle,
  onConfirm,
  onCancel,
}) {
  const styles = TONES[tone] || TONES.default;
  const cancelRef = useRef(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    cancelRef.current?.focus();

    const handleKey = (event) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleKey);

    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl"
      >
        <span
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${styles.circle}`}
        >
          <Icon size={22} aria-hidden="true" />
        </span>

        <h2 className="mt-5 text-base font-bold text-slate-900">{title}</h2>

        {message && (
          <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        )}

        {note && <p className="mt-2 text-xs leading-5 text-slate-400">{note}</p>}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={() => {
              setWorking(true);
              onConfirm();
            }}
            disabled={working}
            className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60 ${styles.button}`}
          >
            {working && <Loader2 size={15} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/*
 * A nicer window.confirm.
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *
 *   const ok = await confirm({
 *     title: "Delete ministry?",
 *     message: "...",
 *     note: "...",                 // optional small text
 *     confirmLabel: "Delete",
 *     tone: "danger",              // "danger" | "warning" | "default"
 *     icon: Trash2,                // optional lucide icon
 *   });
 *
 *   if (!ok) return;
 *
 * Render {confirmDialog} once in the component's JSX.
 */
export default function useConfirm() {
  const [options, setOptions] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (next) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setOptions(next);
      }),
    []
  );

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  }, []);

  const confirmDialog = options ? (
    <ConfirmDialog
      {...options}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null;

  return { confirm, confirmDialog };
}
