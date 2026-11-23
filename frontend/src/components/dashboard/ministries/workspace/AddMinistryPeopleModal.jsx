"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";

import {
  addLeaderMinistryMember,
  assignMinistryMember,
  getMinistryCandidates,
} from "@/lib/ministryApi";
import {
  Avatar,
  Chip,
  ModalShell,
  primaryButton,
  secondaryButton,
} from "@/components/dashboard/small-groups/parts";

const MAX_PEOPLE = 30;

const candidateName = (row) =>
  [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ");

/*
 * Add members to a ministry, or appoint a leader.
 *
 * mode "manager": campus managers (may appoint leaders)
 * mode "leader":  a ministry leader adding members to their own ministry
 *
 * Only active members of the ministry's campus are listed (the General
 * Fellowship accepts members of any campus). Several members can be added
 * at once; a leader is appointed one at a time.
 */
export default function AddMinistryPeopleModal({
  ministry,
  mode = "manager",
  role = "Member",
  onClose,
  onSaved,
  onRefresh,
}) {
  const appointing = role === "Ministry Leader";

  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    const timer = setTimeout(
      async () => {
        try {
          const response = await getMinistryCandidates(ministry.id, search.trim());

          if (!cancelled) {
            setCandidates(Array.isArray(response?.data) ? response.data : []);
            setError("");
          }
        } catch (err) {
          if (!cancelled) setError(err.message || "We couldn't load the members.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      search ? 300 : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ministry.id, search]);

  function toggle(id) {
    setSelected((current) => {
      if (appointing) return current[0] === id ? [] : [id];

      if (current.includes(id)) return current.filter((item) => item !== id);

      return current.length >= MAX_PEOPLE ? current : [...current, id];
    });
  }

  async function handleSave() {
    if (saving || selected.length === 0) return;

    setSaving(true);
    setError("");

    const failed = [];
    const saved = [];

    for (const memberId of selected) {
      try {
        if (mode === "leader") {
          await addLeaderMinistryMember(ministry.id, memberId);
        } else {
          await assignMinistryMember(ministry.id, {
            memberId,
            assignmentRole: role,
          });
        }

        saved.push(memberId);
      } catch (err) {
        const row = candidates.find((item) => item.member_id === memberId);

        failed.push({
          memberId,
          text: `${row ? candidateName(row) : `Member ${memberId}`}: ${err.message}`,
        });
      }
    }

    setSaving(false);

    if (failed.length === 0) {
      await onSaved?.(
        appointing
          ? "The leader was appointed."
          : saved.length === 1
            ? "The member was added."
            : `${saved.length} members were added.`
      );

      return;
    }

    // Some were saved: keep the dialog open for the rest.
    if (saved.length > 0) {
      setCandidates((current) =>
        current.filter((item) => !saved.includes(item.member_id))
      );
      onRefresh?.();
    }

    setSelected(failed.map((item) => item.memberId));
    setError(failed.map((item) => item.text).join(" "));
  }

  const title = appointing
    ? `Appoint a leader of ${ministry.name}`
    : `Add members to ${ministry.name}`;

  const subtitle = appointing
    ? "Choose one person. They keep their other roles and ministries."
    : ministry.isGeneral
      ? "Members of any campus can join the General Fellowship ministries."
      : "Active members of this campus. Choose one or more.";

  const buttonText = appointing
    ? "Appoint leader"
    : `Add ${selected.length || ""} ${selected.length === 1 ? "member" : "members"}`;

  return (
    <ModalShell
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      busy={saving}
      wide
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={secondaryButton}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selected.length === 0}
            className={primaryButton}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {buttonText.replace(/\s+/g, " ")}
          </button>
        </>
      }
    >
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or member number"
          aria-label="Search members"
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
        >
          {error}
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Loading members...
          </div>
        ) : candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No one to add. Everyone who can join is already in this ministry,
            or nobody matches your search.
          </p>
        ) : (
          <ul className="space-y-2">
            {candidates.map((row) => {
              const checked = selected.includes(row.member_id);
              const name = candidateName(row);

              return (
                <li key={row.member_id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      checked
                        ? "border-slate-400 bg-slate-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type={appointing ? "radio" : "checkbox"}
                      name="ministry-person"
                      checked={checked}
                      onChange={() => toggle(row.member_id)}
                      className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-400"
                    />

                    <Avatar name={name} />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {name}
                      </span>

                      <span className="block truncate text-xs text-slate-400">
                        {row.member_number}
                      </span>
                    </span>

                    {ministry.isGeneral && row.campus_code && (
                      <Chip>{row.campus_code}</Chip>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}