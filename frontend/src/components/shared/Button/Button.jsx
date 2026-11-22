import Link from "next/link";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";

const variants = {
  primary: "bg-primary text-white shadow-sm hover:bg-primary-dark",
  accent: "bg-accent text-ink hover:brightness-105",
  dark: "bg-ink text-white hover:bg-ink-soft",
  secondary:
    "bg-white text-ink ring-1 ring-line hover:text-primary hover:ring-primary/40",
  ghost: "text-ink hover:bg-ink/5",
  light:
    "bg-white/10 text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/20",
};

const sizes = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-7 text-sm",
  lg: "h-14 px-8 text-base",
};

export default function Button({
  href,
  onClick,
  children,
  variant = "primary",
  size = "md",
  arrow = false,
  className = "",
  type = "button",
  disabled = false,
}) {
  const classes = clsx(
    "group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );

  const content = (
    <>
      {children}
      {arrow && (
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      )}
    </>
  );

  if (href && !disabled) {
    if (href.startsWith("/") || href.startsWith("#")) {
      return (
        <Link href={href} onClick={onClick} className={classes}>
          {content}
        </Link>
      );
    }

    const isWeb = /^https?:\/\//.test(href);

    return (
      <a
        href={href}
        onClick={onClick}
        {...(isWeb ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  );
}