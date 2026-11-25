"use client";

import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";

import Button from "@/components/shared/Button";
import heroContent from "../../../data/heroContent";
import HeroHighlights from "./HeroHighlights";

function Line({ text, className }) {
  return (
    <span className={clsx("block", className)}>
      {text.split(" ").map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="mr-[0.25em] inline-block overflow-hidden pb-[0.12em] align-bottom"
        >
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%" },
              show: {
                y: 0,
                transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export default function HeroContent() {
  const reduce = useReducedMotion();

  const fade = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: reduce ? 0 : 0.07, delayChildren: 0.2 }}
      className="relative mx-auto w-full max-w-7xl px-6 pb-36 pt-44 lg:px-8 lg:pb-24"
    >
      <motion.span
        variants={fade}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white ring-1 ring-white/20 backdrop-blur"
      >
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
        />
        {heroContent.eyebrow}
      </motion.span>

      <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
        <Line text={heroContent.headlineTop} />
        <Line text={heroContent.headlineAccent} className="text-accent" />
      </h1>

      <motion.p
        variants={fade}
        className="mt-7 max-w-xl text-lg leading-relaxed text-white/80"
      >
        {heroContent.description}
      </motion.p>

      <motion.div variants={fade} className="mt-9 flex flex-wrap gap-3">
        <Button
          href={heroContent.primaryCta.href}
          variant="accent"
          size="lg"
          arrow
        >
          {heroContent.primaryCta.label}
        </Button>

        <Button
          href={heroContent.secondaryCta.href}
          variant="light"
          size="lg"
        >
          {heroContent.secondaryCta.label}
        </Button>
      </motion.div>

      <motion.div variants={fade}>
        <HeroHighlights />
      </motion.div>
    </motion.div>
  );
}