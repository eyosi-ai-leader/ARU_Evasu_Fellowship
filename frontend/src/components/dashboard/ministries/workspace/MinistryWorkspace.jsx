"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  CheckCircle2,
  Power,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserMinus,
} from "lucide-react";

import {
  assignMinistryMember,
  deleteMinistry,
  getLeaderMinistryMembers,
  getMinistryById,
  getMinistryMembers,
  getMyMinistries,
  removeLeaderMinistryMember,
  removeMinistryMember,
  updateLeaderMemberAssignmentStatus,
  updateLeaderMinistryDetails,
  updateMinistry,
  updateMinistryMemberStatus,
  updateMinistryStatus,
} from "@/lib/ministryApi";

import MinistryFormModal from "../MinistryFormModal";
import { exportMinistryCsv, printMinistryDirectory } from "../ministryExport";
import { LEADER_ROLE, normalizeMinistry, toAssignment } from "../ministryUtils";

import AddMinistryPeopleModal from "./AddMinistryPeopleModal";
import MinistryHeader from "./MinistryHeader";
import MinistryLeadersPanel from "./MinistryLeadersPanel";
import MinistryMembersPanel from "./MinistryMembersPanel";
import MoveMemberModal from "./MoveMemberModal";
import useConfirm from "../useConfirm";

function Tile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

/*
 * One ministry, for two kinds of people:
 *   mode "manager"  campus managers: edit everything, appoint leaders,
 *                   move members, activate / deactivate / delete the ministry
 *   mode "leader"   a ministry leader: edit the details and manage the
 *                   members of their own ministry
 * The server enforces the same rules.
 */
