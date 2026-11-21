"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { getMembers } from "@/lib/memberApi";
import { addOverseer } from "@/lib/smallGroupApi";
import { Avatar, ModalShell, primaryButton } from "./parts";

const fullName = (member) =>
  [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean)
    .join(" ");

/*
 * Appoint an overseer: any active member of the small group's campus.
 * Managers only (the server checks it too).
 */
export default function AddOverseerModal({ group, onClose, onSaved }) {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  const alreadyIds = new Set((group.overseers || []).map((o) => o.memberId));

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    const timer = setTimeout(
      async () => {
        try {
          const response = await getMembers({
            page: 1,
            limit: 20,
            search,
            status: "Active",
            fellowshipId: group.fellowshipId,
            academicStatus: "",
            sortBy: "first_name",
            sortOrder: "asc",
          });

          if (!cancelled) {
            setMembers(Array.isArray(response?.data) ? response.data : []);
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
  }, [group.fellowshipId, search]);

  async function handleAppoint(member) {
    if (savingId) return;

    try {
      setSavingId(member.id);
      setError("");

      await addOverseer(group.id, member.id);

      await onSaved?.();
    } catch (err) {
      setError(err.message || "We couldn't appoint the overseer.");
    } finally {
      setSavingId(null);
    }
  }

  const visible = members.filter((member) => !alreadyIds.has(member.id));

  return (
    <ModalShell
      title="Add an overseer"
      subtitle={`Any active member of ${group.fellowshipName?.replace(/\s+Fellowship$/i, "") || "this campus"} can look after ${group.name}.`}
      onClose={onClose}
      busy={Boolean(savingId)}
      wide
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
          placeholder="Search by name, email or phone"
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
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No members found.
          </p>
        ) : (
          <ul className="space-y-2">
            {visible.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
              >
                <Avatar name={fullName(member)} />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {fullName(member)}
                  </span>

                  <span className="block truncate text-xs text-slate-400">
                    {[member.member_number, member.department_name, member.academic_status]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => handleAppoint(member)}
                  disabled={Boolean(savingId)}
                  className={primaryButton}
                >
                  {savingId === member.id && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Appoint
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}