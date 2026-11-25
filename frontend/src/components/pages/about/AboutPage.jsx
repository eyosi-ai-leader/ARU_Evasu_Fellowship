import Image from "next/image";
import {
  BookOpen,
  Compass,
  Globe,
  GraduationCap,
  Megaphone,
  Target,
  Users,
} from "lucide-react";

import Reveal from "@/components/shared/Reveal/Reveal";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import { VisitCta } from "@/components/sections/visit";
import aboutPage from "../../../data/aboutPage";
import StaffMessages from "./StaffMessages";

const ICONS = {
  Target,
  GraduationCap,
  Users,
  Megaphone,
  BookOpen,
  Globe,
  Compass,
};

export default function AboutPage() {
  const { hero, story, foundations, commitments, staffIntro, staff } = aboutPage;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate -mt-[4.25rem] overflow-hidden bg-ink pb-20 pt-40 text-white md:pb-28 md:pt-48">
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

      {/* Story */}
      <SectionContainer>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface-warm">
              <Image
                src={story.image}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <SectionHeader
              align="left"
              subtitle={story.eyebrow}
              title={story.title}
            />

            <div className="mt-6 space-y-5">
              {story.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-lg leading-8 text-body">
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
          {story.stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.06} y={20}>
              <div className="h-full rounded-3xl bg-white p-6 text-center ring-1 ring-line">
                <p className="font-display text-4xl font-semibold text-primary md:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-body">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionContainer>

      {/* Purpose, focus, values */}
      <SectionContainer className="bg-surface">
        <SectionHeader
          subtitle={foundations.subtitle}
          title={foundations.title}
          description={foundations.description}
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {foundations.items.map((item, index) => {
            const Icon = ICONS[item.icon] ?? Target;

            return (
              <Reveal key={item.title} delay={index * 0.1} className="h-full">
                <div className="group h-full rounded-3xl bg-surface-muted p-7 ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-soft">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white transition group-hover:bg-ember">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 leading-7 text-body">{item.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </SectionContainer>

      {/* Four commitments */}
      <SectionContainer className="bg-ink">
        <SectionHeader
          light
          subtitle={commitments.subtitle}
          title={commitments.title}
          description={commitments.description}
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {commitments.items.map((item, index) => {
            const Icon = ICONS[item.icon] ?? Compass;

            return (
              <Reveal key={item.title} delay={index * 0.08} className="h-full">
                <div className="group h-full rounded-3xl bg-white/5 p-7 ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:bg-white/10">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-ink">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 leading-7 text-white/70">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </SectionContainer>

      {/* Staff messages */}
      <StaffMessages intro={staffIntro} staff={staff} />

      <VisitCta />
    </>
  );
}