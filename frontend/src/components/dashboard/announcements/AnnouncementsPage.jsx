"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Megaphone, X } from "lucide-react";

import { useAccess } from "@/components/dashboard/access/AccessProvider";

import AnnouncementHistory from "./AnnouncementHistory";
import AnnouncementInbox from "./AnnouncementInbox";
import ComposeAnnouncement from "./ComposeAnnouncement";
import { formatWhen } from "./parts";

// Anyone who manages a campus, leads a ministry or oversees a small group
// can send. Everyone can read.
const SENDER_CAPABILITIES = [
  "fellowship:manage",
  "general:manage",
  "ministry:lead",
  "smallgroup:lead",
];

const TABS = ["inbox", "compose", "sent"];

export default function AnnouncementsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { access, loading } = useAccess();

  const [notice, setNotice] = useState("");

  if (loading) return null;

  const canSend = SENDER_CAPABILITIES.some((capability) =>
    access?.capabilities?.includes(capability)
  );

  const requested = params.get("tab");
  const openId = Number(params.get("open")) || null;

  const tab = canSend && TABS.includes(requested) ? requested : "inbox";

  const goToTab = (id) =>
    router.replace(`/dashboard/announcements?tab=${id}`, { scroll: false });

  function handleSent(result) {
    const count = result.total === 1 ? "person" : "people";

    if (result.scheduled) {
      setNotice(
        `Your announcement is scheduled for ${formatWhen(
          result.scheduledAt
        )}. It goes out by itself, and you can cancel it until then.`
      );
    } else if (result.delivery === "dashboard" || result.emails === 0) {
      setNotice(`Your announcement was published to ${result.total} ${count}.`);
    } else {
      setNotice(
        `Your announcement is live and ${result.emails} ${
          result.emails === 1 ? "email is" : "emails are"
        } being sent. You can follow the progress below.`
      );
    }

    goToTab("sent");
  }

  const tabs = [
    { id: "inbox", label: "Inbox" },
    { id: "compose", label: "New announcement" },
    { id: "sent", label: "Sent & scheduled" },
  ];

  return (
    <div className={`mx-auto space-y-6 ${tab === "compose" ? "max-w-6xl" : "max-w-4xl"}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-accent shadow-soft">
          <Megaphone size={21} strokeWidth={2} />
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Announcements
          </h1>

          <p className="mt-0.5 text-sm text-body">
            {canSend
              ? "Read announcements, or send one to your campus, ministries and small groups."
              : "News and updates from your leaders."}
          </p>
        </div>
      </div>

      {canSend && (
        <div
          role="tablist"
          aria-label="Announcements"
          className="inline-flex flex-wrap gap-1 rounded-full bg-white p-1 ring-1 ring-line"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => goToTab(item.id)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                tab === item.id
                  ? "bg-primary text-white shadow-soft"
                  : "text-body hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {notice && tab === "sent" && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-3xl border border-success/30 bg-success/10 px-5 py-3 text-sm text-success"
        >
          <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />

          <span className="flex-1">{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
            className="rounded-full p-1.5 transition hover:bg-success/20"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {tab === "inbox" && <AnnouncementInbox openId={openId} />}
      {tab === "compose" && <ComposeAnnouncement onSent={handleSent} />}
      {tab === "sent" && <AnnouncementHistory />}
    </div>
  );
}