"use client";

import { useState } from "react";
import { Check, ChevronDown, HelpCircle, Loader2, X } from "lucide-react";

import { listRsvps, removeRsvp, setRsvp } from "@/lib/eventsApi";

const CHOICES = [
  { value: "going", label: "Going", icon: Check },
  { value: "maybe", label: "Maybe", icon: HelpCircle },
  { value: "not_going", label: "Can't go", icon: X },
];

const LABEL = { going: "Going", maybe: "Maybe", not_going: "Can't go" };

export default function EventRsvp({ item, onChanged }) {
  const rsvp = item.rsvp;

  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [guests, setGuests] = useState(rsvp?.myGuests || 0);
  const [answers, setAnswers] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  if (!rsvp) return null;

  async function run(key, action) {
    if (busy) return;

    setBusy(key);
    setError("");

    try {
      await action();
      await onChanged?.();

      if (showAnswers) setAnswers(await listRsvps(item.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const save = (response, count = guests) =>
    run(response, () =>
      setRsvp(item.id, {
        response,
        guests: response === "going" ? count : 0,
      })
    );

  async function toggleAnswers() {
    if (showAnswers) {
      setShowAnswers(false);
      return;
    }

    setShowAnswers(true);
    setLoadingAnswers(true);
    setError("");

    try {
      setAnswers(await listRsvps(item.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAnswers(false);
    }
  }

  const full = rsvp.full && rsvp.mine !== "going";

  return (
    <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{rsvp.going}</span>{" "}
          going
          {item.capacity ? ` of ${item.capacity} places` : ""} ·{" "}
          {rsvp.maybe} maybe
          {full && (
            <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
              Full
            </span>
          )}
        </p>

        <div role="group" aria-label="Your answer" className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
          {CHOICES.map((choice) => {
            const Icon = choice.icon;
            const active = rsvp.mine === choice.value;
            const disabled = Boolean(busy) || (choice.value === "going" && full);

            return (
              <button
                key={choice.value}
                type="button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => !active && save(choice.value)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${
                  active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {busy === choice.value ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Icon size={13} aria-hidden="true" />
                )}
                {choice.label}
              </button>
            );
          })}
        </div>
      </div>

      {rsvp.mine === "going" && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <label htmlFor={`guests-${item.id}`}>Guests you are bringing</label>

          <select
            id={`guests-${item.id}`}
            value={guests}
            disabled={Boolean(busy)}
            onChange={(event) => {
              const count = Number(event.target.value);
              setGuests(count);
              save("going", count);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
          >
            {[0, 1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-4">
        {rsvp.mine && (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => run("remove", () => removeRsvp(item.id))}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            Remove my answer
          </button>
        )}

        {item.canManage && (
          <button
            type="button"
            onClick={toggleAnswers}
            aria-expanded={showAnswers}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {showAnswers ? "Hide answers" : "View answers"}
            <ChevronDown size={14} aria-hidden="true" className={showAnswers ? "rotate-180" : ""} />
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>
      )}

      {showAnswers && (
        <div className="mt-3">
          {loadingAnswers || !answers ? (
            <p role="status" className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 size={13} className="animate-spin" /> Loading...
            </p>
          ) : answers.people.length === 0 ? (
            <p className="text-xs text-slate-500">No answers yet.</p>
          ) : (
            <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
              {answers.people.map((person, index) => (
                <li key={`${person.email}-${index}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{person.name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {person.memberNumber && `${person.memberNumber} · `}{person.email}
                    </span>
                  </span>

                  <span className="shrink-0 text-xs font-semibold text-slate-600">
                    {LABEL[person.response]}
                    {person.guests > 0 && ` +${person.guests}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}