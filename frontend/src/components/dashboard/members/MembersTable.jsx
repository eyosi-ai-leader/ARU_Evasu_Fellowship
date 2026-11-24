"use client";

import Link from "next/link";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Download,
  Eye,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";

import { getRoleName, isPrivilegedRole } from "@/lib/roles";
import { formatEthiopianDate } from "@/lib/ethiopianCalendar";
import { getBatchInfo } from "@/lib/studentBatch";

import MemberActionsMenu from "./MemberActionsMenu";
import MemberMobileCard from "./MemberMobileCard";

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function getInitials(firstName, lastName) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

// "Main Campus Fellowship" -> "Main Campus"
function shortCampusName(name) {
  return String(name || "").replace(/\s+Fellowship$/i, "");
}

/*
 * Where this person stands with signing in.
 * Returns null when the list doesn't include sign-in details
 * (for example the Ministry Leader and small group views).
 */
function getAccess(member) {
  if (member.last_login_at === undefined) return null;

  if (member.last_login_at) {
    return {
      label: "Signed in",
      title: "Has signed in",
      className: "bg-success/10 text-success",
    };
  }

  if (member.invited_at) {
    return {
      label: "Invited",
      title: "Invitation sent. Waiting for them to set a password.",
      className: "bg-primary/10 text-primary",
    };
  }

  if (!member.email_verified_at) {
    return {
      label: "Not verified",
      title: "Email not verified yet",
      className: "bg-accent/20 text-ink ring-1 ring-accent/40",
    };
  }

  return {
    label: "Not signed in",
    title: "Has not signed in yet",
    className: "bg-surface-muted text-body ring-1 ring-line",
  };
}

/*
 * Department and graduation, for example:
 *   Computer Science  /  Batch 2016 · 4th year
 *   Nursing           /  Batch 2017 · 3rd year
 */
function getAcademic(member) {
  const batch = getBatchInfo(member);

  return {
    department: member.department_name || "",
    // "Batch 2016 · 4th year"
    yearText: batch?.text || "",
  };
}

/*
 * Everything the row needs to show, and what this person may do to
 * THIS member. The backend checks every request again.
 */
function describeMember(member, { mode, canManage, isSuperAdmin, currentUserId }) {
  const firstName = member.first_name ?? member.firstName ?? "";
  const middleName = member.middle_name ?? member.middleName ?? "";
  const lastName = member.last_name ?? member.lastName ?? "";

  const fullName =
    [firstName, middleName, lastName].filter(Boolean).join(" ") ||
    "Unnamed member";

  const isMinistry = mode === "ministry";

  const accountRole = member.role_id
    ? getRoleName(member.role_id)
    : member.role_name || member.roleName || "Member";

  const assignmentRole =
    member.assignment_role || member.assignmentRole || "Member";

  const status = member.status || "Inactive";
  const access = getAccess(member);

  // Super Admin, Fellowship Admin and Staff accounts can only be touched
  // by a Super Admin.
  const locked = isPrivilegedRole(member.role_id) && !isSuperAdmin;

  const isSelf =
    currentUserId !== null &&
    currentUserId !== undefined &&
    Number(member.user_id) === Number(currentUserId);

  const canEdit = mode === "manage" && canManage && !locked;
  const canChangeRole = canEdit && !isSelf;
  const hasSignedIn = Boolean(member.last_login_at);
  const canDeleteNow = canEdit && !isSelf;

  return {
    firstName,
    lastName,
    fullName,
    initials: getInitials(firstName, lastName),
    profileImage: member.profile_image ?? member.profileImage ?? null,
    email: member.email || "",
    phone: member.phone || member.user_phone || "",
    memberNumber: member.member_number ?? member.memberNumber ?? "—",
    campus: shortCampusName(member.fellowship_name),
    ministryName: member.ministry_name || "—",
    displayedRole: isMinistry ? assignmentRole : accountRole,
    status,
    access,
    academic: getAcademic(member),
    positions: [
      ...(member.is_small_group_leader ? ["Small Group Leader"] : []),
      ...(member.is_ministry_leader ? ["Ministry Leader"] : []),
    ],
        placement: {
      hasCampus: Boolean(member.fellowship_id),
      hasSmallGroup: Number(member.small_group_count || 0) > 0,
      smallGroup: member.small_group_names || "",
      family: member.family_names || "",
      familyRole: "",
    },
    joined: formatEthiopianDate(member.created_at, {
      short: true,
      fallback: "—",
    }),

    canView: mode !== "smallGroup",
    canEdit,
    canChangeRole,
    canDelete: canDeleteNow,
    canInvite:
      mode === "manage" &&
      canManage &&
      !locked &&
      Boolean(access) &&
      !hasSignedIn &&
      status === "Active",
  };
}

