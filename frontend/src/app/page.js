import { Hero } from "@/components/sections/hero";
import { Mission } from "@/components/sections/mission";
import { Fellowships } from "@/components/sections/fellowships";
import { Moments } from "@/components/sections/moments";
import { VisitCta } from "@/components/sections/visit";

import Chatbot from "@/components/Chatbot_AI/Chatbot/Chatbot";

export default function Home() {
  return (
    <>
      <Hero />
      <Mission />
      <Fellowships />
      <Moments />
      <VisitCta />

      <Chatbot />
    </>
  );
}