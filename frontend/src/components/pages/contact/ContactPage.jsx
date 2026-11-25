import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone, Send } from "lucide-react";

import Button from "@/components/shared/Button";
import Reveal from "@/components/shared/Reveal/Reveal";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import { BRAND } from "../../../data/brand";
import { contactPage } from "../../../data/contactPage";
import { fellowships } from "../../../data/fellowships";
import ContactForm from "./ContactForm";

const telOf = (phone) => phone.replace(/\s+/g, "");

function InfoCard({ icon: Icon, label, value, href, external = false }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex h-full items-start gap-4 rounded-3xl bg-white p-6 shadow-card ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-soft"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white transition group-hover:bg-ember">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>

      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {label}
        </span>
        <span className="mt-1 block break-words font-display text-lg font-semibold text-ink">
          {value}
        </span>
      </span>
    </a>
  );
}

function FellowshipContact({ fellowship }) {
  const { slug, name, image, program, contact } = fellowship;

  return (
    <div className="flex h-full flex-col rounded-3xl bg-white p-6 ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-center gap-4">
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
          <Image
            src={image}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        </span>

        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold leading-tight text-ink">
            {name}
          </h3>
          <p className="mt-0.5 text-sm text-body">
            {program.day} · {program.time} · {program.place}
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Contact person
      </p>
      <p className="mt-1 font-display text-lg font-semibold text-ink">
        {contact.name}
      </p>
      <a
        href={`tel:${telOf(contact.phone)}`}
        className="text-body transition hover:text-primary"
      >
        {contact.phone}
      </a>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button href={`tel:${telOf(contact.phone)}`} size="sm">
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call
        </Button>

        {contact.telegram && (
          <Button href={contact.telegram} variant="secondary" size="sm">
            <Send className="h-4 w-4" aria-hidden="true" />
            Telegram
          </Button>
        )}

        {contact.email && (
          <Button href={`mailto:${contact.email}`} variant="secondary" size="sm">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email
          </Button>
        )}
      </div>

      <Link
        href={`/fellowships/${slug}`}
        className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        Meet the leaders
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}

export default function ContactPage() {
  const { hero, fellowships: intro, prayer } = contactPage;
  const socials = BRAND.socials.filter((social) => social.href);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate -mt-[4.25rem] overflow-hidden bg-ink pb-32 pt-40 text-white md:pb-40 md:pt-48">
        <Image
          src={hero.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
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
          </Reveal>
        </div>
      </section>

      {/* Quick contact cards (overlap the hero) */}
      <div className="relative z-10 mx-auto -mt-14 max-w-7xl px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Reveal className="h-full">
            <InfoCard
              icon={MapPin}
              label="Visit us"
              value={BRAND.address.lines.join(", ")}
              href={BRAND.address.mapUrl}
              external
            />
          </Reveal>

          {BRAND.phone && (
            <Reveal delay={0.08} className="h-full">
              <InfoCard
                icon={Phone}
                label="Call us"
                value={BRAND.phone}
                href={`tel:${telOf(BRAND.phone)}`}
              />
            </Reveal>
          )}

          {BRAND.email && (
            <Reveal delay={0.16} className="h-full">
              <InfoCard
                icon={Mail}
                label="Email us"
                value={BRAND.email}
                href={`mailto:${BRAND.email}`}
              />
            </Reveal>
          )}
        </div>
      </div>

      {/* Contact your fellowship */}
      <SectionContainer>
        <SectionHeader
          subtitle={intro.subtitle}
          title={intro.title}
          description={intro.description}
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {fellowships.map((fellowship, index) => (
            <Reveal
              key={fellowship.slug}
              delay={(index % 3) * 0.08}
              className={`${
                index < 3 ? "lg:col-span-2" : "lg:col-span-3"
              } sm:last:col-span-2`}
            >
              <FellowshipContact fellowship={fellowship} />
            </Reveal>
          ))}
        </div>
      </SectionContainer>

      {/* Prayer request */}
      <SectionContainer className="bg-surface">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <Reveal>
            <SectionHeader
              align="left"
              subtitle={prayer.subtitle}
              title={prayer.title}
              description={prayer.description}
            />

            {socials.length > 0 && (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-body">
                  Follow us
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {socials.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-surface-muted px-4 py-2 text-sm font-medium text-ink ring-1 ring-line transition hover:bg-primary hover:text-white hover:ring-primary"
                    >
                      {social.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Reveal>

          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </SectionContainer>
    </>
  );
}