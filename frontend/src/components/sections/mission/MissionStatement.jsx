"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import mission from "@/data/mission";

const wordClass = "mr-[0.28em] inline-block";

function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.18, 1]);

  return (
    <motion.span style={{ opacity }} className={wordClass}>
      {children}
    </motion.span>
  );
}

export default function MissionStatement() {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.5"],
  });

  const words = mission.statement.split(" ");

  return (
    <p
      ref={ref}
      className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink md:text-5xl lg:text-6xl"
    >
      {words.map((word, index) =>
        reduce ? (
          <span key={index} className={wordClass}>
            {word}
          </span>
        ) : (
          <Word
            key={index}
            progress={scrollYProgress}
            range={[index / words.length, (index + 1) / words.length]}
          >
            {word}
          </Word>
        )
      )}
    </p>
  );
}