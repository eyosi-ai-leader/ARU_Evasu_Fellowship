import Link from "next/link";

import BrandLogo from "@/components/shared/BrandLogo/BrandLogo";
import { BRAND } from "@/data/brand";

const Logo = () => {
  return (
    <Link
      href="/"
      aria-label={`${BRAND.name} home`}
      className="group flex items-center gap-3 rounded-full py-0.5 pr-3 transition-opacity duration-300 hover:opacity-85"
    >
      <BrandLogo size={40} priority />

      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-ink">
          {BRAND.university}
        </span>

        <span className="block text-xs font-medium text-body">
          {BRAND.shortName}
        </span>
      </span>
    </Link>
  );
};

export default Logo;