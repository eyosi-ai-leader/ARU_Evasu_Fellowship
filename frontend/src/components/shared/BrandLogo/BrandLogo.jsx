"use client";

import { useState } from "react";
import Image from "next/image";

import { BRAND } from "@/data/brand";

export default function BrandLogo({
  size = 40,
  framed = false,
  priority = false,
  className = "",
}) {
  const [failed, setFailed] = useState(false);

  const image = failed ? (
    <span
      role="img"
      aria-label={`${BRAND.name} logo`}
      className="flex items-center justify-center rounded-xl bg-slate-900 font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      AE
    </span>
  ) : (
    <Image
      src={BRAND.logo}
      alt={`${BRAND.name} logo`}
      width={size}
      height={size}
      priority={priority}
      onError={() => {
        console.warn(
          `Logo not found at "${BRAND.logo}". Check the file name in /public and the "logo" line in data/brand.js.`
        );
        setFailed(true);
      }}
      className="object-contain"
      style={{ width: size, height: size }}
    />
  );

  if (!framed) {
    return (
      <span className={`inline-flex shrink-0 ${className}`}>{image}</span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200 ${className}`}
    >
      {image}
    </span>
  );
}