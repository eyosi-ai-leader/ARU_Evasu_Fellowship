"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Users,
  UserPlus,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  Download,
  Loader2,
  Lock,
} from "lucide-react";
import Link from "next/link";

import {
  getMembers,
  getMyMinistryMembers,
  deleteMember,
  updateMember,
  changeMemberRole,
} from "@/lib/memberApi";

import {
  getDepartments,
  getMySmallGroupMembers,
} from "@/lib/fellowshipApi";

import useMyAccess from "@/lib/useMyAccess";

import {
  ROLES,
  canManageMembers,
  isAdmin,
} from "@/lib/roles";

import { inviteMember } from "@/lib/memberAccessApi";
import { formatEthiopianDate } from "@/lib/ethiopianCalendar";
import { batchFromChoice, getBatchInfo } from "@/lib/studentBatch";

import MembersTable from "./MembersTable";
import MemberFilters from "./MemberFilters";
import MemberPagination from "./MemberPagination";
import MemberDeleteDialog from "./MemberDeleteDialog";
import ChangeStatusModal from "./ChangeStatusModal";
import ChangeRoleModal from "./ChangeRoleModal";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  roleId: "",
  fellowshipId: "",
  departmentId: "",
  // This page is for the current campus students only. Graduates will
  // get their own pages later, so this is fixed and has no filter button.
  academicStatus: "Student",
  batch: "", // "year:3" (3rd year now) or "batch:2017" (started in 2017 E.C.)
  position: "", // "" | small_group_leader | ministry_leader | no_small_group | no_family
  sortBy: "created_at",
  sortOrder: "desc",
};

const EXPORT_PAGE_SIZE = 100;
const EXPORT_MAX_PAGES = 50;

/*
 * Stop a spreadsheet from running a cell that starts with = + - or @
 * as a formula (a name typed as "=HYPERLINK(...)" for example).
 */
