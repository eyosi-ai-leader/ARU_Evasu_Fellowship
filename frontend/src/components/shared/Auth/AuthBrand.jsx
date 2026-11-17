import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import BrandLogo from "../BrandLogo/BrandLogo";
import { BRAND } from "@/data/brand";

export default function AuthBrand({ light = false, showHome = false }) {
  const brand = (
    <Link
      href="/"
      aria-label={`${BRAND.name}: back to home`}
      title="Back to home"
      className="flex items-center gap-3 rounded-2xl transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25"
    >
      <BrandLogo size={34} framed priority />

      <span>
        <span
          className={`block text-sm font-bold uppercase tracking-wide ${
            light ? "text-white" : "text-slate-950"
          }`}
        >
          {BRAND.university}
        </span>

        <span className="block text-xs text-slate-400">
          {BRAND.shortName} Portal
        </span>
      </span>
    </Link>
  );

  if (!showHome) return brand;

  return (
    <div className="flex items-center justify-between gap-3">
      {brand}

      <Link
        href="/"
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
          light
            ? "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Home
      </Link>
    </div>
  );
}