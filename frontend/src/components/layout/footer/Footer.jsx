import Link from "next/link";
import {
  ArrowUpRight,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Send,
} from "lucide-react";

import BrandLogo from "@/components/shared/BrandLogo/BrandLogo";
import { BRAND } from "../../../data/brand";

const QUICK_LINKS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Events & Gallery", href: "/events" },
  { name: "Contact", href: "/contact" },
  { name: "Fellowships", href: "/fellowships" },
  { name: "Member login", href: "/login" },
];

const SOCIAL_ICONS = {
  Facebook: Globe,
  Telegram: Send,
  YouTube: Play,
  Instagram: MessageCircle,
};

const headingClass =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40";

const linkClass =
  "text-sm text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

const pillLink =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white";

export default function Footer() {
  const year = new Date().getFullYear();
  const socials = BRAND.socials.filter((social) => social.href);
  const developer = BRAND.developer;

  return (
    <footer className="relative mt-16 bg-ink text-white">
      <div
        aria-hidden="true"
        className="h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main row */}
        <div className="grid gap-8 py-10 lg:grid-cols-[1.3fr_1fr_1.3fr] lg:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <BrandLogo size={36} framed />

              <div className="leading-tight">
                <p className="text-[15px] font-semibold">{BRAND.university}</p>
                <p className="text-xs text-white/50">{BRAND.shortName}</p>
              </div>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">
              {BRAND.tagline}
            </p>

            {socials.length > 0 && (
              <div className="mt-4 flex gap-2">
                {socials.map((social) => {
                  const Icon = SOCIAL_ICONS[social.name] ?? Globe;

                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                      title={social.name}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:bg-white/15 hover:text-white"
                    >
                      <Icon size={16} aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Explore */}
          <nav aria-label="Quick links">
            <h3 className={headingClass}>Explore</h3>

            <ul className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2.5 lg:grid-cols-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className={linkClass}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Find us */}
          <div>
            <h3 className={headingClass}>Find us</h3>

            <div className="mt-4 flex items-start gap-2.5 text-sm text-white/70">
              <MapPin
                size={16}
                className="mt-0.5 shrink-0 text-accent"
                aria-hidden="true"
              />

              <p>
                {BRAND.address.lines.join(", ")}{" "}
                <a
                  href={BRAND.address.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 whitespace-nowrap font-semibold text-white hover:underline"
                >
                  Directions
                  <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              </p>
            </div>

            <ul className="mt-3 flex flex-wrap gap-2">
              {BRAND.campuses.map((campus) => (
                <li
                  key={campus}
                  className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10"
                >
                  {campus}
                </li>
              ))}
            </ul>

            {(BRAND.email || BRAND.phone) && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/70">
                {BRAND.email && (
                  <a
                    href={`mailto:${BRAND.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-white"
                  >
                    <Mail size={14} className="text-accent" aria-hidden="true" />
                    {BRAND.email}
                  </a>
                )}

                {BRAND.phone && (
                  <a
                    href={`tel:${BRAND.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1.5 hover:text-white"
                  >
                    <Phone size={14} className="text-accent" aria-hidden="true" />
                    {BRAND.phone}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-5 text-xs text-white/50 lg:flex-row lg:items-center lg:justify-between">
          <p>
            &copy; {year} {BRAND.name}. All rights reserved.
          </p>

          {developer && (
            <div className="flex flex-wrap items-center gap-1 self-start rounded-full bg-white/5 p-1 pl-4 text-white/60 ring-1 ring-white/10 lg:self-auto">
              <span>Developed by</span>

              {developer.portfolioUrl ? (
                <a
                  href={developer.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 inline-flex items-center gap-1 font-semibold text-white hover:underline"
                >
                  {developer.name}
                  <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              ) : (
                <span className="ml-1 font-semibold text-white">
                  {developer.name}
                </span>
              )}

              <span
                aria-hidden="true"
                className="mx-2 hidden h-4 w-px bg-white/15 sm:block"
              />

              {developer.email && (
                <a
                  href={`mailto:${developer.email}`}
                  aria-label={`Email ${developer.name}`}
                  title={developer.email}
                  className={pillLink}
                >
                  <Mail size={14} aria-hidden="true" />
                  <span className="hidden md:inline">{developer.email}</span>
                </a>
              )}

              {developer.phone && (
                <a
                  href={`tel:${developer.phoneLink ?? developer.phone}`}
                  aria-label={`Call ${developer.name}`}
                  title={developer.phone}
                  className={pillLink}
                >
                  <Phone size={14} aria-hidden="true" />
                  <span className="hidden md:inline">{developer.phone}</span>
                </a>
              )}

              {/* {developer.portfolioUrl && (
                <a
                  href={developer.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={developer.pitch}
                  className="inline-flex items-center gap-1 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:brightness-110"
                >
                  Connect
                  <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              )} */}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}