export default function MinistryWorkspace({
  ministryId,
  mode = "manager",
  backHref = "",
}) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirm();
  const isLeader = mode === "leader";

  const [ministry, setMinistry] = useState(null);
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Active");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [addRole, setAddRole] = useState(null); // "Member" | "Ministry Leader"
  const [moveTarget, setMoveTarget] = useState(null); // a person

  const load = useCallback(
    async (showSpinner = true) => {
      if (!ministryId) return;

      try {
        if (showSpinner) setLoading(true);

        let meta;
        let list;

        if (isLeader) {
          const [mine, assignments] = await Promise.all([
            getMyMinistries(),
            getLeaderMinistryMembers(ministryId, statusFilter),
          ]);

          meta = (Array.isArray(mine?.data) ? mine.data : []).find(
            (item) => String(item.id) === String(ministryId)
          );

          if (!meta) {
            throw new Error(
              "This ministry was not found, or you don't lead it."
            );
          }

          list = assignments?.data;
        } else {
          const [detail, assignments] = await Promise.all([
            getMinistryById(ministryId),
            getMinistryMembers(ministryId, "", statusFilter),
          ]);

          meta = detail?.data;
          list = assignments?.data;
        }

        setMinistry(normalizeMinistry(meta));
        setRows((Array.isArray(list) ? list : []).map(toAssignment));
        setError("");
      } catch (err) {
        setError(err.message || "Unable to load this ministry.");
      } finally {
        setLoading(false);
      }
    },
    [ministryId, isLeader, statusFilter]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Runs one change, then loads the screen again.
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

  const leaders = useMemo(
    () =>
      rows.filter(
        (person) => person.role === LEADER_ROLE && person.status === "Active"
      ),
    [rows]
  );

  const members = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows
      .filter((person) => person.role !== LEADER_ROLE)
      .filter(
        (person) =>
          !term ||
          [person.name, person.email, person.phone, person.memberNumber]
            .join(" ")
            .toLowerCase()
            .includes(term)
      );
  }, [rows, search]);

  const allMembersCount = rows.filter(
    (person) => person.role !== LEADER_ROLE
  ).length;

  if (loading && !ministry) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (!ministry) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="text-sm font-bold text-red-800">
          We couldn&apos;t open this ministry
        </h1>

        <p className="mt-2 text-sm text-red-600">{error}</p>

        <button
          type="button"
          onClick={() => load()}
          className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const active = ministry.status === "Active";
  const locked = !active || Boolean(busyKey);

  // Removes the person from the ministry for good.
  const removePerson = async (person) => {
    const confirmed = await confirm({
      title: `Remove ${person.name}?`,
      message: `Their place in ${ministry.name} will be deleted. They stay a fellowship member.`,
      note: "To keep their place but pause it, use Deactivate instead.",
      confirmLabel: "Remove",
      tone: "danger",
      icon: UserMinus,
    });

    if (!confirmed) return;

    run(
      person.role === LEADER_ROLE
        ? `leader-${person.memberId}`
        : `member-${person.memberId}`,
      () =>
        isLeader
          ? removeLeaderMinistryMember(ministry.id, person.memberId)
          : removeMinistryMember(ministry.id, person.memberId),
      `${person.name} was removed from the ministry.`
    );
  };

  const setRole = (person, role) =>
    run(
      role === LEADER_ROLE
        ? `member-${person.memberId}`
        : `leader-${person.memberId}`,
      () =>
        assignMinistryMember(ministry.id, {
          memberId: person.memberId,
          assignmentRole: role,
        }),
      role === LEADER_ROLE
        ? `${person.name} is now a leader of ${ministry.name}.`
        : `${person.name} is now a regular member.`
    );

  // Deactivate / reactivate a person's place (managers and leaders).
  const toggleAssignment = (person) => {
    const next = person.status === "Active" ? "Inactive" : "Active";

    run(
      `member-${person.memberId}`,
      () =>
        isLeader
          ? updateLeaderMemberAssignmentStatus(
              ministry.id,
              person.memberId,
              next
            )
          : updateMinistryMemberStatus(ministry.id, person.memberId, next),
      `${person.name}'s place is now ${next.toLowerCase()}.`
    );
  };

  // The "..." menu of a member.
  const itemsFor = (person) => {
    const isActivePlace = person.status === "Active";

    const toggleItem = {
      key: "toggle",
      label: isActivePlace
        ? "Deactivate in this ministry"
        : "Reactivate in this ministry",
      icon: isActivePlace ? Power : RotateCcw,
      onClick: () => toggleAssignment(person),
    };

    const removeItem = {
      key: "remove",
      label: "Remove from ministry",
      icon: UserMinus,
      danger: true,
      onClick: () => removePerson(person),
    };

    if (isLeader) {
      return [toggleItem, { key: "divider", divider: true }, removeItem];
    }

    return [
      isActivePlace && {
        key: "leader",
        label: "Make ministry leader",
        icon: ShieldCheck,
        onClick: () => setRole(person, LEADER_ROLE),
      },
      isActivePlace && {
        key: "move",
        label: "Move to another ministry",
        icon: ArrowRightLeft,
        onClick: () => setMoveTarget(person),
      },
      toggleItem,
      { key: "divider", divider: true },
      removeItem,
    ];
  };

  async function handleSaveDetails(data) {
    // Errors are shown inside the dialog.
    if (isLeader) {
      await updateLeaderMinistryDetails(ministry.id, data);
    } else {
      await updateMinistry(ministry.id, data);
    }

    setEditOpen(false);
    setNotice("The ministry was updated.");
    await load(false);
  }

  const handleToggleStatus = async () => {
    const next = active ? "Inactive" : "Active";

    const confirmed = await confirm({
      title: next === "Inactive" ? "Deactivate ministry?" : "Activate ministry?",
      message:
        next === "Inactive"
          ? `"${ministry.name}" will become inactive and no new people can be added to it.`
          : `"${ministry.name}" will be active again and people can be added to it.`,
      note: next === "Inactive" ? "You can activate it again at any time." : "",
      confirmLabel: next === "Inactive" ? "Deactivate" : "Activate",
      tone: next === "Inactive" ? "warning" : "default",
      icon: Power,
    });

    if (!confirmed) return;

    run(
      "ministry",
      () => updateMinistryStatus(ministry.id, next),
      `"${ministry.name}" is now ${next.toLowerCase()}.`
    );
  };

  async function handleDeleteMinistry() {
    if (busyKey) return;

    const people = ministry.memberCount + ministry.leaderCount;

    const confirmed = await confirm({
      title: `Delete "${ministry.name}"?`,
      message:
        people > 0
          ? `Its ${people} ${people === 1 ? "assignment" : "assignments"} will be removed too. The people stay fellowship members.`
          : "This ministry has no members.",
      note: "This cannot be undone. To keep it but hide it, use Deactivate instead.",
      confirmLabel: "Delete ministry",
      tone: "danger",
      icon: Trash2,
    });

    if (!confirmed) return;

    setBusyKey("ministry");
    setError("");

    try {
      await deleteMinistry(ministry.id);
      router.push(backHref || "/dashboard/ministries");
    } catch (err) {
      setError(err.message || "Unable to delete the ministry.");
      setBusyKey("");
    }
  }

  async function afterAdd(text) {
    setAddRole(null);
    setNotice(text);
    await load(false);
  }

  async function afterMove(text) {
    setMoveTarget(null);
    setNotice(text);
    await load(false);
  }

  const exportRows = rows.filter((person) => person.status === "Active");

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-6">
      <MinistryHeader
        ministry={ministry}
        backHref={backHref}
        canToggleStatus={!isLeader}
        canDelete={!isLeader}
        busy={busyKey === "ministry"}
        onEdit={() => setEditOpen(true)}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteMinistry}
        onExport={() => exportMinistryCsv(ministry, exportRows)}
        onPrint={() => {
          if (!printMinistryDirectory(ministry, exportRows)) {
            setError(
              "The print window was blocked. Allow pop-ups for this site and try again."
            );
          }
        }}
      />

      {!active && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This ministry is inactive, so people can&apos;t be added.
          {!isLeader ? " Activate it to make changes." : ""}
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Tile label="Members" value={ministry.memberCount} />
        <Tile label="Leaders" value={ministry.leaderCount} />
      </div>

      <MinistryLeadersPanel
        leaders={leaders}
        canManage={!isLeader}
        disabled={locked}
        busyKey={busyKey}
        onAdd={() => setAddRole(LEADER_ROLE)}
        onDemote={(person) => setRole(person, "Member")}
        onRemove={removePerson}
      />

      <MinistryMembersPanel
        people={members}
        total={allMembersCount}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        search={search}
        onSearch={setSearch}
        canAdd={active}
        disabled={locked}
        busyKey={busyKey}
        linkToMember={!isLeader}
        onAdd={() => setAddRole("Member")}
        getItems={itemsFor}
      />

      {editOpen && (
        <MinistryFormModal
          mode="edit"
          ministry={ministry}
          onClose={() => setEditOpen(false)}
          onSubmit={handleSaveDetails}
        />
      )}

      {addRole && (
        <AddMinistryPeopleModal
          ministry={ministry}
          mode={mode}
          role={addRole}
          onClose={() => setAddRole(null)}
          onSaved={afterAdd}
          onRefresh={() => load(false)}
        />
      )}

      {moveTarget && (
        <MoveMemberModal
          ministry={ministry}
          person={moveTarget}
          onClose={() => setMoveTarget(null)}
          onMoved={afterMove}
        />
      )}
      {confirmDialog}
    </div>
  );
}