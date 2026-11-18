"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, Heart, Mail } from "lucide-react";

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_FELLOWSHIP_CONTACT_EMAIL;

export default function InactiveAccountNotice({ name, email, onBack }) {
  const headingRef = useRef(null);

  // Move focus to the message so screen-reader users hear it first.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="text-center sm:text-left">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 sm:mx-0">
        <Heart size={22} aria-hidden="true" />
      </span>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 text-xl font-bold tracking-tight text-slate-900 outline-none"
      >
        {name ? `Grace and peace, ${name}` : "Grace and peace to you"}
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        Your fellowship account is currently{" "}
        <span className="font-semibold text-slate-800">inactive</span>, so we
        are unable to open your dashboard at this time.
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        This is not a judgement, and the door is not closed. Seasons of study,
        travel and life can change how we stay connected. Please reach out
        kindly to your{" "}
        <span className="font-semibold text-slate-800">
          Fellowship Admin or one of the Main Leaders
        </span>
        , and they will gladly help you restore your access.
      </p>

      <figure className="mt-5 rounded-xl border-l-2 border-indigo-300 bg-slate-50 px-4 py-3">
        <blockquote className="text-sm italic leading-6 text-slate-600">
          &ldquo;Wherefore receive ye one another, as Christ also received us
          to the glory of God.&rdquo;
        </blockquote>
        <figcaption className="mt-1 text-xs font-medium text-slate-400">
          Romans 15:7 (KJV)
        </figcaption>
      </figure>

      <ol className="mt-5 space-y-2 text-sm text-slate-600">
        <li>1. Speak with your Fellowship Admin or a Main Leader.</li>
        <li>
          2. Share the email you registered with
          {email ? (
            <>
              {" "}
              (<span className="font-medium text-slate-800">{email}</span>)
            </>
          ) : null}{" "}
          so they can find your account.
        </li>
        <li>3. Once reactivated, sign in again. We are glad to have you.</li>
      </ol>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to sign in
        </button>

        {CONTACT_EMAIL && (
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
              "Account reactivation request"
            )}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Mail size={16} aria-hidden="true" />
            Email the leaders
          </a>
        )}
      </div>
    </div>
  );
}