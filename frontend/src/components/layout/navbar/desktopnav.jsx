"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react";

import NavItem from "./navitem";
import navigation from "@/data/navigation";
import useAuthUser from "@/hooks/useAuthUser";

const DesktopNav = ({ onGive }) => {
  const router = useRouter();
  const { user, logout } = useAuthUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <nav
      className="hidden items-center gap-1 lg:flex"
      aria-label="Desktop Navigation"
    >
      {navigation.map((item) => (
        <NavItem key={item.label} href={item.href} label={item.label} />
      ))}

      <button
        type="button"
        onClick={onGive}
        className="ml-3 inline-flex items-center gap-2 rounded-full bg-accent/15 px-5 py-2 text-sm font-semibold text-ink ring-1 ring-accent/40 transition hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Heart className="h-4 w-4 text-accent" aria-hidden="true" />
        Give
      </button>

      {!user ? (
        <Link
          href="/login"
          className="ml-2 inline-flex items-center rounded-full bg-ink px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Login
        </Link>
      ) : (
        <div className="relative ml-2" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm font-medium text-ink ring-1 ring-line transition hover:shadow-card"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white">
              <User size={16} />
            </span>

            <span>{user.firstName || user.first_name || "User"}</span>

            <ChevronDown
              size={15}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-3 w-56 rounded-2xl bg-white p-2 shadow-soft ring-1 ring-line"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  router.push("/dashboard");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition hover:bg-surface-muted"
              >
                <LayoutDashboard size={17} />
                Dashboard
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-danger transition hover:bg-red-50"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default DesktopNav;