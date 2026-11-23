"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";

import { getMinistries, moveMinistryMember } from "@/lib/ministryApi";
import {
  ModalShell,
  inputClass,
  primaryButton,
  secondaryButton,
} from "@/components/dashboard/small-groups/parts";

import { normalizeMinistry, shortCampus } from "../ministryUtils";

/*
 * Move one member from this ministry to another active ministry.
 * Only ministries this member can join are listed: the same campus, or the
 * General Fellowship.
 */
export default function MoveMemberModal({
  ministry,
  person,
  onClose,
  onMoved,
}) {
  const [targets, setTargets] = useState(null);
  const [targetId, setTargetId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getMinistries({ status: "Active" })
      .then((response) => {
        if (cancelled) return;

        const list = (Array.isArray(response?.data) ? response.data : [])
          .map(normalizeMinistry)
          .filter(
            (item) =>
              item.id !== ministry.id &&
              (item.isGeneral ||
                ministry.isGeneral ||
                String(item.fellowshipId) === String(ministry.fellowshipId))
          );

        setTargets(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setTargets([]);
          setError(err.message || "We couldn't load the ministries.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ministry.id, ministry.isGeneral, ministry.fellowshipId]);

  async function handleMove() {
    if (saving || !targetId) return;

    try {
      setSaving(true);
      setError("");

      await moveMinistryMember(ministry.id, person.memberId, Number(targetId));

      const target = targets.find((item) => String(item.id) === targetId);

      await onMoved?.(
        `${person.name} was moved to ${target ? target.name : "the other ministry"}.`
      );
    } catch (err) {
      setError(err.message || "We couldn't move this member.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={`Move ${person.name}`}
      subtitle={`From ${ministry.name}. Their place here ends and they join the ministry you choose.`}
      onClose={onClose}
      busy={saving}
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
            onClick={handleMove}
            disabled={saving || !targetId}
            className={primaryButton}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <ArrowRightLeft size={15} />
            )}
            Move member
          </button>
        </>
      }
    >
      {targets === null ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Loading ministries...
        </div>
      ) : targets.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">
          There is no other active ministry this member can move to.
        </p>
      ) : (
        <div>
          <label
            htmlFor="move-target"
            className="mb-2 block text-xs font-semibold text-slate-700"
          >
            Move to
          </label>

          <select
            id="move-target"
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            className={inputClass}
          >
            <option value="">Select ministry</option>

            {targets.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name} (
                {item.isGeneral
                  ? "General Fellowship"
                  : shortCampus(item.fellowshipName)}
                )
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
        >
          {error}
        </div>
      )}
    </ModalShell>
  );
}