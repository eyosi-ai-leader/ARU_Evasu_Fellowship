"use client";

import { useState } from "react";

import navigation from "../../../data/navigation";
import NavItem from "./navitem";
import FellowshipsNavItem from "./FellowshipsNavItem";
import { getCurrentHref } from "./nav-config";

export default function DesktopNav({ pathname }) {
  const [hovered, setHovered] = useState(null);

  const current = getCurrentHref(pathname, navigation);
  const highlighted = hovered ?? current;

  return (
    <nav
      aria-label="Main"
      className="hidden items-center gap-1 lg:flex"
      onMouseLeave={() => setHovered(null)}
    >
      {navigation.map((item) => {
        const Item =
          item.href === "/fellowships" ? FellowshipsNavItem : NavItem;

        return (
          <Item
            key={item.href}
            href={item.href}
            label={item.label}
            current={current === item.href}
            highlighted={highlighted === item.href}
            onHover={() => setHovered(item.href)}
            onLeave={() => setHovered(null)}
          />
        );
      })}
    </nav>
  );
}