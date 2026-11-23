import Link from "next/link";
import { Megaphone, Sparkles, XCircle } from "lucide-react";

import Reveal from "@/components/shared/Reveal/Reveal";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import { VisitCta } from "@/components/sections/visit";
import { eventsPage } from "@/data/eventsPage";
import { formatEventDate, formatEventWhen } from "@/lib/eventFormat";
import { getPublicEvents } from "@/lib/publicEventsApi";
import EventPhoto from "./EventPhoto";
import EventsBrowser from "./EventsBrowser";
import Gallery from "./Gallery";

const NOTICE_STYLES = {
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    box: "bg-accent/15 ring-accent/40 text-ink",
    muted: "text-ink/70",
  },
  ad: {
    label: "Ad",
    icon: Sparkles,
    box: "bg-ink text-white ring-ink",
    muted: "text-white/70",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    box: "bg-danger/10 ring-danger/30 text-ink",
    muted: "text-body",
  },
};

function Notice({ notice }) {
  const style = NOTICE_STYLES[notice.type] ?? NOTICE_STYLES.announcement;
  const Icon = style.icon;

  const content = (
    <>
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {style.label}
      </span>
      <span className="mt-2 block font-display text-lg font-semibold leading-snug">
        {notice.title}
      </span>
      <span className={`mt-1 block text-sm leading-6 ${style.muted}`}>
        {notice.text}
      </span>
      {notice.href && notice.cta && (
        <span className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">
          {notice.cta}
        </span>
      )}
    </>
  );

  const classes = `block h-full rounded-3xl p-5 ring-1 ${style.box}`;

  return notice.href ? (
    <Link href={notice.href} className={`${classes} transition hover:-translate-y-1 hover:shadow-soft`}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}

function NextUp({ event }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative isolate block overflow-hidden rounded-[2rem] bg-ink text-white"
    >
      <div className="absolute inset-0 -z-10">
        <EventPhoto
          src={event.imageUrl}
          className="transition duration-700 group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 via-ink/60 to-ink/30" />

      <div className="flex min-h-[22rem] flex-col justify-end p-7 md:min-h-[26rem] md:p-12">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-ink">
            Next up
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20 backdrop-blur">
            {event.campusName || "All campuses"}
          </span>
          {event.ongoing && (
            <span className="rounded-full bg-success px-3 py-1 text-xs font-semibold">
              Happening now
            </span>
          )}
        </div>

        <h2 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
          {event.title}
        </h2>

        {event.theme && (
          <p className="mt-2 max-w-2xl text-lg italic text-white/80">
            {event.theme}
          </p>
        )}

        <p className="mt-4 text-white/80">
          {formatEventDate(event.startAt)} · {formatEventWhen(event)} ·{" "}
          {event.location}
        </p>

        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
          View details
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

export default async function EventsPage() {
  const { data, error } = await getPublicEvents({ limit: 50 });

  const events = data ?? [];
  const upcoming = events.filter((event) => !event.cancelled);
  const next = upcoming.find((event) => event.featured) ?? upcoming[0] ?? null;

  const cancelledNotices = events
    .filter((event) => event.cancelled)
    .slice(0, 2)
    .map((event) => ({
      type: "cancelled",
      title: event.title,
      text: `Cancelled · ${formatEventDate(event.startAt, {
        weekday: "short",
        year: undefined,
        month: "short",
      })}`,
      href: `/events/${event.slug}`,
      cta: "See details",
    }));

  const notices = [...cancelledNotices, ...eventsPage.notices].slice(0, 3);

  const { hero } = eventsPage;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate -mt-[4.25rem] overflow-hidden bg-ink pb-20 pt-40 text-white md:pb-28 md:pt-48">
        <div className="absolute inset-0 -z-10">
          <EventPhoto src={hero.image} />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/50 to-ink/25" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_10%_100%,rgba(242,166,13,0.2),transparent)]" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-accent" />
              {hero.eyebrow}
            </span>

            <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              {hero.title}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">
              {hero.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              <a
                href="#events"
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-105"
              >
                Upcoming events
              </a>
              <a
                href="#gallery"
                className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
              >
                Gallery
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Notices and next event */}
      {(notices.length > 0 || next) && (
        <SectionContainer className="pb-0 md:pb-0">
          {notices.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {notices.map((notice, index) => (
                <Reveal key={`${notice.title}-${index}`} delay={index * 0.08} y={20} className="h-full">
                  <Notice notice={notice} />
                </Reveal>
              ))}
            </div>
          )}

          {next && (
            <Reveal className={notices.length > 0 ? "mt-8" : ""}>
              <NextUp event={next} />
            </Reveal>
          )}
        </SectionContainer>
      )}

      {/* Events list with filters */}
      <EventsBrowser events={events} error={Boolean(error)} />

      {/* Gallery */}
      <Gallery />

      <VisitCta />
    </>
  );
}