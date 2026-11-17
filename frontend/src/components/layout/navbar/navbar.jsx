"use client";

import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import Logo from "./logo";
import DesktopNav from "./desktopnav";
import MobileNav from "./mobile-navbar";
import GiveModal from "./give-modal";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [giveOpen, setGiveOpen] = useState(false);

  const openGive = useCallback(() => setGiveOpen(true), []);
  const closeGive = useCallback(() => setGiveOpen(false), []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-4 lg:px-6">
      <div
        className={clsx(
          "relative mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-full px-3 transition-all duration-300 lg:pl-4",
          scrolled ? "py-1.5" : "py-2.5"
        )}
      >
        {/* Frosted background: a separate layer so the mobile menu
            (which is fixed to the screen) is not affected by the blur. */}
        <div
          aria-hidden="true"
          className={clsx(
            "pointer-events-none absolute inset-0 -z-10 rounded-full bg-white/80 ring-1 ring-ink/5 backdrop-blur-xl transition-shadow duration-300",
            scrolled ? "shadow-soft" : "shadow-card"
          )}
        />

        <Logo />
        <DesktopNav onGive={openGive} />
        <MobileNav onGive={openGive} />
      </div>

      <GiveModal open={giveOpen} onClose={closeGive} />
    </header>
  );
};

export default Navbar;