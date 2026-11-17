"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Check, Copy, Heart, Landmark, Smartphone, X } from "lucide-react";

import giving from "@/data/giving";

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the person can still select the text */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-ink/5 px-3 text-xs font-semibold text-ink transition hover:bg-ink/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-success" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy
        </>
      )}
    </button>
  );
}

export default function GiveModal({ open, onClose }) {
  const closeRef = useRef(null);
  const [fundId, setFundId] = useState(giving.funds[0].id);

  const fund =
    giving.funds.find((item) => item.id === fundId) ?? giving.funds[0];

  const mobileMoney = giving.mobileMoney?.number ? giving.mobileMoney : null;

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="give-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-6 shadow-soft sm:p-8"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink transition hover:bg-ink/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30">
              <Heart className="h-5 w-5" aria-hidden="true" />
            </span>

            <h2
              id="give-title"
              className="mt-4 font-display text-2xl font-medium text-ink"
            >
              {giving.title}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-body">
              {giving.thanks}
            </p>

            {/* Fund tabs */}
            <div
              role="tablist"
              aria-label="Choose where to give"
              className="mt-6 grid grid-cols-2 gap-2"
            >
              {giving.funds.map((item) => {
                const active = item.id === fund.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFundId(item.id)}
                    className={clsx(
                      "rounded-2xl px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      active
                        ? "bg-ink text-white shadow-card"
                        : "bg-surface-muted text-body hover:text-ink"
                    )}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* Selected fund */}
            <div
              role="tabpanel"
              className="mt-4 rounded-2xl border border-line p-5"
            >
              <p className="text-sm leading-relaxed text-body">
                {fund.description}
              </p>

              {fund.accountNumber ? (
                <div className="mt-4">
                  {fund.bank && (
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-body">
                      <Landmark className="h-4 w-4" aria-hidden="true" />
                      {fund.bank}
                    </div>
                  )}

                  {fund.accountName && (
                    <p className="mt-2 text-sm text-body">{fund.accountName}</p>
                  )}

                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-xl font-semibold tabular-nums tracking-wide text-ink">
                      {fund.accountNumber}
                    </p>

                    <CopyButton
                      value={fund.accountNumber}
                      label="Copy account number"
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-surface-muted px-4 py-3 text-sm text-body">
                  Account details for this fund will be added soon. Please
                  contact the fellowship leaders to give in the meantime.
                </p>
              )}
            </div>

            {mobileMoney && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-line p-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-body">
                    <Smartphone className="h-4 w-4" aria-hidden="true" />
                    {mobileMoney.label}
                  </div>

                  {mobileMoney.name && (
                    <p className="mt-2 text-sm text-body">{mobileMoney.name}</p>
                  )}

                  <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
                    {mobileMoney.number}
                  </p>
                </div>

                <CopyButton
                  value={mobileMoney.number}
                  label="Copy mobile money number"
                />
              </div>
            )}

            <figure className="mt-6 border-t border-line pt-5">
              <blockquote className="font-display text-base italic leading-relaxed text-ink">
                &ldquo;{giving.verse.text}&rdquo;
              </blockquote>

              <figcaption className="mt-2 text-sm font-medium text-primary">
                {giving.verse.reference}
              </figcaption>
            </figure>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}