"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";

import { getInitials } from "@/data/fellowships";

const VARIANTS = {
  featured: "h-16 w-16 bg-white/15 text-2xl",
  default: "h-14 w-14 bg-gradient-to-br from-primary to-ember text-xl",
  small: "h-11 w-11 bg-gradient-to-br from-primary to-ember text-sm",
};

export default function LeaderAvatar({ name, image, variant = "default" }) {
  const [failed, setFailed] = useState(false);
  const showImage = image && !failed;

  return (
    <span
      className={clsx(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-semibold text-white",
        VARIANTS[variant]
      )}
    >
      {showImage ? (
        <Image
          src={image}
          alt={name}
          fill
          sizes="64px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}