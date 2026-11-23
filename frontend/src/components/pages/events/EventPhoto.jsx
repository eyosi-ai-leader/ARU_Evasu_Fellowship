import { CalendarDays } from "lucide-react";

export default function EventPhoto({ src, alt = "", className = "" }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt || "Event"}
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-ember text-white/80"
    >
      <CalendarDays className="h-12 w-12" strokeWidth={1.4} aria-hidden="true" />
    </div>
  );
}