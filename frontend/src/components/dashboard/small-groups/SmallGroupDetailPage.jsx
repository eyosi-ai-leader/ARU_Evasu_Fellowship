"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Download,
  MapPin,
  Pencil,
  Plus,
  Search,
  UserMinus,
  UserPlus,
} from "lucide-react";

import useConfirm from "@/components/dashboard/ministries/useConfirm";
import {
  deleteFamily,
  getFamilies,
  removeFamilyMember,
  removeFromSmallGroup,
  removeOverseer,
  saveFamilyMembers,
} from "@/lib/smallGroupApi";

import AddOverseerModal from "./AddOverseerModal";
import AssignPeopleModal from "./AssignPeopleModal";
import FamilyCard from "./FamilyCard";
import FamilyFormModal from "./FamilyFormModal";
import OverseersPanel from "./OverseersPanel";
import PersonMoveModal from "./PersonMoveModal";
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

// Stops spreadsheet programs from running a cell as a formula.
const csvCell = (value) => {
  let text = String(value ?? "");

  if (/^[=+\-@]/.test(text)) text = `'${text}`;

  return `"${text.replace(/"/g, '""')}"`;
};

function exportCsv(group, families, unassigned) {
  const header = [
    "Family",
    "Role",
    "Name",
    "Member number",
    "Gender",
    "Phone",
    "Department",
  ];

  const lines = [];

  const add = (family, role, person) =>
    lines.push([
      family,
      role,
      person.name,
      person.memberNumber,
      person.gender,
      person.phone,
      person.department,
    ]);

  for (const family of families) {
    if (family.father) add(family.name, "Father", family.father);
    if (family.mother) add(family.name, "Mother", family.mother);
    family.children.forEach((child) => add(family.name, "Child", child));
  }

  unassigned.forEach((person) => add("(no family yet)", "Member", person));

  const csv = [header, ...lines]
    .map((line) => line.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${group.name.replace(/[^a-z0-9-_]/gi, "-")}-families.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function SmallGroupDetailPage() {
  const params = useParams();
  const groupId = params?.groupId;

  const { confirm, confirmDialog } = useConfirm();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [query, setQuery] = useState("");

  const [familyModal, setFamilyModal] = useState(null); // { mode, family }
  const [assignModal, setAssignModal] = useState(null); // { family|null, role }
  const [personModal, setPersonModal] = useState(null); // { mode, person, family, role }
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

  const handleDeleteFamily = (family) =>
    run(
      `delete-${family.id}`,
      () => deleteFamily(family.id),
      `${family.name} was deleted. Its people are listed under "Members without a family yet".`
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

  const handleRemoveOverseer = async (overseer) => {
    const confirmed = await confirm({
      title: `Remove ${overseer.name}?`,
      message: `${overseer.name} will no longer be an overseer of ${data.group.name}. They stay a member of the fellowship.`,
      confirmLabel: "Remove overseer",
      tone: "danger",
      icon: UserMinus,
    });

    if (!confirmed) return;

    run(
      `overseer-${overseer.memberId}`,
      () => removeOverseer(groupId, overseer.memberId),
      `${overseer.name} is no longer an overseer.`
    );
  };

  const handleLeaveGroup = async (person) => {
    const confirmed = await confirm({
      title: `Remove ${person.name}?`,
      message: `${person.name} will be taken out of ${data.group.name} and its families. They stay a member of the fellowship.`,
      confirmLabel: "Remove",
      tone: "danger",
      icon: UserMinus,
    });

    if (!confirmed) return;

    run(
      `remove-${person.memberId}`,
      () => removeFromSmallGroup(groupId, person.memberId),
      `${person.name} was removed from ${data.group.name}.`
    );
  };

  // One entry point for every action of a person's menu.
  function handlePersonAction(action, family, person, role) {
    if (action === "move") {
      setPersonModal({ mode: "moveFamily", person, family, role });
    } else if (action === "also") {
      setPersonModal({ mode: "addFamily", person, family, role });
    } else if (action === "assign") {
      setPersonModal({ mode: "addFamily", person, family: null, role: "Child" });
    } else if (action === "transfer") {
      setPersonModal({ mode: "transfer", person, family, role });
    } else if (action === "out") {
      run(
        `remove-${person.memberId}`,
        () => removeFamilyMember(family.id, person.memberId),
        `${person.name} was taken out of ${family.name}. They are still in the small group.`
      );
    } else if (action === "leave") {
      handleLeaveGroup(person);
    }
  }

  async function afterModal(text) {
    setFamilyModal(null);
    setAssignModal(null);
    setPersonModal(null);
    setOverseerModal(false);
    setGroupModal(false);
    setNotice(text);
    await load(false);
  }

  const term = query.trim().toLowerCase();

  const { visibleFamilies, visibleUnassigned } = useMemo(() => {
    if (!data) return { visibleFamilies: [], visibleUnassigned: [] };

    if (!term) {
      return {
        visibleFamilies: data.families,
        visibleUnassigned: data.unassigned,
      };
    }

    const matches = (person) =>
      Boolean(person) && person.name.toLowerCase().includes(term);

    return {
      visibleFamilies: data.families.filter(
        (family) =>
          family.name.toLowerCase().includes(term) ||
          matches(family.father) ||
          matches(family.mother) ||
          family.children.some(matches)
      ),
      visibleUnassigned: data.unassigned.filter(matches),
    };
  }, [data, term]);

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
  const locked = !active || Boolean(busyKey);
  const needParent = families.filter((family) => family.needsParent).length;
  const full = group.capacity && group.memberCount >= group.capacity;

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

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {group.name}
              </h1>

              <Chip>{shortCampusName(group.fellowshipName)}</Chip>

              {!active && <Chip tone="attention">Inactive</Chip>}
              {full && <Chip tone="attention">Full</Chip>}
            </div>

            {group.purpose && (
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                {group.purpose}
              </p>
            )}

            {group.description && (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                {group.description}
              </p>
            )}

            {(group.meetingSchedule || group.meetingPlace) && (
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                {group.meetingSchedule && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock size={13} aria-hidden="true" />
                    {group.meetingSchedule}
                  </span>
                )}

                {group.meetingPlace && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} aria-hidden="true" />
                    {group.meetingPlace}
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exportCsv(group, families, unassigned)}
              className={secondaryButton}
            >
              <Download size={14} />
              Export
            </button>

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
              onClick={() => setAssignModal({ family: null, role: "Member" })}
              disabled={locked}
              className={secondaryButton}
            >
              <UserPlus size={14} />
              Add members
            </button>

            <button
              type="button"
              onClick={() => setFamilyModal({ mode: "create" })}
              disabled={locked}
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
          This small group is inactive, so it can&apos;t be changed.
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
        <Tile
          label={group.capacity ? `Members (of ${group.capacity})` : "Members"}
          value={group.memberCount}
        />
        <Tile
          label="Without a family yet"
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
        disabled={locked}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Families</h2>

          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search families and people"
              aria-label="Search families and people"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>

        {families.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No families yet
            </p>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              Families are optional. Create one when you are ready, then add a
              father and/or mother and the members they look after.
            </p>
          </div>
        ) : visibleFamilies.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No family or person matches &quot;{query}&quot;.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleFamilies.map((family) => (
              <FamilyCard
                key={family.id}
                family={family}
                familyTotal={families.length}
                linkable={group.canManage}
                disabled={locked}
                busyKey={busyKey}
                onEdit={(item) => setFamilyModal({ mode: "edit", family: item })}
                onDelete={handleDeleteFamily}
                onAdd={(item, role) => setAssignModal({ family: item, role })}
                onPersonAction={handlePersonAction}
              />
            ))}
          </div>
        )}
      </section>

      <UnassignedPanel
        people={visibleUnassigned}
        families={families}
        busyKey={busyKey}
        disabled={locked}
        onQuickAssign={handleQuickAssign}
        onPersonAction={handlePersonAction}
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
          groupName={group.name}
          family={assignModal.family}
          role={assignModal.role}
          onClose={() => setAssignModal(null)}
          onSaved={() =>
            afterModal(
              assignModal.family
                ? `The family ${assignModal.family.name} was updated.`
                : "The members were added to the small group."
            )
          }
        />
      )}

      {personModal && (
        <PersonMoveModal
          mode={personModal.mode}
          group={group}
          families={families}
          person={personModal.person}
          fromFamily={personModal.family}
          fromRole={personModal.role}
          onClose={() => setPersonModal(null)}
          onSaved={afterModal}
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

      {confirmDialog}
    </div>
  );
}