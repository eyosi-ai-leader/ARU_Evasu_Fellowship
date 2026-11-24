import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Megaphone, ShieldCheck, UserRound } from "lucide-react";

import AuthBrand from "@/components/shared/Auth/AuthBrand";
import LoginForm from "./LoginForm";

const HIGHLIGHTS = [
  {
    icon: Megaphone,
    text: "Read announcements from your fellowship leaders",
  },
  {
    icon: UserRound,
    text: "Keep your profile and contact details up to date",
  },
  {
    icon: ShieldCheck,
    text: "Secure sign-in with email verification",
  },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-surface-muted lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel (large screens) */}
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <Image
          src="/images/hero/Fellowship.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 via-ink/65 to-ink/40" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_45%_at_15%_0%,rgba(242,166,13,0.25),transparent)]" />

        <div className="relative">
          <AuthBrand light />
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight">
            Welcome back to your{" "}
            <span className="text-accent">fellowship family.</span>
          </h2>

          <p className="mt-5 text-base leading-7 text-white/75">
            Sign in to stay connected with announcements, your ministries and
            your campus community.
          </p>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.text} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-accent ring-1 ring-white/15 backdrop-blur">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="text-sm text-white/85">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <figure className="relative border-l-2 border-accent pl-5">
          <blockquote className="text-sm italic leading-6 text-white/80">
            &ldquo;Behold, how good and how pleasant it is for brethren to
            dwell together in unity!&rdquo;
          </blockquote>
          <figcaption className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Psalm 133:1 (KJV)
          </figcaption>
        </figure>
      </aside>

      {/* Form panel */}
      <section className="relative isolate flex items-center justify-center overflow-hidden px-6 py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <AuthBrand />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary lg:justify-start">
              <span
                aria-hidden="true"
                className="h-0.5 w-5 rounded-full bg-accent"
              />
              Member portal
            </p>

            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-body">
              Sign in to your member account to continue.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-8">
            <LoginForm />
          </div>

          <Link
            href="/"
            className="mx-auto mt-6 flex w-fit items-center gap-2 text-sm font-semibold text-body transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to the fellowship website
          </Link>
        </div>
      </section>
    </main>
  );
}