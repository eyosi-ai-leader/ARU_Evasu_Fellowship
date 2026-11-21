"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";

import { getCandidates, saveFamilyMembers } from "@/lib/smallGroupApi";
import {
  Avatar,
  Chip,
  ModalShell,
  primaryButton,
  secondaryButton,
} from "./parts";

const MAX_CHILDREN = 50;

/*
 * Add a father, a mother or children to a family.
 *
 * role: "Father" | "Mother" | "Child"
 * A father is male and a mother is female (the server checks it too).
 */
export default function AssignPeopleModal({
  groupId,
  family,
  role,
  onClose,
  onSaved,
}) {
  const isParent = role !== "Child";
  const wantedGender = role === "Father" ? "Male" : role === "Mother" ? "Female" : "";

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
          const list = await getCandidates(groupId, search.trim());

          if (!cancelled) {
            setCandidates(Array.isArray(list) ? list : []);
            setError("");
          }
        } catch (err) {
          if (!cancelled) setError(err.message || "We couldn't load the people.");
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
  }, [groupId, search]);

  const visible = candidates.filter(
    (person) => !wantedGender || person.gender === wantedGender
  );

  function toggle(id) {
    setSelected((current) => {
      if (isParent) return current[0] === id ? [] : [id];

      if (current.includes(id)) return current.filter((item) => item !== id);

      return current.length >= MAX_CHILDREN ? current : [...current, id];
    });
  }

  async function handleSave() {
    if (saving || selected.length === 0) return;

    try {
      setSaving(true);
      setError("");

      await saveFamilyMembers(
        family.id,
        selected.map((memberId) => ({ memberId, familyRole: role }))
      );

      await onSaved?.();
    } catch (err) {
      setError(err.message || "We couldn't save the family.");
    } finally {
      setSaving(false);
    }
  }

  const title = isParent
    ? `Add a ${role.toLowerCase()} to ${family.name}`
    : `Add children to ${family.name}`;

  return (
    <ModalShell
      title={title}
      subtitle={
        isParent
          ? `Only ${wantedGender === "Male" ? "men" : "women"} are listed. Choose one person.`
          : "Choose one or more members. They join this small group as well."
      }
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
            {isParent
              ? `Add ${role.toLowerCase()}`
              : `Add ${selected.length || ""} ${
                  selected.length === 1 ? "child" : "children"
                }`.replace("  ", " ")}
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
          aria-label="Search people"
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
            Loading people...
          </div>
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No one to add. Everyone in this campus is already in a family, or
            nobody matches your search.
          </p>
        ) : (
          <ul className="space-y-2">
            {visible.map((person) => {
              const checked = selected.includes(person.memberId);

              return (
                <li key={person.memberId}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      checked
                        ? "border-slate-400 bg-slate-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type={isParent ? "radio" : "checkbox"}
                      name="family-person"
                      checked={checked}
                      onChange={() => toggle(person.memberId)}
                      className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-400"
                    />

                    <Avatar name={person.name} />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {person.name}
                      </span>

                      <span className="block truncate text-xs text-slate-400">
                        {[person.memberNumber, person.department, person.academicStatus]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>

                    {person.inGroup ? (
                      <Chip>In this small group</Chip>
                    ) : (
                      <Chip tone="attention">No small group yet</Chip>
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