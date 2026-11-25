"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin, Repeat } from "lucide-react";

import Button from "@/components/shared/Button";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import { eventsPage } from "../../../data/eventsPage";
import {
  formatEventDate,
  formatEventWhen,
  getDayBadge,
  repeatLabel,
} from "@/lib/eventFormat";
import EventPhoto from "./EventPhoto";

// Which chip an event belongs to, from its campus name.
const filterOf = (event) => {
  const name = (event.campusName || "").toLowerCase();

  if (!name) return "general";

  const found = eventsPage.filters.find((item) =>
    item.match?.some((word) => name.includes(word))
  );

  return found ? found.id : "general";
};

function EventRow({ event }) {
  const repeat = repeatLabel(event);

  return (
    <Link
      href={`/events/${event.slug}`}
      className={clsx(
        "group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-soft sm:flex-row",
        event.cancelled && "opacity-80"
      )}
    >
      <div className="relative h-44 shrink-0 overflow-hidden bg-surface-warm sm:h-auto sm:min-h-[12rem] sm:w-56">
        <div className="absolute inset-0">
          <EventPhoto
            src={event.imageUrl}
            className="transition duration-700 group-hover:scale-105"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {event.campusName || "All campuses"}
          </span>

          <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-body ring-1 ring-line">
            {event.category}
          </span>

          {event.cancelled && (
            <span className="rounded-full bg-danger px-3 py-1 text-xs font-semibold text-white">
              Cancelled
            </span>
          )}

          {event.ongoing && !event.cancelled && (
            <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
              Happening now
            </span>
          )}
        </div>

        <h4 className="mt-3 font-display text-xl font-semibold leading-snug text-ink">
          {event.title}
        </h4>

        {event.theme && (
          <p className="mt-1 text-sm italic text-body">{event.theme}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-body">
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
            {formatEventWhen(event)}
          </span>

          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            {event.location}
          </span>

          {repeat && (
            <span className="inline-flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" aria-hidden="true" />
              {repeat}
            </span>
          )}
        </div>

        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary">
          View details
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

export default function EventsBrowser({ events, error }) {
  const { introduction, filters } = eventsPage;
  const [active, setActive] = useState("all");

  const counts = useMemo(() => {
    const result = { all: events.length };

    events.forEach((event) => {
      const id = filterOf(event);
      result[id] = (result[id] ?? 0) + 1;
    });

    return result;
  }, [events]);

  const shown = useMemo(
    () =>
      active === "all"
        ? events
        : events.filter((event) => filterOf(event) === active),
    [events, active]
  );

  // Group by the day the event starts
  const days = useMemo(() => {
    const groups = [];

    shown.forEach((event) => {
      const key = event.startAt.slice(0, 10);
      const last = groups[groups.length - 1];

      if (last && last.key === key) last.items.push(event);
      else groups.push({ key, items: [event] });
    });

    return groups;
  }, [shown]);

  const activeLabel = filters.find((item) => item.id === active)?.label;

  return (
    <SectionContainer id="events" className="scroll-mt-4">
      <SectionHeader
        subtitle={introduction.subtitle}
        title={introduction.title}
        description={introduction.description}
      />

      {!error && events.length > 0 && (
        <div
          role="group"
          aria-label="Filter by fellowship"
          className="mt-10 flex flex-wrap justify-center gap-2"
        >
          {filters.map((item) => {
            const selected = active === item.id;

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActive(item.id)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition duration-200 active:scale-[0.97]",
                  selected
                    ? "bg-primary text-white ring-primary shadow-soft"
                    : "bg-white text-ink ring-line hover:ring-primary/40"
                )}
              >
                {item.label}
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-xs",
                    selected ? "bg-white/20" : "bg-surface-muted text-body"
                  )}
                >
                  {counts[item.id] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-12">
        {error && (
          <div
            role="status"
            className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center ring-1 ring-line"
          >
            <h3 className="font-display text-xl font-semibold text-ink">
              Events are temporarily unavailable
            </h3>
            <p className="mt-2 text-sm leading-6 text-body">
              Please check back in a little while.
            </p>
          </div>
        )}

        {!error && events.length === 0 && (
          <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center ring-1 ring-line">
            <h3 className="font-display text-xl font-semibold text-ink">
              No upcoming events right now
            </h3>
            <p className="mt-2 text-sm leading-6 text-body">
              New events appear here as soon as they are scheduled. Please check
              back soon.
            </p>
          </div>
        )}

        {!error && events.length > 0 && shown.length === 0 && (
          <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center ring-1 ring-line">
            <h3 className="font-display text-xl font-semibold text-ink">
              No events for {activeLabel} yet
            </h3>
            <p className="mt-2 text-sm leading-6 text-body">
              Check back soon, or see what is happening in the other
              fellowships.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActive("all")}
              className="mt-5"
            >
              Show all events
            </Button>
          </div>
        )}

        {!error && shown.length > 0 && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-10"
          >
            {days.map((day) => {
              const badge = getDayBadge(`${day.key} 00:00:00`);
              const weekday = formatEventDate(`${day.key} 00:00:00`, {
                weekday: "long",
                year: undefined,
                month: undefined,
                day: undefined,
              });

              return (
                <div
                  key={day.key}
                  className="grid gap-4 md:grid-cols-[8rem_1fr] md:gap-8"
                >
                  <div className="flex items-baseline gap-3 md:sticky md:top-28 md:flex-col md:items-start md:gap-1 md:self-start">
                    <span className="font-display text-5xl font-semibold leading-none text-primary md:text-6xl">
                      {badge.day}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-ink">
                        {badge.month}
                      </span>
                      <span className="block text-sm text-body">{weekday}</span>
                    </span>
                  </div>

                  <div className="space-y-4">
                    {day.items.map((event) => (
                      <EventRow key={event.slug} event={event} />
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </SectionContainer>
  );
}