const escapeCsv = (value) => {
  let text = value == null ? "" : String(value);

  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

const MANAGER_EXPORT_COLUMNS = [
  ["Member Number", (m) => m.member_number],
  ["First Name", (m) => m.first_name],
  ["Middle Name", (m) => m.middle_name],
  ["Last Name", (m) => m.last_name],
  ["Email", (m) => m.email],
  ["Phone", (m) => m.phone || m.user_phone],
  ["Telegram", (m) => m.telegram_username],
  ["Gender", (m) => m.gender],
  ["Campus", (m) => m.fellowship_name],
  ["Department", (m) => m.department_name],
  ["Batch (E.C.)", (m) => getBatchInfo(m)?.batch],
  ["Expected Graduation (E.C.)", (m) => getBatchInfo(m)?.graduationEc],
  ["Home Region", (m) => m.home_region],
  ["Home Town", (m) => m.home_town],
  [
    "May Contact After Graduation",
    (m) => (m.alumni_contact_consent ? "Yes" : "No"),
  ],
  ["Date of Birth (E.C.)", (m) => formatEthiopianDate(m.date_of_birth, { fallback: "" })],
  ["Address", (m) => m.address],
  ["Member Status", (m) => m.status],
];

const LIMITED_EXPORT_COLUMNS = [
  ["Member Number", (m) => m.member_number],
  ["First Name", (m) => m.first_name],
  ["Middle Name", (m) => m.middle_name],
  ["Last Name", (m) => m.last_name],
  ["Email", (m) => m.email],
  ["Phone", (m) => m.phone],
  ["Telegram", (m) => m.telegram_username],
  ["Gender", (m) => m.gender],
  ["Department", (m) => m.department_name],
  ["Batch (E.C.)", (m) => getBatchInfo(m)?.batch],
  ["Expected Graduation (E.C.)", (m) => getBatchInfo(m)?.graduationEc],
  ["Member Status", (m) => m.status],
];

const MINISTRY_EXPORT_COLUMNS = [
  ["Member Number", (m) => m.member_number],
  ["First Name", (m) => m.first_name],
  ["Middle Name", (m) => m.middle_name],
  ["Last Name", (m) => m.last_name],
  ["Email", (m) => m.email],
  ["Phone", (m) => m.phone],
  ["Gender", (m) => m.gender],
  ["Date of Birth (E.C.)", (m) => formatEthiopianDate(m.date_of_birth, { fallback: "" })],
  ["Address", (m) => m.address],
  ["Member Status", (m) => m.status],
  ["Ministry", (m) => m.ministry_name],
  ["Assignment Role", (m) => m.assignment_role],
];

const shortCampusName = (name) =>
  String(name || "").replace(/\s+Fellowship$/i, "");

export default function MembersPage() {
  const [members, setMembers] = useState([]);

  const [ministries, setMinistries] = useState([]);
  const [ministriesLoading, setMinistriesLoading] = useState(false);
  const [selectedMinistryId, setSelectedMinistryId] = useState("");

  const [departments, setDepartments] = useState([]);

  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [statusTarget, setStatusTarget] = useState(null);
  const [changingStatus, setChangingStatus] = useState(false);

  const [roleTarget, setRoleTarget] = useState(null);
  const [changingRole, setChangingRole] = useState(false);
  const [roleError, setRoleError] = useState("");

  const [invitingId, setInvitingId] = useState(null);
  const [notice, setNotice] = useState("");

  // The role saved at sign-in. Used only until /api/me answers (or if it fails).
  const [storedRoleId, setStoredRoleId] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const {
    access,
    campuses,
    loading: accessLoading,
  } = useMyAccess();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const user = JSON.parse(storedUser);
        setStoredRoleId(Number(user?.roleId));
      }
    } catch (error) {
      console.error("Failed to load current user:", error);
    } finally {
      setUserLoaded(true);
    }
  }, []);

  const ready = userLoaded && !accessLoading;

  /*
   * What this person can do. /api/me is the truth; the saved role is only
   * a fallback if /api/me could not be reached.
   */
  const capabilities = access?.capabilities || null;

  const canManage = capabilities
    ? capabilities.includes("fellowship:manage")
    : canManageMembers(storedRoleId);

  /*
   * What the person can see here comes from what they may DO, not from one
   * role number. A manager sees the members they manage. Anyone else may
   * lead a ministry and/or oversee a small group, and can switch between
   * the two lists.
   */
  const leadsMinistry =
    !canManage &&
    (capabilities
      ? capabilities.includes("ministry:lead")
      : Number(storedRoleId) === ROLES.MINISTRY_LEADER);

  const leadsSmallGroup =
    !canManage && Boolean(capabilities?.includes("smallgroup:lead"));

  const availableModes = canManage
    ? ["manage"]
    : [
        ...(leadsMinistry ? ["ministry"] : []),
        ...(leadsSmallGroup ? ["smallGroup"] : []),
      ];

  const [selectedMode, setSelectedMode] = useState("");

  const noAccess = ready && availableModes.length === 0;

  const mode = availableModes.includes(selectedMode)
    ? selectedMode
    : availableModes[0] || "manage";

  const isMinistryLeader = mode === "ministry";
  const isSmallGroupLeader = mode === "smallGroup";

  const isSuperAdmin = access ? Boolean(access.isSuperAdmin) : isAdmin(storedRoleId);
  const currentUserId = access?.user?.id ?? null;

  // The campus filter and column only make sense for people who manage several.
  const showCampus = mode === "manage" && campuses.length > 1;

  const scopeLabel =
    mode !== "manage"
      ? ""
      : campuses.length === 1
        ? shortCampusName(campuses[0].name)
        : campuses.length > 1
          ? "All campuses you manage"
          : "";

  /*
   * Departments for the department filter: the chosen campus, or the only
   * campus the person manages.
   */
  const departmentCampusId =
    filters.fellowshipId ||
    (campuses.length === 1 ? String(campuses[0].id) : "");

  useEffect(() => {
    if (!canManage || !departmentCampusId) {
      setDepartments([]);
      return undefined;
    }

    let cancelled = false;

    getDepartments(departmentCampusId)
      .then((list) => {
        if (!cancelled) setDepartments(list);
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      });

    return () => {
      cancelled = true;
    };
  }, [canManage, departmentCampusId]);

  /*
   * Load the authenticated leader's assignment rows to discover
   * their ministries and calculate each ministry's active member count.
   *
   * The API returns assignment rows, so the same person can appear
   * in more than one ministry. The cards count regular Member
   * assignments, not Ministry Leader assignments.
   */
  const loadMinistrySummary = useCallback(async () => {
    if (!isMinistryLeader) {
      setMinistries([]);
      return;
    }

    try {
      setMinistriesLoading(true);

      const firstResponse = await getMyMinistryMembers({
        page: 1,
        limit: 100,
        search: "",
        status: "Active",
        roleId: "",
        sortBy: "created_at",
        sortOrder: "desc",
      });

      const firstRows = Array.isArray(firstResponse?.data)
        ? firstResponse.data
        : [];

      const totalPages = Math.max(
        1,
        Number(firstResponse?.pagination?.totalPages || 1)
      );

      let allRows = [...firstRows];

      // Support more than 100 assignments without silently
      // undercounting ministry cards.
      for (let page = 2; page <= totalPages; page += 1) {
        const response = await getMyMinistryMembers({
          page,
          limit: 100,
          search: "",
          status: "Active",
          roleId: "",
          sortBy: "created_at",
          sortOrder: "desc",
        });

        const pageRows = Array.isArray(response?.data)
          ? response.data
          : [];

        allRows = allRows.concat(pageRows);
      }

      const ministryMap = new Map();

      for (const row of allRows) {
        if (row.ministry_id == null || !row.ministry_name) {
          continue;
        }

        const id = String(row.ministry_id);

        if (!ministryMap.has(id)) {
          ministryMap.set(id, {
            id,
            name: row.ministry_name,
            status: "Active",
            memberCount: 0,
            assignmentCount: 0,
          });
        }

        const ministry = ministryMap.get(id);
        ministry.assignmentCount += 1;

        if (row.assignment_role === "Member") {
          ministry.memberCount += 1;
        }
      }

      const ministryList = Array.from(ministryMap.values()).sort(
        (a, b) => a.name.localeCompare(b.name)
      );

      setMinistries(ministryList);

      // Clear a selected ministry if it no longer appears in
      // the authenticated user's authorized ministry results.
      setSelectedMinistryId((currentId) => {
        if (
          currentId &&
          !ministryList.some((ministry) => ministry.id === currentId)
        ) {
          return "";
        }

        return currentId;
      });
    } catch (error) {
      console.error("Failed to load ministry summary:", error);
      setError(
        error.message || "Failed to load your ministry summary."
      );
    } finally {
      setMinistriesLoading(false);
    }
  }, [isMinistryLeader]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (isMinistryLeader) {
      loadMinistrySummary();
    } else {
      setMinistries([]);
    }
  }, [ready, isMinistryLeader, loadMinistrySummary]);

  /*
   * The options sent to the backend for the current filters.
   */
  const buildRequestOptions = useCallback(
    (overrides = {}) => ({
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search,
      status: filters.status,
      roleId: filters.roleId,
      fellowshipId: filters.fellowshipId,
      departmentId: filters.departmentId,
      academicStatus: filters.academicStatus,
      batch: batchFromChoice(filters.batch),
      position: filters.position,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      ...overrides,
    }),
    [
      pagination.page,
      pagination.limit,
      filters.search,
      filters.status,
      filters.roleId,
      filters.fellowshipId,
      filters.departmentId,
      filters.academicStatus,
      filters.batch,
      filters.position,
      filters.sortBy,
      filters.sortOrder,
    ]
  );

  const fetchMembersForMode = useCallback(
    (options) => {
      if (isMinistryLeader) {
        return getMyMinistryMembers({
          ...options,
          ministryId: selectedMinistryId,
        });
      }

      if (isSmallGroupLeader) {
        return getMySmallGroupMembers(options);
      }

      return getMembers(options);
    },
    [isMinistryLeader, isSmallGroupLeader, selectedMinistryId]
  );

  /*
   * Load the current table.
   * Ministry leaders use /my-ministry, small group leaders use
   * /my-small-group; everyone else uses the general members endpoint,
   * which the backend limits to the fellowships the person manages.
   */
  const loadMembers = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetchMembersForMode(buildRequestOptions());

        const rows = Array.isArray(response?.data)
          ? response.data
          : [];

        setMembers(rows);

        setPagination((previous) => ({
          ...previous,
          ...(response?.pagination || {}),
        }));
      } catch (error) {
        console.error("Members loading error:", error);
        setError(error.message || "Failed to load members.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchMembersForMode, buildRequestOptions]
  );

  useEffect(() => {
    if (!ready || noAccess) {
      if (ready) {
        setLoading(false);
      }

      return;
    }

    loadMembers();
  }, [ready, noAccess, loadMembers]);

  async function handleRefresh() {
    if (refreshing) {
      return;
    }

    await Promise.all([
      loadMembers(true),
      isMinistryLeader ? loadMinistrySummary() : Promise.resolve(),
    ]);
  }

  function resetToFirstPage() {
    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  }

  function handleMinistryChange(value) {
    setSelectedMinistryId(value);
    resetToFirstPage();
  }

  function setFilter(patch) {
    setFilters((previous) => ({
      ...previous,
      ...patch,
    }));

    resetToFirstPage();
  }

  function handleSearch(value) {
    setFilter({ search: value });
  }

  function handleStatusChange(value) {
    setFilter({ status: value });
  }

  function handleRoleChange(value) {
    setFilter({ roleId: value });
  }

  function handleCampusChange(value) {
    // A department belongs to one campus, so it is cleared.
    setFilter({ fellowshipId: value, departmentId: "" });
  }

  function handleDepartmentChange(value) {
    setFilter({ departmentId: value });
  }

  function handleBatchChange(value) {
    setFilter({ batch: value });
  }

  function handlePositionChange(value) {
    setFilter({ position: value });
  }

  // Someone who leads a ministry AND oversees a small group can switch lists.
  function handleModeChange(next) {
    if (next === mode) {
      return;
    }

    setSelectedMode(next);
    setFilters({ ...DEFAULT_FILTERS });
    setSelectedMinistryId("");
    setMembers([]);
    setLoading(true);
    resetToFirstPage();
  }

  function handleSortChange(sortBy) {
    setFilters((previous) => ({
      ...previous,
      sortBy,
      sortOrder:
        previous.sortBy === sortBy && previous.sortOrder === "asc"
          ? "desc"
          : "asc",
    }));
  }

  function handleClearFilters() {
    setFilters({ ...DEFAULT_FILTERS });
    setSelectedMinistryId("");
    resetToFirstPage();
  }

  function handlePageChange(page) {
    setPagination((previous) => ({
      ...previous,
      page,
    }));
  }

  async function handleDelete() {
    if (!deleteTarget || !canManage) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteMember(deleteTarget.id);
      setDeleteTarget(null);

      await loadMembers(true);
    } catch (error) {
      console.error("Delete member error:", error);
      setError(error.message || "Failed to delete member.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function handleChangeStatus(member) {
    if (!canManage) {
      return;
    }

    setStatusTarget(member);
    setError("");
  }

  async function handleStatusConfirm(member, status) {
    if (!member || !canManage) {
      return;
    }

    try {
      setChangingStatus(true);
      setError("");

      await updateMember(member.id, { status });
      setStatusTarget(null);

      await loadMembers(true);
    } catch (error) {
      console.error("Change member status error:", error);
      setError(error.message || "Failed to change member status.");
      setStatusTarget(null);
    } finally {
      setChangingStatus(false);
    }
  }

  function handleChangeRole(member) {
    if (!canManage) {
      return;
    }

    setRoleTarget(member);
    setRoleError("");
    setError("");
  }

  async function handleRoleConfirm(member, payload) {
    if (!member || !canManage) {
      return;
    }

    const name =
      [member.first_name, member.last_name].filter(Boolean).join(" ") ||
      member.email;

    try {
      setChangingRole(true);
      setRoleError("");

      await changeMemberRole(member.id, payload);

      setRoleTarget(null);
      setNotice(`The role of ${name} was updated.`);
      setTimeout(() => setNotice(""), 6000);

      await loadMembers(true);
    } catch (error) {
      console.error("Change member role error:", error);

      // The dialog stays open so the person can fix the choice.
      setRoleError(error.message || "Failed to change the role.");
    } finally {
      setChangingRole(false);
    }
  }

  async function handleInvite(member) {
    if (!canManage || invitingId) {
      return;
    }

    const name =
      [member.first_name, member.last_name].filter(Boolean).join(" ") ||
      member.email;

    try {
      setInvitingId(member.id);
      setError("");
      setNotice("");

      await inviteMember(member.id);

      setNotice(`An invitation email was sent to ${name}.`);
      setTimeout(() => setNotice(""), 6000);

      await loadMembers(true);
    } catch (error) {
      console.error("Send invitation error:", error);
      setError(error.message || "Failed to send the invitation.");
    } finally {
      setInvitingId(null);
    }
  }

  const hasFilters =
    Boolean(filters.position) ||
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.roleId) ||
    Boolean(filters.fellowshipId) ||
    Boolean(filters.departmentId) ||
    Boolean(filters.batch) ||
    Boolean(selectedMinistryId);

  const selectedMinistry = ministries.find(
    (ministry) => ministry.id === selectedMinistryId
  );

  /*
   * Export to an Excel-compatible CSV.
   *
   * Managers and small group leaders: EVERY member that matches the
   * current search and filters (not only the page on screen), so leaders
   * can export, for example, all graduates of one campus.
   * Ministry leaders: the rows currently loaded.
   */
  async function handleExportExcel() {
    if (exporting) {
      return;
    }

    try {
      setExporting(true);
      setError("");

      let rows = members;

      if (!isMinistryLeader) {
        rows = [];

        let page = 1;
        let totalPages = 1;

        do {
          const response = await fetchMembersForMode(
            buildRequestOptions({ page, limit: EXPORT_PAGE_SIZE })
          );

          rows = rows.concat(
            Array.isArray(response?.data) ? response.data : []
          );

          totalPages = Number(response?.pagination?.totalPages || 1);
          page += 1;
        } while (page <= totalPages && page <= EXPORT_MAX_PAGES);
      }

      if (!rows.length) {
        setError("There are no members to export.");
        return;
      }

      const columns = isMinistryLeader
        ? MINISTRY_EXPORT_COLUMNS
        : isSmallGroupLeader
          ? LIMITED_EXPORT_COLUMNS
          : MANAGER_EXPORT_COLUMNS;

      const csvRows = [
        columns.map(([label]) => escapeCsv(label)).join(","),
        ...rows.map((member) =>
          columns.map(([, getValue]) => escapeCsv(getValue(member))).join(",")
        ),
      ];

      // BOM helps Excel display UTF-8 text correctly.
      const csvContent = "\uFEFF" + csvRows.join("\r\n");
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      let nameForFile = "Members";

      if (isMinistryLeader) {
        nameForFile =
          selectedMinistryId && members[0]?.ministry_name
            ? members[0].ministry_name
            : "All-My-Ministries";
      } else if (isSmallGroupLeader) {
        nameForFile = "My-Small-Group";
      } else {
        const chosenCampus = campuses.find(
          (campus) => String(campus.id) === String(filters.fellowshipId)
        );

        nameForFile = chosenCampus
          ? shortCampusName(chosenCampus.name)
          : campuses.length === 1
            ? shortCampusName(campuses[0].name)
            : "All-Campuses";
      }

      const safeFileName = nameForFile
        .replace(/[^a-z0-9-_]/gi, "-")
        .replace(/-+/g, "-");

      link.href = url;
      link.download = `${safeFileName}-Members.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export members error:", error);
      setError(error.message || "Failed to export members.");
    } finally {
      setExporting(false);
    }
  }

  const heading = isMinistryLeader
    ? "Ministry Members"
    : isSmallGroupLeader
      ? "My Small Group"
      : "Members";

  const eyebrow = isMinistryLeader
    ? "Ministry Management"
    : isSmallGroupLeader
      ? "Small Group"
      : "Management";

  const description = isMinistryLeader
    ? "Manage and organize your ministry teams. View assignments across your ministries or select one ministry to focus on."
    : isSmallGroupLeader
      ? "The members of the small group you lead, and how to reach them."
      : canManage
        ? `Manage fellowship members${
            scopeLabel ? ` of ${scopeLabel}` : ""
          }, monitor their status, and keep their contact details up to date, including after they graduate.`
        : "View fellowship member information and directory records.";

  /*
   * A person with no members to manage, no ministry and no small group.
   */
  if (noAccess) {
    return (
      <div className="min-h-full">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-card ring-1 ring-line">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock size={24} />
          </div>

          <h1 className="mt-4 font-display text-lg font-semibold text-ink">
            No member list for your account
          </h1>

          <p className="mt-1 text-sm leading-6 text-body">
            You don&apos;t manage a fellowship, ministry or small group yet.
            If you should, ask a Super Admin to check your role and campus.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-accent shadow-soft">
              {isMinistryLeader ? (
                <Building2 size={21} strokeWidth={2} />
              ) : (
                <Users size={21} strokeWidth={2} />
              )}
            </div>

            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <span className="h-0.5 w-5 rounded-full bg-accent" />
                {eyebrow}
              </p>

              <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
                {heading}
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-body">
            {description}
          </p>
        </div>

        {/* Export and Add member, side by side */}
        <div
          className={`grid gap-2 sm:flex sm:items-center ${
            canManage ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || (!members.length && !loading)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}

            <span>{exporting ? "Exporting..." : "Export"}</span>
          </button>

          {canManage && (
            <Link
              href="/dashboard/members/create"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark active:scale-[0.97]"
            >
              <Plus size={17} />
              <span>Add member</span>
            </Link>
          )}
        </div>
      </div>

      {/* A person who leads a ministry AND oversees a small group */}
      {availableModes.length > 1 && (
        <div
          role="tablist"
          aria-label="Choose a member list"
          className="flex flex-wrap gap-2"
        >
          {availableModes.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={mode === item}
              onClick={() => handleModeChange(item)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 ${
                mode === item
                  ? "bg-primary text-white shadow-card"
                  : "bg-white text-ink ring-1 ring-line hover:text-primary hover:ring-primary/40"
              }`}
            >
              {item === "ministry" ? "My ministry" : "My small group"}
            </button>
          ))}
        </div>
      )}

      {/* Ministry cards: Ministry Leader only */}
      {isMinistryLeader && (
        <section className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                Your ministries
              </h2>

              <p className="mt-1 text-sm text-body">
                Select a card to view its assigned members.
              </p>
            </div>

            <p className="text-xs font-medium text-body">
              {ministries.length}{" "}
              {ministries.length === 1 ? "ministry" : "ministries"}
            </p>
          </div>

          {ministriesLoading && ministries.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-3xl bg-surface-muted"
                />
              ))}
            </div>
          ) : ministries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-white p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 size={22} />
              </div>

              <h3 className="mt-3 font-display text-base font-semibold text-ink">
                No active ministry assignments
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-body">
                Your ministries will appear here when you have an active
                Ministry Leader assignment.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {ministries.map((ministry) => {
                const isSelected = selectedMinistryId === ministry.id;

                return (
                  <button
                    key={ministry.id}
                    type="button"
                    onClick={() =>
                      handleMinistryChange(
                        isSelected ? "" : ministry.id
                      )
                    }
                    aria-pressed={isSelected}
                    className={`group rounded-3xl p-5 text-left shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-soft ${
                      isSelected
                        ? "bg-primary/[0.04] ring-2 ring-primary"
                        : "bg-white ring-1 ring-line"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Building2 size={19} />
                      </div>

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        Active
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <h3
                          title={ministry.name}
                          className="truncate font-display text-base font-semibold text-ink"
                        >
                          {ministry.name}
                        </h3>

                        <p className="mt-1 text-xs text-body">
                          Assigned members
                        </p>
                      </div>

                      <span className="font-display text-3xl font-semibold text-ink">
                        {ministry.memberCount}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                      <span className="text-xs font-medium text-body">
                        {isSelected ? "Currently selected" : "View members"}
                      </span>

                      {isSelected ? (
                        <CheckCircle2
                          size={16}
                          className="text-primary"
                        />
                      ) : (
                        <ArrowUpRight
                          size={16}
                          className="text-body transition group-hover:text-primary"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Ministry selector */}
      {isMinistryLeader && (
        <section className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-line sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 size={18} />
              </div>

              <div>
                <h2 className="font-display text-base font-semibold text-ink">
                  Select ministry
                </h2>

                <p className="mt-1 text-xs leading-5 text-body">
                  {selectedMinistry
                    ? `Showing assignments for ${selectedMinistry.name}.`
                    : "All my ministries — view assignments across your ministry teams."}
                </p>
              </div>
            </div>

            <div className="w-full sm:max-w-xs">
              <select
                value={selectedMinistryId}
                onChange={(event) =>
                  handleMinistryChange(event.target.value)
                }
                disabled={ministriesLoading && ministries.length === 0}
                className="h-11 w-full rounded-full border border-line bg-white px-4 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-muted"
              >
                <option value="">All my ministries</option>

                {ministries.map((ministry) => (
                  <option key={ministry.id} value={ministry.id}>
                    {ministry.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      {/* General member overview cards for non-Ministry Leaders */}
      {!isMinistryLeader && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-line sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-body">
                  Total students
                </p>

                <p className="mt-2 font-display text-xl font-semibold text-ink sm:text-3xl">
                  {pagination.total.toLocaleString()}
                </p>
              </div>

              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
                <Users size={18} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-line sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-body">
                  Showing
                </p>

                <p className="mt-2 font-display text-xl font-semibold text-ink sm:text-3xl">
                  {members.length}
                </p>
              </div>

              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
                <UserPlus size={18} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-line sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-body">
                  Page
                </p>

                <p className="mt-2 font-display text-xl font-semibold text-ink sm:text-3xl">
                  {pagination.totalPages
                    ? `${pagination.page} / ${pagination.totalPages}`
                    : "0"}
                </p>
              </div>

              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
                <span className="font-display text-sm font-semibold">
                  {pagination.page}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and filters */}
      <MemberFilters
        mode={mode}
        isSuperAdmin={isSuperAdmin}
        filters={filters}
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onRoleChange={handleRoleChange}
        onCampusChange={handleCampusChange}
        onDepartmentChange={handleDepartmentChange}
        onBatchChange={handleBatchChange}
        onPositionChange={handlePositionChange}
        onClear={handleClearFilters}
        hasFilters={hasFilters}
        campuses={showCampus ? campuses : []}
        departments={departments}
      />

      {notice && (
        <div
          role="status"
          className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-danger">
                Could not complete the request
              </p>

              <p className="mt-1 text-xs text-danger">{error}</p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-danger ring-1 ring-danger/30 transition hover:bg-danger/10 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Assignment-aware table (cards on phones) */}
      <MembersTable
        members={members}
        loading={loading || !ready}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={handleSortChange}
        onDelete={setDeleteTarget}
        onChangeStatus={handleChangeStatus}
        onChangeRole={handleChangeRole}
        onInvite={handleInvite}
        invitingId={invitingId}
        canManage={canManage}
        mode={mode}
        showCampus={showCampus}
        isSuperAdmin={isSuperAdmin}
        currentUserId={currentUserId}
      />

      {!loading && !error && pagination.total > 0 && (
        <MemberPagination
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}

      {/* Management actions: only for people who manage members */}
      {canManage && (
        <MemberDeleteDialog
          member={deleteTarget}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {canManage && (
        <ChangeStatusModal
          member={statusTarget}
          open={Boolean(statusTarget)}
          saving={changingStatus}
          onClose={() => setStatusTarget(null)}
          onConfirm={handleStatusConfirm}
        />
      )}

      {canManage && (
        <ChangeRoleModal
          member={roleTarget}
          open={Boolean(roleTarget)}
          saving={changingRole}
          error={roleError}
          onClose={() => setRoleTarget(null)}
          onConfirm={handleRoleConfirm}
        />
      )}
    </div>
  );
}