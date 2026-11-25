import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

import Reveal from "@/components/shared/Reveal/Reveal";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import { fellowships, getInitials } from "../../../data/fellowships";

// Change this line to use a different hero photo
const HERO_IMAGE = "/images/hero/GC_3.jpg";

function FellowshipCard({ fellowship }) {
  const { slug, name, description, image, program, leaders } = fellowship;
  const chair = leaders[0];

  return (
    <Link
      href={`/fellowships/${slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-line transition duration-300 hover:-translate-y-1.5 hover:shadow-soft"
    >
      <div className="relative h-56 overflow-hidden">
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />

        <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink backdrop-blur">
          <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {program.day} · {program.time}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="font-display text-2xl font-semibold text-ink">{name}</h2>
        <p className="mt-2 line-clamp-2 leading-7 text-body">{description}</p>

        <p className="mt-4 flex items-center gap-2 text-sm text-body">
          <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
          {program.place}
        </p>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-ember text-sm font-semibold text-white">
              {getInitials(chair.name)}
            </span>
            <span className="min-w-0 text-sm leading-tight">
              <span className="block truncate font-semibold text-ink">
                {chair.name}
              </span>
              <span className="block truncate text-body">{chair.role}</span>
            </span>
          </div>

          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition duration-300 group-hover:translate-x-0.5 group-hover:bg-ember">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FellowshipsPage() {
  return (
    <>
      <section className="relative isolate -mt-[4.25rem] overflow-hidden bg-ink pb-20 pt-40 text-white md:pb-28 md:pt-48">
        <Image
          src={HERO_IMAGE}
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
              Our fellowships
            </span>

            <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Five fellowships.
              <span className="block text-accent">One family.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">
              New to the university or looking for a place to belong? Find your
              fellowship, see when it gathers and talk to the people who lead it.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {fellowships.map((item) => (
                <Link
                  key={item.slug}
                  href={`/fellowships/${item.slug}`}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-accent hover:text-ink hover:ring-accent"
                >
                  {item.short}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <SectionContainer>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {fellowships.map((fellowship, index) => (
            <Reveal
              key={fellowship.slug}
              delay={(index % 3) * 0.08}
              className={`${
                index < 3 ? "lg:col-span-2" : "lg:col-span-3"
              } sm:last:col-span-2`}
            >
              <FellowshipCard fellowship={fellowship} />
            </Reveal>
          ))}
        </div>
      </SectionContainer>
    </>
  );
}