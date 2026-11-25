"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import {
  Check,
  Copy,
  Heart,
  Landmark,
  Quote,
  Smartphone,
  X,
} from "lucide-react";

import Button from "@/components/shared/Button";
import giving from "../../../data/giving";

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
    <Button
      variant={copied ? "dark" : "accent"}
      size="sm"
      onClick={copy}
      className="shrink-0"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{label}</span>
          Copy
        </>
      )}
    </Button>
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
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="give-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-soft sm:rounded-[2rem]"
          >
            {/* Header */}
            <div className="relative isolate shrink-0 overflow-hidden bg-gradient-to-br from-primary to-primary-dark px-6 pb-7 pt-6 text-white sm:px-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-12 -z-10 h-44 w-44 rounded-full bg-accent/30 blur-3xl"
              />

              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X className="h-5 w-5" />
              </button>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-ink">
                <Heart className="h-6 w-6" aria-hidden="true" />
              </span>

              <h2
                id="give-title"
                className="mt-4 font-display text-3xl font-semibold tracking-tight"
              >
                {giving.title}
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">
                {giving.thanks}
              </p>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Where would you like to give?
              </p>

              <div
                role="tablist"
                aria-label="Choose where to give"
                className="mt-3 flex flex-wrap gap-2"
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
                        "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        active
                          ? "bg-primary text-white shadow-soft ring-primary"
                          : "bg-white text-ink ring-line hover:ring-primary/40"
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
                className="mt-5 rounded-3xl bg-surface-muted p-5 ring-1 ring-line"
              >
                <p className="text-sm leading-6 text-body">
                  {fund.description}
                </p>

                {fund.accountNumber ? (
                  <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-line">
                    {fund.bank && (
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                        <Landmark className="h-4 w-4" aria-hidden="true" />
                        {fund.bank}
                      </div>
                    )}

                    {fund.accountName && (
                      <p className="mt-2 text-sm text-body">
                        {fund.accountName}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="break-all font-display text-2xl font-semibold tabular-nums tracking-wide text-ink">
                        {fund.accountNumber}
                      </p>

                      <CopyButton
                        value={fund.accountNumber}
                        label="Copy account number"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-line">
                    <p className="text-sm leading-6 text-body">
                      Account details for this fund will be added soon. Please
                      contact the fellowship leaders to give in the meantime.
                    </p>

                    <Button
                      href="/contact"
                      variant="secondary"
                      size="sm"
                      arrow
                      onClick={onClose}
                      className="mt-3"
                    >
                      Contact us
                    </Button>
                  </div>
                )}
              </div>

              {mobileMoney && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-3xl bg-surface-muted p-5 ring-1 ring-line">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      <Smartphone className="h-4 w-4" aria-hidden="true" />
                      {mobileMoney.label}
                    </div>

                    {mobileMoney.name && (
                      <p className="mt-2 text-sm text-body">
                        {mobileMoney.name}
                      </p>
                    )}

                    <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">
                      {mobileMoney.number}
                    </p>
                  </div>

                  <CopyButton
                    value={mobileMoney.number}
                    label="Copy mobile money number"
                  />
                </div>
              )}

              {/* Verse */}
              <figure className="mt-6 flex gap-3 border-t border-line pt-5">
                <Quote
                  className="mt-1 h-5 w-5 shrink-0 text-accent"
                  aria-hidden="true"
                />

                <div>
                  <blockquote className="text-sm italic leading-6 text-ink">
                    {giving.verse.text}
                  </blockquote>

                  <figcaption className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    {giving.verse.reference}
                  </figcaption>
                </div>
              </figure>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}