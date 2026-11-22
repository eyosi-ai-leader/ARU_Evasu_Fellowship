import Button from "@/components/shared/Button";
import Reveal from "@/components/shared/Reveal/Reveal";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import mission from "@/data/mission";
import MissionPillar from "./MissionPillar";
import MissionStatement from "./MissionStatement";

export default function Mission() {
  return (
    <SectionContainer className="bg-surface">
      <div className="mx-auto max-w-5xl">
        <span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-accent" />
          {mission.eyebrow}
        </span>

        <div className="mt-6">
          <MissionStatement />
        </div>
      </div>

      <div className="mt-16 grid gap-5 md:grid-cols-3">
        {mission.pillars.map((pillar, index) => (
          <Reveal key={pillar.title} delay={index * 0.1} className="h-full">
            <MissionPillar {...pillar} />
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10 text-center">
        <Button href={mission.link.href} variant="secondary" arrow>
          {mission.link.label}
        </Button>
      </Reveal>
    </SectionContainer>
  );
}