"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

/*
 * The "..." menu of a person.
 *
 * items: [{ key, label, icon, danger, onClick }, { key, divider: true }]
 *
 * The menu is drawn on top of the page (not inside the list), so it is
 * never cut off. When there is not enough room below the button, it opens
 * upwards.
 */
export default function PersonMenu({
  items = [],
  label = "Actions",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);

  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const visibleItems = items.filter(Boolean);

  const place = useCallback(() => {
    const button = buttonRef.current;
    const menu = menuRef.current;

    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuHeight = menu?.offsetHeight || visibleItems.length * 40 + 16;
    const menuWidth = menu?.offsetWidth || 224;
    const gap = 6;
    const margin = 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < menuHeight + gap && spaceAbove > spaceBelow;

    const top = openUp
      ? Math.max(margin, rect.top - menuHeight - gap)
      : Math.min(rect.bottom + gap, window.innerHeight - menuHeight - margin);

    const left = Math.min(
      Math.max(margin, rect.right - menuWidth),
      window.innerWidth - menuWidth - margin
    );

    setPosition({ top, left });
  }, [visibleItems.length]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;

    const close = () => setOpen(false);

    const handlePointer = (event) => {
      if (
        buttonRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }

      close();
    };

    const handleKey = (event) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  if (visibleItems.length === 0) return null;

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      style={{
        position: "fixed",
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        visibility: position ? "visible" : "hidden",
      }}
      className="z-[110] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
    >
      {visibleItems.map((item) => {
        if (item.divider) {
          return (
            <div
              key={item.key}
              role="separator"
              className="my-1 h-px bg-slate-100"
            />
          );
        }

        const Icon = item.icon;

        return (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              item.onClick?.();
            }}
            className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold transition ${
              item.danger
                ? "text-red-600 hover:bg-red-50"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {Icon && <Icon size={14} aria-hidden="true" />}
            {item.label}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreVertical size={17} />
      </button>

      {menu && createPortal(menu, document.body)}
    </>
  );
}