/* ------------------------------------------------------------------ */
/* Columns                                                             */
/* ------------------------------------------------------------------ */

function getColumns(mode, showCampus) {
  if (mode === "ministry") {
    return [
      { key: "member", label: "Member", sort: "first_name", min: "min-w-[240px]" },
      { key: "number", label: "Member No.", sort: "member_number", min: "min-w-[130px]" },
      { key: "ministry", label: "Ministry", min: "min-w-[165px]" },
      { key: "role", label: "Assignment", min: "min-w-[135px]" },
      { key: "status", label: "Status", min: "min-w-[110px]" },
      { key: "actions", label: "Actions", align: "right", min: "min-w-[130px]" },
    ];
  }

  if (mode === "smallGroup") {
    return [
      { key: "member", label: "Member", sort: "first_name", min: "min-w-[240px]" },
      { key: "number", label: "Member No.", sort: "member_number", min: "min-w-[130px]" },
      { key: "academic", label: "Department · Batch", sort: "entry_year", min: "min-w-[190px]" },
      { key: "placement", label: "Family", min: "min-w-[170px]" },
      { key: "status", label: "Status", min: "min-w-[110px]" },
    ];
  }

  return [
    { key: "member", label: "Member", sort: "first_name", min: "min-w-[240px]" },
    { key: "number", label: "Member No.", sort: "member_number", min: "min-w-[130px]" },
    ...(showCampus
      ? [{ key: "campus", label: "Campus", sort: "fellowship", min: "min-w-[130px]" }]
      : []),
    { key: "academic", label: "Department · Batch", sort: "entry_year", min: "min-w-[190px]" },
    { key: "placement", label: "Small group · Family", min: "min-w-[190px]" },
    { key: "role", label: "Role", min: "min-w-[135px]" },
    { key: "status", label: "Status", min: "min-w-[110px]" },
    { key: "access", label: "Access", min: "min-w-[120px]" },
    { key: "actions", label: "Actions", align: "right", min: "min-w-[130px]" },
  ];
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function SortButton({
  field,
  label,
  sortBy,
  sortOrder,
  onSort,
}) {
  const active = sortBy === field;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="group inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-body transition hover:text-primary"
    >
      {label}

      {!active && (
        <ArrowUpDown
          size={12}
          className="opacity-0 transition group-hover:opacity-100"
        />
      )}

      {active && sortOrder === "asc" && (
        <ArrowUp size={12} className="text-primary" />
      )}

      {active && sortOrder === "desc" && (
        <ArrowDown size={12} className="text-primary" />
      )}
    </button>
  );
}

function Avatar({ info, size = "h-10 w-10" }) {
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-ember text-xs font-bold text-white shadow-card`}
    >
      {info.profileImage ? (
        <img
          src={info.profileImage}
          alt={info.fullName}
          className="h-full w-full object-cover"
        />
      ) : (
        info.initials || <UserRound size={16} />
      )}
    </div>
  );
}

function MemberName({ info, member, linked }) {
  const className =
    "block truncate text-sm font-semibold text-ink transition hover:text-primary";

  return linked ? (
    <Link
      href={`/dashboard/members/${member.id}`}
      title={info.fullName}
      className={className}
    >
      {info.fullName}
    </Link>
  ) : (
    <span title={info.fullName} className={className.replace("hover:text-primary", "")}>
      {info.fullName}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        status === "Active"
          ? "bg-success/10 text-success"
          : "bg-surface-muted text-body ring-1 ring-line"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          status === "Active" ? "bg-success" : "bg-body/50"
        }`}
      />

      <span className="truncate">{status}</span>
    </span>
  );
}

