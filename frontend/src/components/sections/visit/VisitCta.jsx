import { Send } from "lucide-react";

import Button from "@/components/shared/Button";
import Reveal from "@/components/shared/Reveal/Reveal";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import { BRAND } from "@/data/brand";
import { visitCta } from "@/data/homeSections";

export default function VisitCta() {
  const telegram = BRAND.socials.find((social) => social.name === "Telegram");

  return (
    <SectionContainer>
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-center text-white md:px-16 md:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/50 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl"
          />

          <div className="relative">
            <h2 className="font-display text-5xl font-semibold tracking-tight md:text-7xl">
              {visitCta.title}
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/70">
              {visitCta.text}
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button
                href={visitCta.primary.href}
                variant="accent"
                size="lg"
                arrow
              >
                {visitCta.primary.label}
              </Button>

              {telegram?.href && (
                <Button href={telegram.href} variant="light" size="lg">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Telegram
                </Button>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </SectionContainer>
  );
}