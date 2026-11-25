"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CalendarDays, ChevronDown, MapPin } from "lucide-react";

import { formatEthiopianDate } from "@/lib/ethiopianCalendar"; // <- adjust path

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getAuthToken() {
  if (typeof document === "undefined") return null;

  const tokenCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("token="));

  return tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : null;
}

async function api(path, options = {}) {
  const token = getAuthToken();

  if (!token) throw new Error("Authentication token not found.");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || "Something went wrong.");
  }

  return result?.data;
}

function formatTime(value) {
  const text = String(value || "").slice(11, 16);

  if (!text) return "";

  const [hour, minute] = text.split(":").map(Number);

  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${
    hour >= 12 ? "PM" : "AM"
  }`;
}

function whenText(event) {
  const date = formatEthiopianDate(String(event.startAt).slice(0, 10));

  return event.allDay ? `${date} · All day` : `${date} · ${formatTime(event.startAt)}`;
}

function audienceText(event) {
  return (
    event.ministryName ||
    event.smallGroupName ||
    event.campusName ||
    "Whole fellowship"
  );
}

function Card({ icon: Icon, title, subtitle, badge, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
          </span>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        {badge ? (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function Empty({ children }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

function Tag({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------ Events ------------------------------ */

const RSVP_OPTIONS = [
  { value: "going", label: "Going" },
  { value: "maybe", label: "Maybe" },
  { value: "not_going", label: "Can't go" },
];

function EventsCard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await api("/events?scope=upcoming");
      setEvents(data?.items ?? []);
    } catch (err) {
      setError(err.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function answer(event, response) {
    try {
      setBusyId(event.id);
      setError("");

      if (event.rsvp?.mine === response) {
        await api(`/events/${event.id}/rsvp`, { method: "DELETE" });
      } else {
        await api(`/events/${event.id}/rsvp`, {
          method: "PUT",
          body: JSON.stringify({ response }),
        });
      }

      await load();
    } catch (err) {
      setError(err.message || "Could not save your answer.");
    } finally {
      setBusyId(null);
    }
  }

  const visible = showAll ? events : events.slice(0, 4);

  return (
    <Card
      icon={CalendarDays}
      title="Events"
      subtitle="Upcoming events for you"
    >
      {loading ? (
        <Skeleton />
      ) : (
        <>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          {events.length === 0 ? (
            <Empty>No upcoming events right now.</Empty>
          ) : (
            <ul className="space-y-2">
              {visible.map((event) => {
                const open = openId === event.id;
                const canAnswer =
                  event.rsvpEnabled && !event.cancelled && event.rsvp;

                return (
                  <li
                    key={`${event.id}-${event.startAt}`}
                    className="rounded-xl border border-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : event.id)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span
                            className={`truncate text-sm font-semibold ${
                              event.cancelled
                                ? "text-slate-400 line-through"
                                : "text-slate-800"
                            }`}
                          >
                            {event.title}
                          </span>

                          {event.cancelled && <Tag tone="red">Cancelled</Tag>}
                          {event.ongoing && !event.cancelled && (
                            <Tag tone="indigo">Happening now</Tag>
                          )}
                          {event.rsvp?.mine && (
                            <Tag tone="slate">
                              {
                                RSVP_OPTIONS.find(
                                  (o) => o.value === event.rsvp.mine
                                )?.label
                              }
                            </Tag>
                          )}
                        </span>

                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {whenText(event)}
                        </span>
                      </span>

                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-slate-400 transition ${
                          open ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {open && (
                      <div className="space-y-3 border-t border-slate-100 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <Tag>{event.category}</Tag>
                          <Tag>{audienceText(event)}</Tag>
                          {event.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={13} aria-hidden="true" />
                              {event.location}
                            </span>
                          )}
                        </div>

                        {event.theme && (
                          <p className="text-sm font-medium text-slate-700">
                            {event.theme}
                          </p>
                        )}

                        {event.speaker && (
                          <p className="text-xs text-slate-500">
                            Speaker: {event.speaker}
                          </p>
                        )}

                        {event.description && (
                          <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
                            {event.description}
                          </p>
                        )}

                        {event.onlineUrl && (
                          <a
                            href={event.onlineUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-sm font-medium text-indigo-600 hover:underline"
                          >
                            Join online
                          </a>
                        )}

                        {event.contactPhone && (
                          <p className="text-xs text-slate-500">
                            Contact:{" "}
                            <a
                              href={`tel:${event.contactPhone}`}
                              className="text-indigo-600 hover:underline"
                            >
                              {event.contactPhone}
                            </a>
                          </p>
                        )}

                        {canAnswer && (
                          <div>
                            <p className="mb-2 text-xs text-slate-500">
                              Will you come?
                              {event.capacity
                                ? ` (${event.rsvp.going}/${event.capacity} going)`
                                : ` (${event.rsvp.going} going)`}
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {RSVP_OPTIONS.map((option) => {
                                const active = event.rsvp.mine === option.value;

                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    disabled={busyId === event.id}
                                    onClick={() => answer(event, option.value)}
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                                      active
                                        ? "border-indigo-600 bg-indigo-600 text-white"
                                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {events.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="mt-3 text-sm font-medium text-indigo-600 hover:underline"
            >
              {showAll ? "Show less" : `Show all ${events.length}`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}

/* --------------------------- Announcements --------------------------- */

function AnnouncementsCard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api("/dashboard/my-announcements");
        setItems(data?.items ?? []);
      } catch (err) {
        setError(err.message || "Failed to load announcements.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function toggle(item) {
    const open = openId === item.id;

    setOpenId(open ? null : item.id);

    if (open || item.read) return;

    // Mark as read right away; undo quietly if the request fails.
    setItems((list) =>
      list.map((entry) =>
        entry.id === item.id ? { ...entry, read: true } : entry
      )
    );

    try {
      await api(`/dashboard/my-announcements/${item.id}/read`, {
        method: "PATCH",
      });
    } catch {
      setItems((list) =>
        list.map((entry) =>
          entry.id === item.id ? { ...entry, read: false } : entry
        )
      );
    }
  }

  const unread = items.filter((item) => !item.read).length;
  const visible = showAll ? items : items.slice(0, 4);

  return (
    <Card
      icon={Bell}
      title="Announcements"
      subtitle="Messages from your leaders"
      badge={unread > 0 ? `${unread} new` : null}
    >
      {loading ? (
        <Skeleton />
      ) : (
        <>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          {items.length === 0 ? (
            <Empty>No announcements yet.</Empty>
          ) : (
            <ul className="space-y-2">
              {visible.map((item) => {
                const open = openId === item.id;

                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(item)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <span className="flex min-w-0 items-start gap-3">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            item.read ? "bg-transparent" : "bg-indigo-600"
                          }`}
                          aria-label={item.read ? undefined : "Unread"}
                        />

                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span
                              className={`truncate text-sm text-slate-800 ${
                                item.read ? "font-medium" : "font-semibold"
                              }`}
                            >
                              {item.subject}
                            </span>

                            {item.pinned && <Tag>Pinned</Tag>}
                            {item.priority === "urgent" && (
                              <Tag tone="red">Urgent</Tag>
                            )}
                            {item.priority === "important" && (
                              <Tag tone="amber">Important</Tag>
                            )}
                          </span>

                          <span className="mt-0.5 block truncate text-xs text-slate-500">
                            {item.sender} ·{" "}
                            {formatEthiopianDate(
                              String(item.createdAt).slice(0, 10)
                            )}
                          </span>
                        </span>
                      </span>

                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-slate-400 transition ${
                          open ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {open && (
                      <div className="space-y-3 border-t border-slate-100 px-4 py-3">
                        {item.category && <Tag>{item.category}</Tag>}

                        <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
                          {item.message}
                        </p>

                        {item.actionUrl && (
                          <a
                            href={item.actionUrl}
                            target={
                              item.actionUrl.startsWith("/") ? undefined : "_blank"
                            }
                            rel="noreferrer"
                            className="inline-block rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
                          >
                            {item.actionLabel || "Open"}
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {items.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="mt-3 text-sm font-medium text-indigo-600 hover:underline"
            >
              {showAll ? "Show less" : `Show all ${items.length}`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}

export default function MyUpdates() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <EventsCard />
      <AnnouncementsCard />
    </section>
  );
}