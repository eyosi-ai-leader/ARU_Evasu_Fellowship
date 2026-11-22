"use client";

import { useState } from "react";

import Reveal from "@/components/shared/Reveal/Reveal";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import { fellowships } from "@/data/fellowships";
import { fellowshipsIntro } from "@/data/homeSections";
import FellowshipPanel from "./FellowshipPanel";

export default function Fellowships() {
  const [active, setActive] = useState(0);

  return (
    <SectionContainer id="fellowships" className="scroll-mt-4">
      <SectionHeader
        subtitle={fellowshipsIntro.subtitle}
        title={fellowshipsIntro.title}
        description={fellowshipsIntro.description}
      />

      <Reveal className="mt-12">
        <div className="flex flex-col gap-3 lg:h-[34rem] lg:flex-row">
          {fellowships.map((fellowship, index) => (
            <FellowshipPanel
              key={fellowship.slug}
              fellowship={fellowship}
              active={active === index}
              onActivate={() => setActive(index)}
            />
          ))}
        </div>
      </Reveal>
    </SectionContainer>
  );
}