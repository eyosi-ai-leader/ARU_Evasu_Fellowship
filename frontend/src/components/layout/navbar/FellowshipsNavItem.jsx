"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

import { fellowships, getInitials } from "@/data/fellowships";
import NavItem from "./navitem";

export default function FellowshipsNavItem({
  href,
  label,
  current,
  highlighted,
  onHover,
  onLeave,
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(fellowships[0].slug);
  const closeTimer = useRef(null);

  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
    onHover();
  };

  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  // Close when the page changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close with Escape
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const active = fellowships.find((item) => item.slug === preview);
  const chair = active.leaders[0];

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) hide();
      }}
    >
      <NavItem
        href={href}
        current={current}
        highlighted={highlighted}
        onHover={onHover}
        onLeave={onLeave}
        label={
          <span className="inline-flex items-center gap-1">
            {label}
            <ChevronDown
              aria-hidden="true"
              className={clsx(
                "h-3.5 w-3.5 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </span>
        }
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 top-full z-50 w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 pt-4"
          >
            <div className="grid grid-cols-[1fr_1.1fr] gap-2 rounded-3xl bg-white p-2 shadow-soft ring-1 ring-line">
              <div className="flex flex-col p-1">
                <ul className="flex flex-col gap-1">
                  {fellowships.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/fellowships/${item.slug}`}
                        onMouseEnter={() => setPreview(item.slug)}
                        onFocus={() => setPreview(item.slug)}
                        className={clsx(
                          "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition",
                          preview === item.slug
                            ? "bg-surface-muted"
                            : "hover:bg-surface-muted"
                        )}
                      >
                        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={item.image}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {item.short}
                          </span>
                          <span className="block truncate text-xs text-body">
                            {item.program.day} · {item.program.time}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <Link
                  href={href}
                  className="mt-2 inline-flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
                >
                  See all fellowships
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <motion.div
                key={active.slug}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                <Link
                  href={`/fellowships/${active.slug}`}
                  className="group relative isolate flex h-full min-h-[19rem] flex-col justify-end overflow-hidden rounded-2xl bg-ink p-5 text-white"
                >
                  <Image
                    src={active.image}
                    alt=""
                    fill
                    sizes="320px"
                    className="-z-10 object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />

                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                    Weekly program
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold">
                    {active.program.day} · {active.program.time}
                  </p>
                  <p className="text-sm text-white/70">{active.program.place}</p>

                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-ink">
                      {getInitials(chair.name)}
                    </span>
                    <span className="min-w-0 text-sm leading-tight">
                      <span className="block truncate font-semibold">
                        {chair.name}
                      </span>
                      <span className="block truncate text-white/70">
                        {chair.role} · {chair.phone}
                      </span>
                    </span>
                  </div>

                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                    View fellowship
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}