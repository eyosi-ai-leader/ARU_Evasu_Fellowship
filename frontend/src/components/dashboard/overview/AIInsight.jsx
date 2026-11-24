"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function AIInsight() {
  const [insight, setInsight] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInsight = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to generate fellowship insights."
        );
      }

      setInsight(result.insight || "");
      setGeneratedAt(result.generatedAt || "");
    } catch (err) {
      setError(err.message || "Unable to load insights.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsight();
  }, [loadInsight]);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-soft sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-accent/25 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-ember/20 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-accent shadow-soft">
              <Sparkles size={21} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  <span className="h-0.5 w-5 rounded-full bg-accent" />
                  Fellowship AI Insight
                </p>

                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80 ring-1 ring-white/20">
                  AI-powered
                </span>
              </div>

              <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                Membership intelligence
              </h3>

              {loading ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-white/75">
                  <RefreshCw size={15} className="animate-spin text-accent" />
                  Analyzing the latest fellowship statistics...
                </div>
              ) : error ? (
                <div className="mt-3 flex items-start gap-2 rounded-2xl bg-danger/15 p-3 text-sm leading-6 text-white/90 ring-1 ring-danger/30">
                  <AlertCircle size={17} className="mt-1 shrink-0 text-accent" />
                  <p className="min-w-0 break-words">{error}</p>
                </div>
              ) : (
                <div className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-white/80">
                  {insight}
                </div>
              )}

              {!loading && !error && generatedAt && (
                <p className="mt-4 flex items-center gap-2 text-xs text-white/60">
                  <CheckCircle2 size={14} className="text-accent" />
                  Generated from verified CHMS statistics ·{" "}
                  {new Date(generatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={loadInsight}
            disabled={loading}
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            {loading ? "Analyzing..." : "Refresh insight"}
          </button>
        </div>
      </div>
    </section>
  );
}