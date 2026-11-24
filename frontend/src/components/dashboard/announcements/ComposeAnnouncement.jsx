"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  ChevronDown,
  Loader2,
  Mail,
  Megaphone,
  Send,
  Users,
} from "lucide-react";

import AudiencePicker, {
  audienceIsEmpty,
  emptyAudience,
  toAudiencePayload,
} from "./AudiencePicker";
import AnnouncementPreview from "./AnnouncementPreview";
import { PRIORITIES, fieldClass, formatWhen, nowForInput } from "./parts";
import {
  createAnnouncement,
  getAudienceOptions,
  previewAudience,
  sendTestAnnouncement,
} from "@/lib/announcementApi";

const MAX_MESSAGE = 5000;

const DELIVERY_OPTIONS = [
  {
    value: "both",
    label: "Dashboard + email",
    description: "Shown in each member's dashboard and sent by email too.",
    icon: Megaphone,
  },
  {
    value: "dashboard",
    label: "Dashboard only",
    description: "Shown in the dashboard and the notification bell. No emails.",
    icon: Bell,
  },
  {
    value: "email",
    label: "Email only",
    description: "Sent by email. It does not appear in the dashboard.",
    icon: Mail,
  },
];

const people = (count) => (count === 1 ? "person" : "people");

const URL_PATTERN = /^(https?:\/\/\S+|\/(?!\/)\S*)$/i;

// A leader who can only reach one kind of group starts with it selected.
function initialAudience(options) {
  const leaderOnly =
    !options.canSendToEveryone && options.campuses.length === 0;

  if (leaderOnly && options.ministries.length > 0 && options.smallGroups.length === 0) {
    return { ...emptyAudience, ministryIds: options.ministries.map((item) => item.id) };
  }

  if (leaderOnly && options.smallGroups.length > 0 && options.ministries.length === 0) {
    return { ...emptyAudience, smallGroupIds: options.smallGroups.map((item) => item.id) };
  }

  return emptyAudience;
}

function statsNote(stats, delivery) {
  if (!stats) return "";

  const reachable =
    delivery === "email" ? stats.active - stats.notVerified : stats.active;

  const parts = [];

  if (reachable < stats.total) {
    parts.push(
      `${reachable} of the ${stats.total} members you can reach can ${
        delivery === "email"
          ? "receive announcement emails"
          : "see announcements in the dashboard"
      }.`
    );
  }

  if (delivery === "both" && stats.notVerified > 0) {
    parts.push(
      `${stats.notVerified} ${
        stats.notVerified === 1 ? "has" : "have"
      } not verified their email and will only see it in the dashboard.`
    );
  }

  return parts.join(" ");
}

