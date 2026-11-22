import clsx from "clsx";

export default function SectionHeader({
  subtitle,
  title,
  description,
  align = "center",
  light = false,
}) {
  return (
    <div className={clsx("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {subtitle && (
        <span
          className={clsx(
            "inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em]",
            light ? "text-accent" : "text-primary"
          )}
        >
          <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-accent" />
          {subtitle}
        </span>
      )}

      <h2
        className={clsx(
          "mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl",
          light ? "text-white" : "text-ink"
        )}
      >
        {title}
      </h2>

      {description && (
        <p
          className={clsx(
            "mt-5 text-lg leading-8",
            light ? "text-white/70" : "text-body"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}