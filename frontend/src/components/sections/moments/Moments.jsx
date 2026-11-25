import Button from "@/components/shared/Button";
import Reveal from "@/components/shared/Reveal/Reveal";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import moments from "../../../data/moments";
import { momentsIntro } from "../../../data/homeSections";
import MomentTile from "./MomentTile";

export default function Moments() {
  return (
    <SectionContainer className="bg-surface">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          align="left"
          subtitle={momentsIntro.subtitle}
          title={momentsIntro.title}
          description={momentsIntro.description}
        />

        <Button href="/events#gallery" variant="secondary" arrow>
          See all moments
        </Button>
      </div>

      <div className="mt-12 grid grid-cols-2 auto-rows-[160px] gap-3 md:grid-cols-4 md:auto-rows-[200px]">
        {moments.map((moment, index) => (
          <Reveal
            key={moment.id}
            delay={index * 0.06}
            y={20}
            className={moment.span}
          >
            <MomentTile src={moment.src} caption={moment.caption} />
          </Reveal>
        ))}
      </div>
    </SectionContainer>
  );
}