function Step({ number, title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          {number}
        </span>

        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>

          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function Label({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-slate-700"
    >
      {children}
    </label>
  );
}

export default function ComposeAnnouncement({ onSent }) {
  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState("");

  const [audience, setAudience] = useState(emptyAudience);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Optional extras
  const [moreOpen, setMoreOpen] = useState(false);
  const [priority, setPriority] = useState("normal");
  const [category, setCategory] = useState("");
  const [pinned, setPinned] = useState(false);
  const [actionLabel, setActionLabel] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [delivery, setDelivery] = useState("both");
  const [whenMode, setWhenMode] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");

  const [preview, setPreview] = useState({ loading: false, data: null, error: "" });
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    getAudienceOptions()
      .then((data) => {
        if (cancelled) return;

        setOptions(data);
        setAudience(initialAudience(data));
      })
      .catch((err) => {
        if (!cancelled) setOptionsError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const payload = useMemo(() => toAudiencePayload(audience), [audience]);

  // How many people this reaches.
  useEffect(() => {
    setConfirming(false);

    if (!payload) {
      setPreview({ loading: false, data: null, error: "" });
      return;
    }

    let cancelled = false;

    setPreview((current) => ({ ...current, loading: true, error: "" }));

    const timer = setTimeout(async () => {
      try {
        const data = await previewAudience(payload, delivery);

        if (!cancelled) setPreview({ loading: false, data, error: "" });
      } catch (err) {
        if (!cancelled) {
          setPreview({ loading: false, data: null, error: err.message });
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [payload, delivery]);

  // Problems with the optional settings.
  const errors = useMemo(() => {
    const next = {};
    const url = actionUrl.trim();

    if (url && !URL_PATTERN.test(url)) {
      next.actionUrl =
        "Start the link with https:// (or / for a page of this portal).";
    } else if (actionLabel.trim() && !url) {
      next.actionUrl = "Add the link this button opens.";
    }

    if (whenMode === "later") {
      if (!scheduledAt) {
        next.scheduledAt = "Choose when to send it.";
      } else if (new Date(scheduledAt).getTime() < Date.now() + 60000) {
        next.scheduledAt = "Choose a time at least a minute from now.";
      }
    }

    if (expiresAt) {
      const start =
        whenMode === "later" && scheduledAt
          ? new Date(scheduledAt).getTime()
          : Date.now();

      if (new Date(expiresAt).getTime() <= start) {
        next.expiresAt = "The expiry must be after the time it is sent.";
      }
    }

    return next;
  }, [actionUrl, actionLabel, whenMode, scheduledAt, expiresAt]);

  const data = preview.data;
  const reached = data ? (delivery === "email" ? data.emails : data.reach) : 0;
  const messageOk = message.trim().length >= 10;
  const subjectOk = subject.trim().length > 0;

  const dailyExceeded =
    whenMode === "now" && data && data.emails > data.emailsLeftToday;

  const canSend =
    subjectOk &&
    messageOk &&
    !audienceIsEmpty(audience) &&
    reached > 0 &&
    !data?.tooMany &&
    !dailyExceeded &&
    !preview.loading &&
    !sending &&
    Object.keys(errors).length === 0;

  const extrasCount = [
    priority !== "normal",
    category,
    pinned,
    actionUrl.trim(),
    expiresAt,
  ].filter(Boolean).length;

  async function handleTest() {
    if (testing) return;

    setError("");
    setNotice("");

    if (!subjectOk || !messageOk) {
      setError("Enter a subject and a message of at least 10 characters first.");
      return;
    }

    if (errors.actionUrl) {
      setMoreOpen(true);
      setError(errors.actionUrl);
      return;
    }

    setTesting(true);

    try {
      await sendTestAnnouncement({
        subject: subject.trim(),
        message: message.trim(),
        priority,
        actionLabel: actionLabel.trim(),
        actionUrl: actionUrl.trim(),
      });

      setNotice("A test email was sent to your own address.");
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  }

  async function handleSend() {
    if (!canSend) return;

    setSending(true);
    setError("");
    setNotice("");

    try {
      const result = await createAnnouncement({
        subject: subject.trim(),
        message: message.trim(),
        audience: payload,
        delivery,
        priority,
        category,
        pinned,
        expiresAt,
        scheduledAt: whenMode === "later" ? scheduledAt : "",
        actionLabel: actionLabel.trim(),
        actionUrl: actionUrl.trim(),
      });

      setSubject("");
      setMessage("");
      setPriority("normal");
      setCategory("");
      setPinned(false);
      setActionLabel("");
      setActionUrl("");
      setExpiresAt("");
      setWhenMode("now");
      setScheduledAt("");
      setConfirming(false);
      setAudience(initialAudience(options));

      onSent(result);
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    } finally {
      setSending(false);
    }
  }

  if (optionsError) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700"
      >
        {optionsError}
      </div>
    );
  }

  if (!options) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500"
      >
        <Loader2 size={18} className="animate-spin" />
        Loading...
      </div>
    );
  }

  const note = statsNote(options.stats, delivery);
  const later = whenMode === "later";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      {/* The form */}
      <div className="space-y-6">
        <Step
          number={1}
          title="Who is it for?"
          description="Combine as many as you like. You only see the groups you can reach."
        >
          <AudiencePicker
            options={options}
            value={audience}
            onChange={setAudience}
            delivery={delivery}
          />

          {note && (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
              {note}
            </p>
          )}
        </Step>

        <Step number={2} title="Write your message">
          <div className="space-y-5">
            <div>
              <Label htmlFor="announcement-subject">
                Subject <span className="text-red-500">*</span>
              </Label>

              <input
                id="announcement-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={150}
                placeholder="e.g. Prayer night moved to Friday"
                className={fieldClass}
              />
            </div>

            <div>
              <Label htmlFor="announcement-message">
                Message <span className="text-red-500">*</span>
              </Label>

              <textarea
                id="announcement-message"
                rows={8}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={MAX_MESSAGE}
                className={fieldClass}
              />

              <p className="mt-1.5 flex justify-between text-xs text-slate-400">
                <span>Plain text. Line breaks are kept.</span>
                <span>
                  {message.length} / {MAX_MESSAGE}
                </span>
              </p>
            </div>

            {/* Optional extras */}
            <div className="rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setMoreOpen((current) => !current)}
                aria-expanded={moreOpen}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    More options
                    {extrasCount > 0 && (
                      <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        {extrasCount} set
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-slate-500">
                    Optional: priority, category, a button, pin and expiry.
                  </span>
                </span>

                <ChevronDown
                  size={17}
                  aria-hidden="true"
                  className={`shrink-0 text-slate-400 transition-transform ${
                    moreOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {moreOpen && (
                <div className="space-y-5 border-t border-slate-100 p-4">
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium text-slate-700">
                      Priority
                    </legend>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {PRIORITIES.map((item) => (
                        <label
                          key={item.value}
                          className={`cursor-pointer rounded-xl border px-3.5 py-3 transition focus-within:ring-2 focus-within:ring-indigo-500 ${
                            priority === item.value
                              ? item.value === "urgent"
                                ? "border-red-300 bg-red-50"
                                : item.value === "important"
                                  ? "border-amber-300 bg-amber-50"
                                  : "border-slate-900 bg-slate-50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="priority"
                            value={item.value}
                            checked={priority === item.value}
                            onChange={() => setPriority(item.value)}
                            className="sr-only"
                          />

                          <span className="block text-sm font-semibold text-slate-900">
                            {item.label}
                          </span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                            {item.hint}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="announcement-category">Category</Label>

                      <select
                        id="announcement-category"
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        className={fieldClass}
                      >
                        <option value="">None</option>

                        {options.categories.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="announcement-expires">
                        Hide it after
                      </Label>

                      <input
                        id="announcement-expires"
                        type="datetime-local"
                        value={expiresAt}
                        min={nowForInput(1)}
                        onChange={(event) => setExpiresAt(event.target.value)}
                        aria-invalid={Boolean(errors.expiresAt)}
                        className={fieldClass}
                      />

                      {errors.expiresAt ? (
                        <p role="alert" className="mt-1.5 text-xs text-red-500">
                          {errors.expiresAt}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-slate-400">
                          Leave empty to keep it in the inbox.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Action button
                    </p>

                    <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                      <input
                        value={actionLabel}
                        onChange={(event) => setActionLabel(event.target.value)}
                        maxLength={40}
                        placeholder="Button text"
                        aria-label="Button text"
                        className={fieldClass}
                      />

                      <input
                        value={actionUrl}
                        onChange={(event) => setActionUrl(event.target.value)}
                        maxLength={500}
                        placeholder="https://… or /dashboard/events"
                        aria-label="Button link"
                        aria-invalid={Boolean(errors.actionUrl)}
                        className={fieldClass}
                      />
                    </div>

                    {errors.actionUrl ? (
                      <p role="alert" className="mt-1.5 text-xs text-red-500">
                        {errors.actionUrl}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-slate-400">
                        Optional. For example “Register” linking to an event.
                      </p>
                    )}
                  </div>

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={pinned}
                      onChange={(event) => setPinned(event.target.checked)}
                      disabled={delivery === "email"}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        Pin to the top of the inbox
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {delivery === "email"
                          ? "Email-only announcements are not shown in the inbox."
                          : "It stays above newer announcements until it expires."}
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </Step>

        <Step number={3} title="Delivery and timing">
          <fieldset>
            <legend className="sr-only">How should it be delivered?</legend>

            <div className="grid gap-3 sm:grid-cols-3">
              {DELIVERY_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = delivery === option.value;

                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition focus-within:ring-2 focus-within:ring-indigo-500 ${
                      selected
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={option.value}
                      checked={selected}
                      onChange={() => {
                        setDelivery(option.value);
                        if (option.value === "email") setPinned(false);
                      }}
                      className="sr-only"
                    />

                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Icon size={16} aria-hidden="true" />
                      {option.label}
                    </span>

                    <span
                      className={`text-xs leading-5 ${
                        selected ? "text-white/75" : "text-slate-500"
                      }`}
                    >
                      {option.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {delivery !== "email" && (
            <p className="mt-3 text-xs text-slate-500">
              Members who turned off announcement emails still see it in their
              dashboard.
            </p>
          )}

          <fieldset className="mt-6">
            <legend className="mb-2 text-sm font-medium text-slate-700">
              When should it go out?
            </legend>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "now", label: "Send now", hint: "It goes out right away." },
                {
                  value: "later",
                  label: "Send later",
                  hint: "Pick a date and time. It goes out by itself.",
                },
              ].map((choice) => (
                <label
                  key={choice.value}
                  className={`cursor-pointer rounded-xl border px-4 py-3 transition focus-within:ring-2 focus-within:ring-indigo-500 ${
                    whenMode === choice.value
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="when"
                    value={choice.value}
                    checked={whenMode === choice.value}
                    onChange={() => setWhenMode(choice.value)}
                    className="sr-only"
                  />

                  <span className="block text-sm font-semibold text-slate-900">
                    {choice.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {choice.hint}
                  </span>
                </label>
              ))}
            </div>

            {later && (
              <div className="mt-4 max-w-xs">
                <Label htmlFor="announcement-when">Send on</Label>

                <input
                  id="announcement-when"
                  type="datetime-local"
                  value={scheduledAt}
                  min={nowForInput(2)}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  aria-invalid={Boolean(errors.scheduledAt)}
                  className={fieldClass}
                />

                {errors.scheduledAt ? (
                  <p role="alert" className="mt-1.5 text-xs text-red-500">
                    {errors.scheduledAt}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Local church time. The people reached are worked out when it
                    is sent.
                  </p>
                )}
              </div>
            )}
          </fieldset>
        </Step>
      </div>

      {/* Summary */}
      <aside className="space-y-4 lg:sticky lg:top-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Summary</h2>

          <div
            aria-live="polite"
            className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm"
          >
            {audienceIsEmpty(audience) && (
              <p className="text-slate-500">
                Choose who this is for to see how many people it reaches.
              </p>
            )}

            {!audienceIsEmpty(audience) && preview.loading && (
              <p className="flex items-center gap-2 text-slate-500">
                <Loader2 size={15} className="animate-spin" />
                Counting...
              </p>
            )}

            {!audienceIsEmpty(audience) && preview.error && (
              <p className="text-red-600">{preview.error}</p>
            )}

            {!audienceIsEmpty(audience) && data && !preview.loading && (
              <div className="space-y-1.5">
                <p className="flex items-start gap-2 font-semibold text-slate-900">
                  <Users size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    {reached === 0
                      ? "No eligible recipients"
                      : delivery === "email"
                        ? `Emails ${data.emails} ${people(data.emails)}`
                        : delivery === "dashboard"
                          ? `Reaches ${data.reach} ${people(data.reach)} in the dashboard`
                          : `Reaches ${data.reach} ${people(data.reach)} in the dashboard, emails ${data.emails}`}
                  </span>
                </p>

                {data.optedOut > 0 && (
                  <p className="text-xs text-slate-500">
                    {data.optedOut}{" "}
                    {data.optedOut === 1 ? "has" : "have"} turned off
                    announcement emails.
                  </p>
                )}

                {data.unverified > 0 && (
                  <p className="text-xs text-slate-500">
                    {data.unverified} not verified, so dashboard only.
                  </p>
                )}

                {data.tooMany && (
                  <p className="flex items-start gap-2 text-xs text-red-600">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    The email limit is {data.maxRecipients} people per
                    announcement. Choose a smaller group, or “Dashboard only”.
                  </p>
                )}

                {dailyExceeded && (
                  <p className="flex items-start gap-2 text-xs text-red-600">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    Only {data.emailsLeftToday} more emails can go out today.
                    Schedule it for tomorrow, or choose “Dashboard only”.
                  </p>
                )}
              </div>
            )}
          </div>

          {later && scheduledAt && !errors.scheduledAt && (
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-600">
              <CalendarClock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              Goes out {formatWhen(scheduledAt)}
            </p>
          )}
        </section>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            Preview
          </p>

          <AnnouncementPreview
            subject={subject}
            message={message}
            priority={priority}
            category={category}
            pinned={pinned}
            actionLabel={actionLabel}
            actionUrl={URL_PATTERN.test(actionUrl.trim()) ? actionUrl.trim() : ""}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {notice}
          </div>
        )}

        {confirming ? (
          <div
            role="alertdialog"
            aria-label="Confirm sending"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
          >
            <p className="text-sm font-semibold text-amber-900">
              {later
                ? `Schedule this for ${formatWhen(scheduledAt)}?`
                : `Send this to ${reached} ${people(reached)}?`}
            </p>

            <p className="mt-1 text-sm text-amber-800">
              {later
                ? "It goes out by itself at that time. You can cancel it until then."
                : delivery === "dashboard"
                  ? "It appears in their dashboards. You can delete it later to remove it for everyone."
                  : delivery === "both"
                    ? `It appears in their dashboards and ${data?.emails || 0} also get an email. Emails can't be recalled once sent.`
                    : "Emails can't be recalled once they are sent."}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={sending}
                className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
              >
                Go back
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {sending && <Loader2 size={16} className="animate-spin" />}
                {sending ? "Working..." : later ? "Yes, schedule it" : "Yes, send it"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={!canSend}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {later ? (
                <CalendarClock size={16} aria-hidden="true" />
              ) : (
                <Send size={16} aria-hidden="true" />
              )}
              {later ? "Schedule announcement" : "Send announcement"}
            </button>

            {delivery !== "dashboard" && (
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {testing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} aria-hidden="true" />
                )}
                {testing ? "Sending test..." : "Send test to myself"}
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}