"use client";

import Image from "next/image";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Phone, Send } from "lucide-react";

import Button from "@/components/shared/Button";

export default function FellowshipPanel({ fellowship, active, onActivate }) {
  const { name, description, image, meeting, contact } = fellowship;
  const tel = contact.phone.replace(/\s+/g, "");

  const chip =
    "inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur";

  return (
    <article
      className={clsx(
        "relative isolate overflow-hidden rounded-3xl bg-ink transition-all duration-500 ease-out",
        active
          ? "h-[30rem] lg:h-auto lg:flex-[3.4]"
          : "h-24 lg:h-auto lg:flex-1"
      )}
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 45vw"
        className={clsx(
          "object-cover transition duration-700",
          active ? "scale-100" : "scale-110 opacity-70"
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />

      {/* Covers the panel while it is closed, so a tap or click opens it */}
      <button
        type="button"
        aria-expanded={active}
        aria-label={`Show ${name}`}
        onClick={onActivate}
        onMouseEnter={() => {
          if (window.matchMedia("(min-width: 1024px)").matches) onActivate();
        }}
        className={clsx(
          "absolute inset-0 z-10 w-full cursor-pointer",
          active && "pointer-events-none"
        )}
      />

      <div
        className={clsx(
          "pointer-events-none absolute inset-0 z-20 flex flex-col p-5 lg:p-7",
          active ? "justify-end" : "justify-center lg:items-center lg:justify-end"
        )}
      >
        <h3
          className={clsx(
            "font-display font-semibold text-white transition-all duration-300",
            active
              ? "text-3xl lg:text-4xl"
              : "text-lg lg:[writing-mode:vertical-rl] lg:rotate-180"
          )}
        >
          {name}
        </h3>

        <AnimatePresence initial={false}>
          {active && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mt-3 max-w-lg"
            >
              <p className="leading-7 text-white/80">{description}</p>

              <ul className="mt-5 flex flex-wrap gap-2">
                <li className={chip}>
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {meeting.day}
                </li>
                <li className={chip}>
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {meeting.time}
                </li>
                <li className={chip}>
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {meeting.place}
                </li>
              </ul>

              <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
                <Button href={`tel:${tel}`} variant="accent" size="sm">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Call us
                </Button>

                {contact.telegram && (
                  <Button href={contact.telegram} variant="light" size="sm">
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Telegram
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}