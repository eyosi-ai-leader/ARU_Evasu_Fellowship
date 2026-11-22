"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import {
  getFamilies,
  getSmallGroups,
  moveToFamily,
  saveFamilyMembers,
  transferToSmallGroup,
} from "@/lib/smallGroupApi";
import {
  ModalShell,
  inputClass,
  primaryButton,
  secondaryButton,
} from "./parts";

const ROLES = ["Child", "Father", "Mother"];

/*
 * One dialog for three moves:
 *   moveFamily  move a person from their family to another family
 *   addFamily   put a person in a family (also, if they are already in one)
 *   transfer    move a person to another small group of the same campus,
 *               optionally into one of its families
 */
export default function PersonMoveModal({
  mode,
  group,
  families = [],
  person,
  fromFamily = null,
  fromRole = "",
  onClose,
  onSaved,
}) {
  const [targetFamilyId, setTargetFamilyId] = useState("");
  const [role, setRole] = useState(fromRole || "Child");

  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(mode === "transfer");
  const [toGroupId, setToGroupId] = useState("");
  const [toFamilies, setToFamilies] = useState([]);
  const [loadingFamilies, setLoadingFamilies] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Transfer: the other small groups of this campus.
  useEffect(() => {
    if (mode !== "transfer") return undefined;

    let cancelled = false;

    getSmallGroups()
      .then((list) => {
        if (cancelled) return;

        setGroups(
          (Array.isArray(list) ? list : []).filter(
            (item) =>
              item.fellowshipId === group.fellowshipId &&
              item.id !== group.id &&
              item.status === "Active"
          )
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "We couldn't load the small groups.");
      })
      .finally(() => {
        if (!cancelled) setLoadingGroups(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, group.fellowshipId, group.id]);

  // Transfer: the families of the chosen small group.
  useEffect(() => {
    setTargetFamilyId("");

    if (mode !== "transfer" || !toGroupId) {
      setToFamilies([]);
      return undefined;
    }

    let cancelled = false;

    setLoadingFamilies(true);

    getFamilies(toGroupId)
      .then((data) => {
        if (!cancelled) {
          setToFamilies((data?.families || []).filter((f) => f.status === "Active"));
        }
      })
      .catch(() => {
        if (!cancelled) setToFamilies([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingFamilies(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, toGroupId]);

  const familyOptions =
    mode === "transfer"
      ? toFamilies
      : families.filter((family) => !fromFamily || family.id !== fromFamily.id);

  const titles = {
    moveFamily: `Move ${person.name} to another family`,
    addFamily: `Add ${person.name} to a family`,
    transfer: `Move ${person.name} to another small group`,
  };

  const subtitles = {
    moveFamily: "They leave their current family and join the one you choose.",
    addFamily: "A member can be in several families. They keep their other families.",
    transfer: `They leave ${group.name} and its families, and join the small group you choose. A family there is optional.`,
  };

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    if (mode === "transfer" && !toGroupId) {
      setError("Choose the small group.");
      return;
    }

    if (mode !== "transfer" && !targetFamilyId) {
      setError("Choose the family.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (mode === "moveFamily") {
        await moveToFamily(fromFamily.id, person.memberId, {
          toFamilyId: Number(targetFamilyId),
          familyRole: role,
        });
      } else if (mode === "addFamily") {
        await saveFamilyMembers(Number(targetFamilyId), [
          { memberId: person.memberId, familyRole: role },
        ]);
      } else {
        await transferToSmallGroup(
          group.id,
          person.memberId,
          targetFamilyId
            ? {
                toGroupId: Number(toGroupId),
                toFamilyId: Number(targetFamilyId),
                familyRole: role,
              }
            : { toGroupId: Number(toGroupId) }
        );
      }

      await onSaved?.(
        mode === "transfer"
          ? `${person.name} was moved to another small group.`
          : mode === "moveFamily"
            ? `${person.name} was moved to another family.`
            : `${person.name} was added to the family.`
      );
    } catch (err) {
      setError(err.message || "We couldn't save the change.");
    } finally {
      setSaving(false);
    }
  }

  const showRole = mode !== "transfer" || Boolean(targetFamilyId);

  return (
    <ModalShell
      title={titles[mode]}
      subtitle={subtitles[mode]}
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
            type="submit"
            form="person-move-form"
            disabled={saving}
            className={primaryButton}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {mode === "transfer" ? "Move person" : "Save"}
          </button>
        </>
      }
    >
      <form
        id="person-move-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        {mode === "transfer" && (
          <div>
            <label
              htmlFor="move-group"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              New small group
            </label>

            <select
              id="move-group"
              value={toGroupId}
              onChange={(event) => setToGroupId(event.target.value)}
              disabled={loadingGroups}
              className={inputClass}
            >
              <option value="">
                {loadingGroups ? "Loading..." : "Select small group"}
              </option>

              {groups.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>

            {!loadingGroups && groups.length === 0 && (
              <p className="mt-1.5 text-xs text-slate-400">
                There is no other active small group you can move people to.
                A campus leader can create one.
              </p>
            )}
          </div>
        )}

        {(mode !== "transfer" || toGroupId) && (
          <div>
            <label
              htmlFor="move-family"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              {mode === "transfer" ? "Family (optional)" : "Family"}
            </label>

            <select
              id="move-family"
              value={targetFamilyId}
              onChange={(event) => setTargetFamilyId(event.target.value)}
              disabled={loadingFamilies}
              className={inputClass}
            >
              <option value="">
                {loadingFamilies
                  ? "Loading..."
                  : mode === "transfer"
                    ? "No family yet"
                    : "Select family"}
              </option>

              {familyOptions.map((family) => (
                <option key={family.id} value={String(family.id)}>
                  {family.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showRole && (
          <div>
            <label
              htmlFor="move-role"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Place in the family
            </label>

            <select
              id="move-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className={inputClass}
            >
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {role !== "Child" && (
              <p className="mt-1.5 text-xs text-slate-400">
                A father is male and a mother is female. A family has at most
                one of each.
              </p>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
          >
            {error}
          </div>
        )}
      </form>
    </ModalShell>
  );
}