function RoleBadge({ role }) {
  return (
    <span
      title={role}
      className="inline-flex max-w-full items-center truncate rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-body ring-1 ring-line"
    >
      {role}
    </span>
  );
}

function AccessBadge({ access }) {
  if (!access) {
    return <span className="text-xs text-body/50">—</span>;
  }

  return (
    <span
      title={access.title}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${access.className}`}
    >
      {access.label}
    </span>
  );
}

function AcademicText({ academic }) {
  if (!academic.department && !academic.yearText) {
    return <span className="text-xs text-body/50">—</span>;
  }

  return (
    <div className="min-w-0">
      {academic.department && (
        <p
          title={academic.department}
          className="truncate text-sm font-medium text-ink"
        >
          {academic.department}
        </p>
      )}

      {academic.yearText && (
        <p className="mt-0.5 truncate text-xs text-body">
          {academic.yearText}
        </p>
      )}
    </div>
  );
}

function AttentionChip({ children }) {
  return (
    <span className="inline-flex rounded-full bg-accent/20 px-2.5 py-1 text-[11px] font-semibold text-ink ring-1 ring-accent/40">
      {children}
    </span>
  );
}

/*
 * Where the person belongs. A person with no small group (or no family)
 * gets a clear "not yet" label, so leaders can see who still needs a place.
 */
function PlacementText({ placement, mode }) {
  // No campus (for example Staff): nothing to show.
  if (!placement.hasCampus) {
    return <span className="text-xs text-body/50">—</span>;
  }

  // An overseer already knows the small group: show the families only.
  if (mode === "smallGroup") {
    return placement.family ? (
      <p
        title={placement.family}
        className="truncate text-sm font-medium text-ink"
      >
        {placement.family}
      </p>
    ) : (
      <AttentionChip>Not yet in a family</AttentionChip>
    );
  }

  if (!placement.hasSmallGroup) {
    return <AttentionChip>Not yet in a small group</AttentionChip>;
  }

  return (
    <div className="min-w-0">
      <p
        title={placement.smallGroup}
        className="truncate text-sm font-medium text-ink"
      >
        {placement.smallGroup}
      </p>

      {placement.family ? (
        <p
          title={placement.family}
          className="mt-0.5 truncate text-xs text-body"
        >
          {placement.family}
        </p>
      ) : (
        <p className="mt-0.5 truncate text-xs font-medium text-ember">
          Not yet in a family
        </p>
      )}
    </div>
  );
}

/*
 * The action buttons of one row (same on the table and on the cards).
 */
function RowActions({
  member,
  info,
  mode,
  canManage,
  invitingId,
  onInvite,
  onDelete,
  onChangeStatus,
  onChangeRole,
  placement,
}) {
  const inviting = invitingId === member.id;

  return (
    <div className="flex items-center justify-end gap-0.5">
      {info.canInvite && typeof onInvite === "function" && (
        <button
          type="button"
          title={
            member.invited_at ? "Resend invitation" : "Send invitation"
          }
          aria-label={`${
            member.invited_at ? "Resend" : "Send"
          } invitation to ${info.fullName}`}
          onClick={() => onInvite(member)}
          disabled={Boolean(invitingId)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-body transition hover:bg-primary/10 hover:text-primary active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-8"
        >
          {inviting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Mail size={15} />
          )}
        </button>
      )}

      {info.canView && (
        <Link
          href={`/dashboard/members/${member.id}`}
          title="View member"
          aria-label={`View ${info.fullName}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-body transition hover:bg-primary/10 hover:text-primary active:scale-[0.97] sm:h-8 sm:w-8"
        >
          <Eye size={16} />
        </Link>
      )}

      {mode === "manage" && canManage && info.canEdit && (
        <>
          <Link
            href={`/dashboard/members/${member.id}/edit`}
            title="Edit member"
            aria-label={`Edit ${info.fullName}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-body transition hover:bg-primary/10 hover:text-primary active:scale-[0.97] sm:h-8 sm:w-8"
          >
            <Pencil size={15} />
          </Link>

          {info.canDelete && (
            <button
              type="button"
              title="Delete member"
              aria-label={`Delete ${info.fullName}`}
              onClick={() => onDelete(member)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-body transition hover:bg-danger/10 hover:text-danger active:scale-[0.97] sm:h-8 sm:w-8"
            >
              <Trash2 size={15} />
            </button>
          )}

          <MemberActionsMenu
            member={member}
            onDelete={onDelete}
            onChangeStatus={onChangeStatus}
            onChangeRole={onChangeRole}
            canManage={canManage}
            canEdit={info.canEdit}
            canChangeRole={info.canChangeRole}
            canDelete={info.canDelete}
            placement={placement}
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cards (phones and tablets)                                          */
/* ------------------------------------------------------------------ */

function LoadingCards() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-3xl bg-white p-4 shadow-card ring-1 ring-line"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-surface-muted" />

            <div className="space-y-2">
              <div className="h-3.5 w-36 rounded-full bg-surface-muted" />
              <div className="h-3 w-24 rounded-full bg-surface-muted" />
            </div>
          </div>

          <div className="mt-4 h-3 w-48 rounded-full bg-surface-muted" />
        </div>
      ))}
    </div>
  );
}

function LoadingRows({ columns }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index}>
          {columns.map((column) => (
            <td key={column.key} className="px-3 py-4 first:px-4">
              {column.key === "member" ? (
                <div className="flex animate-pulse items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-surface-muted" />

                  <div className="min-w-0 space-y-2">
                    <div className="h-3.5 w-32 rounded-full bg-surface-muted" />
                    <div className="h-3 w-24 rounded-full bg-surface-muted" />
                  </div>
                </div>
              ) : (
                <div className="h-3 w-20 animate-pulse rounded-full bg-surface-muted" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The table                                                           */
/* ------------------------------------------------------------------ */

export default function MembersTable({
  members,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onDelete,
  onChangeStatus,
  onChangeRole,
  onInvite,
  invitingId = null,
  canManage,
  // "manage"     members of the fellowships the person manages
  // "ministry"   a ministry leader's assignments
  // "smallGroup" the members of the small group the person leads
  mode = "manage",
  // Show the Campus column (people who manage more than one campus).
  showCampus = false,
  isSuperAdmin = false,
  currentUserId = null,
  onExport,
}) {
  const isMinistry = mode === "ministry";
  const columns = getColumns(mode, showCampus);

  const context = { mode, canManage, isSuperAdmin, currentUserId };

  const rowProps = {
    canManage,
    invitingId,
    onInvite,
    onDelete,
    onChangeStatus,
    onChangeRole,
  };

  if (!loading && members.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center shadow-card ring-1 ring-line">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserRound size={24} />
        </div>

        <h3 className="mt-4 font-display text-lg font-semibold text-ink">
          No members found
        </h3>

        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-body">
          {isMinistry
            ? "No assignments match this ministry and your current filters. Try selecting another ministry or clearing your filters."
            : mode === "smallGroup"
              ? "No members are in your small group yet, or none match your search."
              : "Try adjusting your search or filters, or add a new member to your fellowship."}
        </p>
      </div>
    );
  }

  const lastRows = members.length > 3 ? members.length - 2 : members.length;

  return (
    <div className="w-full">
      {/* Phones and tablets: one card per member */}
      <div className="xl:hidden">
        {loading ? (
          <LoadingCards />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {members.map((member, index) => (
              <MemberMobileCard
                key={`${member.id}-${member.ministry_id ?? "all"}`}
                member={member}
                info={describeMember(member, context)}
                mode={mode}
                showCampus={showCampus}
                actions={
                  mode === "smallGroup" ? null : (
                    <RowActions
                      member={member}
                      info={describeMember(member, context)}
                      mode={mode}
                      placement={index >= lastRows ? "up" : "down"}
                      {...rowProps}
                    />
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Wide screens: the table */}
      <div className="hidden w-full overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line xl:block">
        {onExport && (
          <div className="flex justify-end border-b border-line px-4 py-3">
            <button
              type="button"
              onClick={onExport}
              disabled={!members?.length}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-muted/60">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`${column.min} px-3 py-3.5 first:px-4 ${
                      column.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {column.sort ? (
                      <SortButton
                        field={column.sort}
                        label={column.label}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={onSort}
                      />
                    ) : (
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-body">
                        {column.label}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              {loading ? (
                <LoadingRows columns={columns} />
              ) : (
                members.map((member, index) => {
                  const info = describeMember(member, context);
                  const placement = index >= lastRows ? "up" : "down";

                  const cells = {
                    member: (
                      <td key="member" className="max-w-0 px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar info={info} />

                          <div className="min-w-0 flex-1">
                            <MemberName
                              info={info}
                              member={member}
                              linked={info.canView}
                            />

                            {info.email && (
                              <p
                                title={info.email}
                                className="mt-0.5 truncate text-xs text-body"
                              >
                                {info.email}
                              </p>
                            )}

                            {info.phone && (
                              <p
                                title={info.phone}
                                className="truncate text-xs text-body/80"
                              >
                                {info.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    ),

                    number: (
                      <td key="number" className="max-w-0 px-3 py-4">
                        <span
                          title={info.memberNumber}
                          className="block max-w-full truncate font-mono text-[11px] font-medium text-body"
                        >
                          {info.memberNumber}
                        </span>
                      </td>
                    ),

                    campus: (
                      <td key="campus" className="max-w-0 px-3 py-4">
                        <span
                          title={info.campus}
                          className="block truncate text-sm text-body"
                        >
                          {info.campus || "—"}
                        </span>
                      </td>
                    ),

                    ministry: (
                      <td key="ministry" className="max-w-0 px-3 py-4">
                        <span
                          title={info.ministryName}
                          className="inline-flex max-w-full items-center gap-2 text-sm font-medium text-ink"
                        >
                          <Building2
                            size={14}
                            className="shrink-0 text-primary"
                          />

                          <span className="truncate">{info.ministryName}</span>
                        </span>
                      </td>
                    ),

                    academic: (
                      <td key="academic" className="max-w-0 px-3 py-4">
                        <AcademicText academic={info.academic} />
                      </td>
                    ),

                    placement: (
                      <td key="placement" className="max-w-0 px-3 py-4">
                        <PlacementText
                          placement={info.placement}
                          mode={mode}
                        />
                      </td>
                    ),

                    role: (
                      <td key="role" className="max-w-0 px-3 py-4">
                        <div className="flex flex-wrap gap-1">
                          <RoleBadge role={info.displayedRole} />

                          {info.positions.map((position) => (
                            <span
                              key={position}
                              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
                            >
                              {position}
                            </span>
                          ))}
                        </div>
                      </td>
                    ),

                    status: (
                      <td key="status" className="max-w-0 px-3 py-4">
                        <StatusBadge status={info.status} />
                      </td>
                    ),

                    access: (
                      <td key="access" className="whitespace-nowrap px-3 py-4">
                        <AccessBadge access={info.access} />
                      </td>
                    ),

                    actions: (
                      <td key="actions" className="whitespace-nowrap px-3 py-4">
                        <RowActions
                          member={member}
                          info={info}
                          mode={mode}
                          placement={placement}
                          {...rowProps}
                        />
                      </td>
                    ),
                  };

                  return (
                    <tr
                      key={`${member.id}-${member.ministry_id ?? "all"}`}
                      className="group transition hover:bg-primary/[0.03]"
                    >
                      {columns.map((column) => cells[column.key])}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}