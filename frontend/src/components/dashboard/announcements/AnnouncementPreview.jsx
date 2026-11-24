"use client";

import { Pin } from "lucide-react";

import { ActionLink, Pill, PriorityBadge, priorityStyle } from "./parts";

export default function AnnouncementPreview({
  subject,
  message,
  priority = "normal",
  category = "",
  pinned = false,
  actionLabel = "",
  actionUrl = "",
}) {
  const style = priorityStyle(priority);
  const Icon = style.icon;
  const empty = !subject.trim() && !message.trim();

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        priority === "normal" ? "border-slate-200" : style.border
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.iconBox}`}
        >
          <Icon size={17} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`text-sm font-bold ${
                subject.trim() ? "text-slate-900" : "text-slate-300"
              }`}
            >
              {subject.trim() || "Your subject"}
            </p>

            <PriorityBadge priority={priority} />

            {pinned && (
              <Pill tone="info">
                <Pin size={11} aria-hidden="true" />
                Pinned
              </Pill>
            )}

            {category && <Pill>{category}</Pill>}
          </div>

          <p
            className={`mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 ${
              message.trim() ? "line-clamp-6 text-slate-600" : "text-slate-300"
            }`}
          >
            {message.trim() || "Your message will appear here."}
          </p>

          {actionUrl && !empty && (
            <div className="pointer-events-none mt-3">
              <ActionLink url={actionUrl} label={actionLabel} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}