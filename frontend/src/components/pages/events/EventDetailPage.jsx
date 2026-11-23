import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Mic,
  Quote,
  Repeat,
  Users,
} from "lucide-react";

import Button from "@/components/shared/Button";
import Reveal from "@/components/shared/Reveal/Reveal";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import { VisitCta } from "@/components/sections/visit";
import { getEventBySlug } from "@/lib/publicEventsApi";
import {
  formatEventDate,
  formatEventWhen,
  googleCalendarUrl,
  repeatLabel,
} from "@/lib/eventFormat";
import EventPhoto from "./EventPhoto";

function Fact({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-body">
          {label}
        </p>
        <p className="mt-0.5 break-words font-display text-lg font-semibold leading-snug text-ink">
          {children}
        </p>
      </div>
    </div>
  );
}

export default async function EventDetailPage({ slug }) {
  const { data: event, notFound: missing, error } = await getEventBySlug(slug);

  if (missing) notFound();

  if (error || !event) {
    return (
      <SectionContainer className="pt-36">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center ring-1 ring-line">
          <h1 className="font-display text-2xl font-semibold text-ink">
            This event is temporarily unavailable
          </h1>
          <p className="mt-2 text-body">Please try again in a little while.</p>
          <Button href="/events" variant="secondary" className="mt-6">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All events
          </Button>
        </div>
      </SectionContainer>
    );
  }

  const repeat = repeatLabel(event);
  const calendarUrl =
    !event.cancelled && !event.ended ? googleCalendarUrl(event) : "";
  const hasVerse = event.verseText || event.verseReference;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate -mt-[4.25rem] overflow-hidden bg-ink pb-16 pt-40 text-white md:pb-24 md:pt-48">
        <div className="absolute inset-0 -z-10">
          <EventPhoto src={event.imageUrl} />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 via-ink/60 to-ink/30" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All events
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-ink">
                {event.campusName || "All campuses"}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20 backdrop-blur">
                {event.category}
              </span>
              {event.ongoing && !event.cancelled && (
                <span className="rounded-full bg-success px-3 py-1 text-xs font-semibold">
                  Happening now
                </span>
              )}
            </div>

            <h1 className="mt-5 max-w-4xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {event.title}
            </h1>

            {event.theme && (
              <p className="mt-4 max-w-2xl text-xl italic text-white/80">
                {event.theme}
              </p>
            )}

            <p className="mt-6 text-white/80">
              {formatEventDate(event.startAt)} · {formatEventWhen(event)}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Details */}
      <SectionContainer>
        {event.cancelled && (
          <p
            role="status"
            className="mb-8 rounded-2xl bg-danger/10 px-5 py-4 text-sm font-semibold text-danger ring-1 ring-danger/30"
          >
            This event has been cancelled.
          </p>
        )}

        {!event.cancelled && event.ended && (
          <p
            role="status"
            className="mb-8 rounded-2xl bg-surface-muted px-5 py-4 text-sm font-semibold text-body ring-1 ring-line"
          >
            This event has ended. Check the events page to see what is next.
          </p>
        )}

        <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-8">
            {event.description && (
              <Reveal>
                <p className="whitespace-pre-line text-lg leading-8 text-body">
                  {event.description}
                </p>
              </Reveal>
            )}

            {hasVerse && (
              <Reveal delay={0.1}>
                <figure className="rounded-3xl bg-primary p-8 text-white md:p-10">
                  <Quote className="h-9 w-9 text-accent" aria-hidden="true" />

                  {event.verseText && (
                    <blockquote className="mt-4 font-display text-2xl font-semibold leading-snug">
                      {event.verseText}
                    </blockquote>
                  )}

                  {event.verseReference && (
                    <figcaption className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                      {event.verseReference}
                    </figcaption>
                  )}
                </figure>
              </Reveal>
            )}

            <Reveal delay={0.15}>
              <Button href="/events#events" variant="secondary" arrow>
                See more events
              </Button>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <aside className="h-fit space-y-6 rounded-3xl bg-white p-6 ring-1 ring-line lg:sticky lg:top-28">
              <Fact icon={CalendarDays} label="Date">
                {formatEventDate(event.startAt)}
              </Fact>

              <Fact icon={Clock} label="Time">
                {formatEventWhen(event)}
              </Fact>

              <Fact icon={MapPin} label="Place">
                {event.location}
              </Fact>

              <Fact icon={Users} label="Fellowship">
                {event.campusName || "All campuses"}
              </Fact>

              {event.speaker && (
                <Fact icon={Mic} label="Speaker">
                  {event.speaker}
                </Fact>
              )}

              {repeat && (
                <Fact icon={Repeat} label="Repeats">
                  {repeat.replace("Repeats ", "")}
                </Fact>
              )}

              {calendarUrl && (
                <Button href={calendarUrl} className="w-full">
                  Add to Google Calendar
                </Button>
              )}
            </aside>
          </Reveal>
        </div>
      </SectionContainer>

      <VisitCta />
    </>
  );
}