import HeroBackground from "./HeroBackground";
import HeroContent from "./HeroContent";

export default function Hero() {
  return (
    <section className="relative isolate -mt-[4.25rem] flex min-h-[100svh] items-end overflow-hidden">
      <HeroBackground />
      <HeroContent />
    </section>
  );
}