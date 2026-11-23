import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";

import Button from "@/components/shared/Button";
import Reveal from "@/components/shared/Reveal/Reveal";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import {
  fellowships,
  fullTimeStaff,
  getInitials,
  regionalCoordinator,
} from "@/data/fellowships";

const telOf = (phone) => phone.replace(/\s+/g, "");

function PersonCard({ name, role, phone, featured = false }) {
  return (
    <div
      className={clsx(
        "group flex h-full flex-col rounded-3xl p-6 ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-soft",
        featured ? "bg-primary text-white ring-primary" : "bg-white ring-line"
      )}
    >
      <span
        className={clsx(
          "flex shrink-0 items-center justify-center rounded-2xl font-display font-semibold text-white",
          featured
            ? "h-16 w-16 bg-white/15 text-2xl"
            : "h-14 w-14 bg-gradient-to-br from-primary to-ember text-xl"
        )}
      >
        {getInitials(name)}
      </span>

      <p
        className={clsx(
          "mt-5 text-xs font-semibold uppercase tracking-[0.18em]",
          featured ? "text-accent" : "text-primary"
        )}
      >
        {role}
      </p>
      <h3 className="mt-1 font-display text-xl font-semibold">{name}</h3>

      <a
        href={`tel:${telOf(phone)}`}
        className={clsx(
          "mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium transition",
          featured ? "text-white/80 hover:text-white" : "text-body hover:text-primary"
        )}
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
        {phone}
      </a>
    </div>
  );
}

function ProgramItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-body">
          {label}
        </p>
        <p className="font-display text-xl font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function FellowshipDetailPage({ fellowship }) {
  const { slug, name, description, about, image, program, contact, leaders } =
    fellowship;

  const chair = leaders[0];
  const isGeneral = slug === "general";
  const others = fellowships.filter((item) => item.slug !== slug);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${program.place} Asella`
  )}`;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate -mt-[4.25rem] overflow-hidden bg-ink text-white">
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/50 to-ink/25" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_10%_100%,rgba(242,166,13,0.2),transparent)]" />

        <div className="mx-auto max-w-7xl px-6 pb-16 pt-40 lg:px-8 lg:pb-24 lg:pt-52">
          <Reveal>
            <Link
              href="/fellowships"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All fellowships
            </Link>

            <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              {name}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                href={`tel:${telOf(contact.phone)}`}
                variant="accent"
                size="lg"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call {contact.name}
              </Button>

              {contact.telegram && (
                <Button href={contact.telegram} variant="light" size="lg">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Telegram
                </Button>
              )}

              {contact.email && (
                <Button href={`mailto:${contact.email}`} variant="light" size="lg">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Email
                </Button>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* About + weekly program */}
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Reveal>
            <SectionHeader
              align="left"
              subtitle="About"
              title={`Welcome to the ${fellowship.short} family`}
              description={about}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-3xl bg-white p-7 ring-1 ring-line md:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Weekly program
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <ProgramItem icon={CalendarDays} label="Day" value={program.day} />
                <ProgramItem icon={Clock} label="Time" value={program.time} />
              </div>

              <div className="mt-6">
                <ProgramItem icon={MapPin} label="Place" value={program.place} />
              </div>

              <Button
                href={mapsUrl}
                variant="secondary"
                size="sm"
                arrow
                className="mt-7"
              >
                Open in Maps
              </Button>
            </div>
          </Reveal>
        </div>
      </SectionContainer>

      {/* Leadership */}
      <SectionContainer className="bg-surface">
        <SectionHeader
          subtitle="Leadership"
          title="People you can talk to"
          description="New here or just have a question? Reach out to any of our leaders. They would love to hear from you."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {leaders.map((leader, index) => (
            <Reveal
              key={leader.role}
              delay={(index % 4) * 0.06}
              y={20}
              className={index === 0 ? "sm:col-span-2" : ""}
            >
              <PersonCard {...leader} featured={index === 0} />
            </Reveal>
          ))}
        </div>
      </SectionContainer>

      {/* Staff and coordinator (General Fellowship only) */}
      {isGeneral && (
        <SectionContainer>
          <SectionHeader
            subtitle="Staff"
            title="Serving all the fellowships"
            description="Our full-time staff and regional coordinator support every campus fellowship."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[regionalCoordinator, ...fullTimeStaff].map((person, index) => (
              <Reveal key={person.name} delay={index * 0.06} y={20}>
                <PersonCard {...person} featured={index === 0} />
              </Reveal>
            ))}
          </div>
        </SectionContainer>
      )}

      {/* Contact */}
      <SectionContainer className={isGeneral ? "bg-surface" : ""}>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-white md:px-14 md:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/60 blur-3xl"
            />

            <div className="relative grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
              <div>
                <h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
                  Say hello.
                </h2>
                <p className="mt-4 max-w-md leading-7 text-white/70">
                  {contact.name} will help you get connected with the{" "}
                  {fellowship.short} fellowship. Your chairperson, {chair.name},
                  is also happy to talk.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Button
                  href={`tel:${telOf(contact.phone)}`}
                  variant="accent"
                  size="lg"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {contact.phone}
                </Button>

                {contact.telegram && (
                  <Button href={contact.telegram} variant="light" size="lg">
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Telegram
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </SectionContainer>

      {/* Other fellowships */}
      <SectionContainer className="pt-0 md:pt-0">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-body">
          Explore other fellowships
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {others.map((item) => (
            <Link
              key={item.slug}
              href={`/fellowships/${item.slug}`}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40"
            >
              {item.short}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </SectionContainer>
    </>
  );
}