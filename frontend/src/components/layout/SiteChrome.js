"use client";

import { usePathname } from "next/navigation";

// Pages that have their own full-screen design and no website navbar/footer.
const FOCUSED_ROUTES = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/set-password",
  "/dashboard",
];

export default function SiteChrome({ navbar, footer, children }) {
  const pathname = usePathname() ?? "";

  const isFocusedPage = FOCUSED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  return (
    <>
      {!isFocusedPage && navbar}

      <main className="flex-1">{children}</main>

      {!isFocusedPage && footer}
    </>
  );
}