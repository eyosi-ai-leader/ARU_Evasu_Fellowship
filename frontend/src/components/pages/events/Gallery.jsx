"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import Button from "@/components/shared/Button";
import SectionContainer from "@/components/shared/SectionContainer/SectionContainer";
import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import { eventsPage } from "../../../data/eventsPage";

const PAGE_SIZE = 12;

// Mixes the albums so "All" shows variety instead of one album at a time
const interleave = (lists) => {
  const result = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));

  for (let i = 0; i < longest; i += 1) {
    lists.forEach((list) => {
      if (list[i]) result.push(list[i]);
    });
  }

  return result;
};

export default function Gallery() {
  const { intro, albums } = eventsPage.gallery;

  const [album, setAlbum] = useState("all");
  const [count, setCount] = useState(PAGE_SIZE);
  const [open, setOpen] = useState(null);

  const allLists = useMemo(
    () =>
      albums.map((item) =>
        item.photos.map((src, index) => ({
          src,
          album: item.title,
          alt: `${item.title} photo ${index + 1}`,
        }))
      ),
    [albums]
  );

  const photos = useMemo(() => {
    if (album === "all") return interleave(allLists);

    const index = albums.findIndex((item) => item.id === album);

    return index === -1 ? [] : allLists[index];
  }, [album, albums, allLists]);

  const visible = photos.slice(0, count);
  const total = allLists.reduce((sum, list) => sum + list.length, 0);

  const chooseAlbum = (id) => {
    setAlbum(id);
    setCount(PAGE_SIZE);
  };

  const close = useCallback(() => setOpen(null), []);

  const go = useCallback(
    (step) =>
      setOpen((index) =>
        index === null ? index : (index + step + photos.length) % photos.length
      ),
    [photos.length]
  );

  // Keyboard, and no page scroll while the viewer is open
  useEffect(() => {
    if (open === null) return;

    document.body.style.overflow = "hidden";

    const onKey = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, go]);

  const current = open === null ? null : photos[open];

  const chip = (selected) =>
    clsx(
      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition duration-200 active:scale-[0.97]",
      selected
        ? "bg-primary text-white ring-primary shadow-soft"
        : "bg-white text-ink ring-line hover:ring-primary/40"
    );

  return (
    <SectionContainer id="gallery" className="scroll-mt-4 bg-surface">
      <SectionHeader
        subtitle={intro.subtitle}
        title={intro.title}
        description={intro.description}
      />

      <div
        role="group"
        aria-label="Choose an album"
        className="mt-10 flex flex-wrap justify-center gap-2"
      >
        <button
          type="button"
          aria-pressed={album === "all"}
          onClick={() => chooseAlbum("all")}
          className={chip(album === "all")}
        >
          All photos
          <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs">
            {total}
          </span>
        </button>

        {albums.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={album === item.id}
            onClick={() => chooseAlbum(item.id)}
            className={chip(album === item.id)}
          >
            {item.title}
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs">
              {item.photos.length}
            </span>
          </button>
        ))}
      </div>

      <motion.div
        key={album}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-10 grid grid-flow-dense auto-rows-[9.5rem] grid-cols-2 gap-3 sm:auto-rows-[11rem] md:grid-cols-3 lg:auto-rows-[12rem] lg:grid-cols-4"
      >
        {visible.map((photo, index) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setOpen(index)}
            aria-label={`Open ${photo.alt}`}
            className={clsx(
              "group relative overflow-hidden rounded-3xl bg-surface-warm",
              index % 9 === 0 && "col-span-2 row-span-2"
            )}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            <span className="absolute bottom-3 left-4 translate-y-1 text-sm font-medium text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
              {photo.album}
            </span>
          </button>
        ))}
      </motion.div>

      {count < photos.length && (
        <div className="mt-10 flex justify-center">
          <Button
            variant="secondary"
            onClick={() => setCount((value) => value + PAGE_SIZE)}
          >
            Show more photos
          </Button>
        </div>
      )}

      <AnimatePresence>
        {current && (
          <motion.div
            key="viewer"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-[70] flex flex-col bg-ink/95 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between px-5 py-4 text-white">
              <p className="text-sm">
                <span className="font-semibold">{current.album}</span>
                <span className="text-white/60">
                  {" "}
                  · {open + 1} / {photos.length}
                </span>
              </p>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  close();
                }}
                aria-label="Close"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1 px-4 pb-6 sm:px-16">
              <motion.div
                key={current.src}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) go(1);
                  else if (info.offset.x > 80) go(-1);
                }}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                onClick={(event) => event.stopPropagation()}
                className="relative mx-auto h-full w-full max-w-5xl"
              >
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  sizes="100vw"
                  priority
                  className="object-contain"
                />
              </motion.div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  go(-1);
                }}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-4"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  go(1);
                }}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-4"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionContainer>
  );
}