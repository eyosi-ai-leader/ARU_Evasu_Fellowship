"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Home,
  LifeBuoy,
  Mail,
  Phone,
  Search,
  Send,
  Settings,
  UserRound,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* EDIT THESE: fill in your real contact details.                      */
/* Leave a value empty ("") and it will not be shown.                  */
/* ------------------------------------------------------------------ */
const CONTACT = {
  email: "eyos4314@gmail.com",
  phone: "+251 923078426",
  telegram: "@eyos26", // a full link, for example https://t.me/yourchannel
};

// Change this if your Terms page lives at another address.
const TERMS_HREF = "/terms";

const QUICK_LINKS = [
  {
    name: "My Profile",
    text: "Update your details and photo",
    href: "/dashboard/profile",
    icon: UserRound,
  },
  {
    name: "Settings",
    text: "Password and email preferences",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    name: "Events",
    text: "See and answer upcoming events",
    href: "/dashboard/events",
    icon: CalendarDays,
  },
  {
    name: "Announcements",
    text: "Messages from your leaders",
    href: "/dashboard/announcements",
    icon: Bell,
  },
];

const FAQS = [
  {
    category: "Account",
    question: "How do I change my password?",
    answer:
      "Open Settings from the account menu at the bottom of the sidebar, then use the password section. You will need your current password.",
  },
  {
    category: "Account",
    question: "I forgot my password. What can I do?",
    answer:
      "On the sign-in page choose the forgot password option and follow the steps. If you cannot get in, contact your fellowship leaders.",
  },
  {
    category: "Account",
    question: "How do I update my phone number, address or photo?",
    answer:
      "Go to My Profile and press Edit profile. A complete profile helps your leaders reach you.",
  },
  {
    category: "Account",
    question: "I see a message that my account is inactive.",
    answer:
      "Your account was made inactive by your fellowship leaders. Please contact them so they can reactivate it.",
  },
  {
    category: "My Fellowship",
    question: "Why does it say I am not in a small group yet?",
    answer:
      "Your fellowship leaders place new members in a small group. Until then the My Small Group page stays empty. Ask your campus leaders if it has been a while.",
  },
  {
    category: "My Fellowship",
    question: "Why am I not in a family?",
    answer:
      "Families belong to a small group. Once you are in a small group, your small group overseer will place you in a family.",
  },
  {
    category: "My Fellowship",
    question: "Why can I see the phone number of some people but not others?",
    answer:
      "For privacy, only overseers, parents and ministry leaders show a phone number. Other members keep their contact details private.",
  },
  {
    category: "My Fellowship",
    question: "How do I join a ministry?",
    answer:
      "Ministry leaders add members to their ministry. Speak to the leader of the ministry you are interested in, or ask your small group overseer.",
  },
  {
    category: "Events and announcements",
    question: "How do I tell the fellowship I am coming to an event?",
    answer:
      "Open Events, tap an event to see its details, then choose Going, Maybe or Can't go. This is only available when the event has RSVP turned on. Press your answer again to remove it.",
  },
  {
    category: "Events and announcements",
    question: "Why can't I see some events?",
    answer:
      "You only see events meant for you: public events, events of your campus, and events of your own ministry and small group.",
  },
  {
    category: "Events and announcements",
    question: "Where do I read announcements?",
    answer:
      "Open Announcements in the sidebar. New ones have a dot, which disappears once you open them. Announcements sent by email only will not appear there.",
  },
  {
    category: "Events and announcements",
    question: "Why do dates look different from the Gregorian calendar?",
    answer:
      "Dates in the portal use the Ethiopian calendar (E.C.), which is what the fellowship uses. They are stored in the Gregorian calendar behind the scenes.",
  },
];

const CATEGORIES = ["All", ...new Set(FAQS.map((item) => item.category))];

function Faq({ item, open, onToggle }) {
  return (
    <li className="rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <span className="text-sm font-semibold text-slate-800">
          {item.question}
        </span>

        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <p className="border-t border-slate-100 px-4 py-3 text-sm leading-6 text-slate-600">
          {item.answer}
        </p>
      )}
    </li>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState(null);

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();

    return FAQS.filter((item) => {
      if (category !== "All" && item.category !== category) return false;

      if (!term) return true;

      return `${item.question} ${item.answer}`.toLowerCase().includes(term);
    });
  }, [search, category]);

  const hasContact = CONTACT.email || CONTACT.phone || CONTACT.telegram;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <LifeBuoy size={19} strokeWidth={1.8} aria-hidden="true" />
          </span>

          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Help &amp; Support
            </h1>
            <p className="text-sm text-slate-500">
              Answers to common questions and ways to reach us
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpenIndex(null);
            }}
            placeholder="Search for help, for example password or event"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-600"
          />
        </div>
      </section>

      {/* Quick links */}
      <section className="grid gap-4 sm:grid-cols-2">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800">
                  {link.name}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {link.text}
                </span>
              </span>
            </Link>
          );
        })}
      </section>

      {/* FAQ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Frequently asked questions
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setCategory(name);
                setOpenIndex(null);
              }}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                category === name
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {results.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {results.map((item, index) => (
              <Faq
                key={item.question}
                item={item}
                open={openIndex === index}
                onToggle={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Nothing matches your search. Try another word, or contact us below.
          </p>
        )}
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Still need help?
        </h2>

        {hasContact ? (
          <>
            <p className="mt-1 text-sm text-slate-500">
              Reach the fellowship team in any of these ways.
            </p>

            <ul className="mt-4 space-y-3 text-sm">
              {CONTACT.email && (
                <li className="flex items-center gap-3">
                  <Mail size={17} className="text-slate-400" aria-hidden="true" />
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {CONTACT.email}
                  </a>
                </li>
              )}

              {CONTACT.phone && (
                <li className="flex items-center gap-3">
                  <Phone size={17} className="text-slate-400" aria-hidden="true" />
                  <a
                    href={`tel:${CONTACT.phone}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {CONTACT.phone}
                  </a>
                </li>
              )}

              {CONTACT.telegram && (
                <li className="flex items-center gap-3">
                  <Send size={17} className="text-slate-400" aria-hidden="true" />
                  <a
                    href={CONTACT.telegram}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    Telegram
                  </a>
                </li>
              )}
            </ul>
          </>
        ) : (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Ask your small group overseer or your campus leaders. They can
            answer questions about your group, family, ministry and account.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-sm">
          <Link
            href={TERMS_HREF}
            className="font-medium text-slate-600 hover:text-slate-900 hover:underline"
          >
            Terms &amp; Conditions
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900 hover:underline"
          >
            <Home size={14} aria-hidden="true" />
            Back to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}