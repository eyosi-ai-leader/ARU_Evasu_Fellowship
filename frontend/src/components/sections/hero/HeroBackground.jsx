"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import heroMedia from "@/data/heroMedia";

const DELAY = 6500;

export default function HeroBackground() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;

    const id = setInterval(
      () => setActive((i) => (i + 1) % heroMedia.length),
      DELAY
    );

    return () => clearInterval(id);
  }, [reduce, active]);

  const current = heroMedia[active];

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden bg-ink">
        <AnimatePresence>
          <motion.div
            key={current.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: reduce ? 1 : 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.2 },
              scale: { duration: DELAY / 1000 + 1.5, ease: "linear" },
            }}
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              priority={active === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_100%,rgba(242,166,13,0.22),transparent)]" />
      </div>

      <div className="absolute bottom-28 right-6 z-10 flex gap-2 lg:bottom-10 lg:right-10">
        {heroMedia.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Show photo ${index + 1}`}
            aria-current={index === active}
            onClick={() => setActive(index)}
            className={clsx(
              "h-1.5 rounded-full transition-all duration-500",
              index === active
                ? "w-10 bg-accent"
                : "w-4 bg-white/40 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </>
  );
}