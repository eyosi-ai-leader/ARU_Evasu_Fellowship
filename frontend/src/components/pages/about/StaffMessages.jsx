"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, Quote } from "lucide-react";

import Button from "@/components/shared/Button";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import { getInitials } from "../../../data/fellowships";

// Shows the photo when there is one, otherwise the initials
function Avatar({ person, className }) {
  return (
    <span
      className={clsx(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-ember font-display font-semibold text-white",
        className
      )}
    >
      {person.image ? (
        <Image
          src={person.image}
          alt={person.name}
          fill
          sizes="240px"
          className="object-cover"
        />
      ) : (
        getInitials(person.name)
      )}
    </span>
  );
}

export default function StaffMessages({ intro, staff }) {
  const [active, setActive] = useState(0);
  const person = staff[active];

  return (
    <SectionContainer className="bg-surface">
      <SectionHeader
        subtitle={intro.subtitle}
        title={intro.title}
        description={intro.description}
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div
          role="tablist"
          aria-label="Leaders"
          className="grid grid-cols-2 gap-3 lg:grid-cols-1"
        >
          {staff.map((item, index) => {
            const selected = active === index;

            return (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(index)}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl p-3 text-left ring-1 transition duration-200 last:odd:col-span-2 lg:col-span-1",
                  selected
                    ? "bg-primary text-white shadow-soft ring-primary"
                    : "bg-white ring-line hover:ring-primary/40"
                )}
              >
                <Avatar person={item} className="h-12 w-12 rounded-xl text-sm" />

                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-semibold">
                    {item.name}
                  </span>
                  <span
                    className={clsx(
                      "block truncate text-xs",
                      selected ? "text-white/70" : "text-body"
                    )}
                  >
                    {item.role}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.article
            key={person.name}
            role="tabpanel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="grid overflow-hidden rounded-3xl bg-white ring-1 ring-line md:grid-cols-[15rem_1fr]"
          >
            <Avatar
              person={person}
              className="min-h-64 rounded-none text-6xl md:min-h-full"
            />

            <div className="flex flex-col p-7 md:p-10">
              <Quote className="h-10 w-10 text-accent" aria-hidden="true" />

              <p className="mt-4 text-lg leading-8 text-ink md:text-xl md:leading-9">
                {person.message}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                <div>
                  <p className="font-display text-xl font-semibold text-ink">
                    {person.name}
                  </p>
                  <p className="text-sm text-body">{person.role}</p>
                </div>

                <Button
                  href={`tel:${person.phone.replace(/\s+/g, "")}`}
                  variant="secondary"
                  size="sm"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Call
                </Button>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </SectionContainer>
  );
}