"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NavItem = ({ href, label, onClick, mobile = false }) => {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={clsx(
        "relative transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        mobile
          ? "flex items-center justify-between rounded-2xl px-4 py-3.5 text-base"
          : "rounded-full px-3.5 py-2 text-sm",
        isActive
          ? "bg-ink/5 font-semibold text-ink"
          : "text-body hover:bg-ink/5 hover:text-ink"
      )}
    >
      {label}

      {isActive && (
        <span
          aria-hidden="true"
          className={clsx(
            "rounded-full bg-accent",
            mobile
              ? "h-2 w-2"
              : "absolute -bottom-0.5 left-1/2 h-1 w-4 -translate-x-1/2"
          )}
        />
      )}
    </Link>
  );
};

export default NavItem;