"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Pencil, Plus } from "lucide-react";

import {
  deleteFamily,
  getFamilies,
  removeFamilyMember,
  removeOverseer,
  saveFamilyMembers,
} from "@/lib/smallGroupApi";

import AddOverseerModal from "./AddOverseerModal";
import AssignPeopleModal from "./AssignPeopleModal";
import FamilyCard from "./FamilyCard";
import FamilyFormModal from "./FamilyFormModal";
import OverseersPanel from "./OverseersPanel";
import SmallGroupFormModal from "./SmallGroupFormModal";
import UnassignedPanel from "./UnassignedPanel";
import { Chip, primaryButton, secondaryButton, shortCampusName } from "./parts";

function Tile({ label, value, attention = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${
        attention ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

export default function SmallGroupDetailPage() {
  const params = useParams();
  const groupId = params?.groupId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const [familyModal, setFamilyModal] = useState(null); // { mode, family }
  const [assignModal, setAssignModal] = useState(null); // { family, role }
  const [overseerModal, setOverseerModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);

  const load = useCallback(
    async (showSpinner = true) => {
      if (!groupId) return;

      try {
        if (showSpinner) setLoading(true);

        setData(await getFamilies(groupId));
        setError("");
      } catch (err) {
        setError(err.message || "Failed to load the small group.");
      } finally {
        setLoading(false);
      }
    },
    [groupId]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Runs one change, then loads the page again.
  async function run(key, work, successText) {
    if (busyKey) return;

    setBusyKey(key);
    setError("");
    setNotice("");

    try {
      await work();

      if (successText) setNotice(successText);

      await load(false);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusyKey("");
    }
  }

  const handleRemovePerson = (family, person) =>
    run(
      `remove-${person.memberId}`,
      () => removeFamilyMember(family.id, person.memberId),
      `${person.name} was taken out of ${family.name}.`
    );

  const handleDeleteFamily = (family) =>
    run(
      `delete-${family.id}`,
      () => deleteFamily(family.id),
      `${family.name} was deleted. Its people are listed under "Not yet in a family".`
    );

  const handleQuickAssign = (person, familyId) =>
    run(
      `assign-${person.memberId}`,
      () =>
        saveFamilyMembers(familyId, [
          { memberId: person.memberId, familyRole: "Child" },
        ]),
      `${person.name} was added to the family.`
    );

  const handleRemoveOverseer = (overseer) => {
    if (
      !window.confirm(
        `Remove ${overseer.name} as an overseer of ${data.group.name}? They stay a member of the fellowship.`
      )
    ) {
      return;
    }

    run(
      `overseer-${overseer.memberId}`,
      () => removeOverseer(groupId, overseer.memberId),
      `${overseer.name} is no longer an overseer.`
    );
  };

  async function afterModal(text) {
    setFamilyModal(null);
    setAssignModal(null);
    setOverseerModal(false);
    setGroupModal(false);
    setNotice(text);
    await load(false);
  }

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="text-sm font-bold text-red-800">
          We couldn&apos;t open this small group
        </h1>

        <p className="mt-2 text-sm text-red-600">{error}</p>

        <Link
          href="/dashboard/small-groups"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          Back to small groups
        </Link>
      </div>
    );
  }

  const { group, families, unassigned } = data;

  const active = group.status === "Active";
  const peopleInFamilies = families.reduce(
    (sum, family) =>
      sum +
      (family.father ? 1 : 0) +
      (family.mother ? 1 : 0) +
      family.childCount,
    0
  );
  const needParent = families.filter((family) => family.needsParent).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-6">
      {/* Heading */}
      <div>
        <Link
          href="/dashboard/small-groups"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to small groups
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {group.name}
              </h1>

              <Chip>{shortCampusName(group.fellowshipName)}</Chip>

              {!active && <Chip tone="attention">Inactive</Chip>}
            </div>

            {group.description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {group.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {group.canManage && (
              <button
                type="button"
                onClick={() => setGroupModal(true)}
                className={secondaryButton}
              >
                <Pencil size={14} />
                Edit
              </button>
            )}

            <button
              type="button"
              onClick={() => setFamilyModal({ mode: "create" })}
              disabled={!active}
              className={primaryButton}
            >
              <Plus size={15} />
              New family
            </button>
          </div>
        </div>
      </div>

      {!active && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This small group is inactive, so families can&apos;t be changed.
          {group.canManage ? " Edit it to make it active again." : ""}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Numbers */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile label="Families" value={families.length} />
        <Tile label="People in families" value={peopleInFamilies} />
        <Tile
          label="Not yet in a family"
          value={unassigned.length}
          attention={unassigned.length > 0}
        />
        <Tile
          label="Families needing a parent"
          value={needParent}
          attention={needParent > 0}
        />
      </div>

      <OverseersPanel
        overseers={group.overseers}
        canManage={group.canManage}
        disabled={!active || Boolean(busyKey)}
        busyId={
          busyKey.startsWith("overseer-")
            ? Number(busyKey.replace("overseer-", ""))
            : null
        }
        onAdd={() => setOverseerModal(true)}
        onRemove={handleRemoveOverseer}
      />

      {/* Families */}
      <section>
        <h2 className="text-base font-semibold text-slate-900">Families</h2>

        {families.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No families yet
            </p>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              Create the first family, then add a father and/or mother and the
              members they look after.
            </p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {families.map((family) => (
              <FamilyCard
                key={family.id}
                family={family}
                linkable={group.canManage}
                disabled={!active || Boolean(busyKey)}
                busyKey={busyKey}
                onEdit={(item) => setFamilyModal({ mode: "edit", family: item })}
                onDelete={handleDeleteFamily}
                onAdd={(item, role) => setAssignModal({ family: item, role })}
                onRemove={handleRemovePerson}
              />
            ))}
          </div>
        )}
      </section>

      <UnassignedPanel
        people={unassigned}
        families={families}
        busyKey={busyKey}
        disabled={!active || Boolean(busyKey)}
        onAssign={handleQuickAssign}
      />

      {/* Dialogs */}
      {familyModal && (
        <FamilyFormModal
          mode={familyModal.mode}
          groupId={group.id}
          family={familyModal.family}
          onClose={() => setFamilyModal(null)}
          onSaved={() =>
            afterModal(
              familyModal.mode === "edit"
                ? "The family was updated."
                : "The family was created."
            )
          }
        />
      )}

      {assignModal && (
        <AssignPeopleModal
          groupId={group.id}
          family={assignModal.family}
          role={assignModal.role}
          onClose={() => setAssignModal(null)}
          onSaved={() =>
            afterModal(`The family ${assignModal.family.name} was updated.`)
          }
        />
      )}

      {overseerModal && (
        <AddOverseerModal
          group={group}
          onClose={() => setOverseerModal(false)}
          onSaved={() => afterModal("The overseer was added.")}
        />
      )}

      {groupModal && (
        <SmallGroupFormModal
          mode="edit"
          group={group}
          onClose={() => setGroupModal(false)}
          onSaved={() => afterModal("The small group was updated.")}
        />
      )}
    </div>
  );
}