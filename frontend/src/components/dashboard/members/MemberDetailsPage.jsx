"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Edit3,
  GraduationCap,
  Home,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  UserRound,
  UsersRound,
  Building2,
  BadgeCheck,
} from "lucide-react";

import {
  getMemberById,
  getMyMinistryMemberById,
} from "@/lib/memberApi";
import { getMySmallGroupMemberById } from "@/lib/fellowshipApi";
import useMyAccess from "@/lib/useMyAccess";
import { formatEthiopianDate } from "@/lib/ethiopianCalendar";
import { getBatchInfo } from "@/lib/studentBatch";
import {
  ROLES,
  canManageMembers,
  getRoleName,
  isAdmin,
  isPrivilegedRole,
} from "@/lib/roles";

function getInitials(firstName, lastName) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

// Dates are shown in the Ethiopian calendar (E.C.).
function formatDate(date) {
  return formatEthiopianDate(date);
}

// "Main Campus Fellowship" -> "Main Campus"
function shortCampusName(name) {
  return String(name || "").replace(/\s+Fellowship$/i, "");
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
        <Icon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p
          title={value || ""}
          className="mt-1 break-words text-sm font-medium text-slate-700"
        >
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Icon size={17} />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>

            {description && (
              <p className="mt-0.5 text-xs text-slate-400">{description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function LoadingPage() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="flex animate-pulse items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-100" />

            <div className="space-y-2">
              <div className="h-5 w-48 rounded bg-slate-100" />
              <div className="h-3 w-28 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

export default function MemberDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const memberId = params?.id;

  const [member, setMember] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Role saved at sign-in: used only until /api/me answers (or if it fails).
  const [storedRoleId, setStoredRoleId] = React.useState(null);
  const [userLoaded, setUserLoaded] = React.useState(false);

  const { access, loading: accessLoading } = useMyAccess();

  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const user = JSON.parse(storedUser);
        setStoredRoleId(Number(user?.roleId));
      }
    } catch (err) {
      console.error("Failed to load current user:", err);
    } finally {
      setUserLoaded(true);
    }
  }, []);

  const ready = userLoaded && !accessLoading;

  /*
   * Same rules as the members list: /api/me is the truth, the saved
   * role is only a fallback.
   */
  const capabilities = access?.capabilities || null;
  const effectiveRoleId = access?.roleId ?? storedRoleId;

  const canManage = capabilities
    ? capabilities.includes("fellowship:manage")
    : canManageMembers(storedRoleId);

  const isMinistryLeader =
    !canManage && Number(effectiveRoleId) === ROLES.MINISTRY_LEADER;

  const isSmallGroupLeader =
    !canManage &&
    !isMinistryLeader &&
    Boolean(capabilities?.includes("smallgroup:lead"));

  const isSuperAdmin = access
    ? Boolean(access.isSuperAdmin)
    : isAdmin(storedRoleId);

  const currentUserId = access?.user?.id ?? null;

  React.useEffect(() => {
    if (!ready || !memberId) {
      return undefined;
    }

    let mounted = true;

    async function loadMember() {
      try {
        setLoading(true);
        setError("");

        let result;

        if (isMinistryLeader) {
          result = await getMyMinistryMemberById(memberId);
        } else if (isSmallGroupLeader) {
          result = await getMySmallGroupMemberById(memberId);
        } else {
          result = await getMemberById(memberId);
        }

        if (!mounted) {
          return;
        }

        setMember(result?.data || result?.member || result);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(err?.message || "Unable to load member information.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMember();

    return () => {
      mounted = false;
    };
  }, [memberId, ready, isMinistryLeader, isSmallGroupLeader]);

  if (!ready || loading) {
    return (
      <main className="min-h-full bg-slate-50/50 p-4 sm:p-6 lg:p-8">
        <LoadingPage />
      </main>
    );
  }

  if (error || !member) {
    return (
      <main className="min-h-full bg-slate-50/50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/dashboard/members"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to members
          </Link>

          <div className="mt-6 rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <UserRound size={20} />
            </div>

            <h1 className="mt-4 text-base font-bold text-slate-900">
              Member not found
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {error || "We could not find the requested member."}
            </p>

            <Link
              href="/dashboard/members"
              className="mt-6 inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Back to members
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const firstName = member.first_name ?? member.firstName ?? "";
  const middleName = member.middle_name ?? member.middleName ?? "";
  const lastName = member.last_name ?? member.lastName ?? "";

  const fullName =
    [firstName, middleName, lastName].filter(Boolean).join(" ") ||
    "Unnamed member";

  const profileImage = member.profile_image ?? member.profileImage ?? null;

  // Ministry and small group views do not include the account role.
  const hasRole = member.role_id !== undefined && member.role_id !== null;
  const role = hasRole ? getRoleName(member.role_id) : "";

  const status = member.status || "Inactive";
  const phone = member.phone || member.user_phone || "";
  const batchInfo = getBatchInfo(member);
  const classText = batchInfo ? batchInfo.text : "";
  const memberNumber = member.member_number || member.memberNumber || "";

  // Full details (and Edit) are for managers only.
  const showFullDetails = canManage;

  const isSelf =
    currentUserId !== null &&
    currentUserId !== undefined &&
    Number(member.user_id) === Number(currentUserId);

  // Super Admin, Fellowship Admin and Staff accounts: only a Super Admin edits them.
  const locked = hasRole && isPrivilegedRole(member.role_id) && !isSuperAdmin;
  const canEdit = canManage && !locked;

  const editLink = (
    <Link
      href={`/dashboard/members/${member.id}/edit`}
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
    >
      <Edit3 size={16} />
      Edit member
    </Link>
  );

  return (
    <main className="min-h-full bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard/members"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to members
            </Link>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Member profile
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Member Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View complete information for this fellowship member.
            </p>
          </div>

          {canEdit && editLink}
        </div>

        {/* Profile header */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-lg font-bold text-white shadow-sm">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(firstName, lastName) || <UserRound size={24} />
                  )}
                </div>

                <div className="min-w-0">
                  <h2
                    title={fullName}
                    className="truncate text-xl font-bold text-slate-900"
                  >
                    {fullName}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="max-w-[220px] truncate font-mono text-xs font-semibold text-slate-400">
                      {memberNumber || "No member number"}
                    </span>

                    {role && (
                      <>
                        <span className="text-slate-300">•</span>

                        <span className="text-xs font-medium text-slate-500">
                          {role}
                        </span>
                      </>
                    )}

                    {member.department_name && (
                      <>
                        <span className="text-slate-300">•</span>

                        <span className="text-xs font-medium text-slate-500">
                          {member.department_name}
                          {classText ? ` · ${classText}` : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    status === "Active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      status === "Active" ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />

                  {status}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Information */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal information */}
          <SectionCard
            icon={UserRound}
            title="Personal Information"
            description="Basic personal and contact information."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem icon={UserRound} label="First name" value={firstName} />
              <InfoItem icon={UserRound} label="Middle name" value={middleName} />
              <InfoItem icon={UserRound} label="Last name" value={lastName} />
              <InfoItem icon={UsersRound} label="Gender" value={member.gender} />

              {showFullDetails && (
                <InfoItem
                  icon={CalendarDays}
                  label="Date of birth"
                  value={formatDate(member.date_of_birth)}
                />
              )}

              <InfoItem icon={Mail} label="Email" value={member.email} />
              <InfoItem icon={Phone} label="Phone" value={phone} />

              {member.telegram_username !== undefined && (
                <InfoItem
                  icon={Send}
                  label="Telegram"
                  value={member.telegram_username}
                />
              )}
            </div>

            {showFullDetails && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <InfoItem
                  icon={Home}
                  label="Home region"
                  value={member.home_region}
                />

                <InfoItem
                  icon={Home}
                  label="Home town"
                  value={member.home_town}
                />

                <div className="sm:col-span-2">
                  <InfoItem
                    icon={MapPin}
                    label="Address"
                    value={member.address}
                  />
                </div>
              </div>
            )}
          </SectionCard>

          {/* Fellowship and academic information */}
          <SectionCard
            icon={GraduationCap}
            title="Fellowship & Academic"
            description="Campus, department and graduation information."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {member.fellowship_name && (
                <InfoItem
                  icon={Building2}
                  label="Campus"
                  value={shortCampusName(member.fellowship_name)}
                />
              )}

              <InfoItem
                icon={GraduationCap}
                label="Department"
                value={member.department_name}
              />

              <InfoItem
                icon={GraduationCap}
                label="Student or graduate"
                value={member.academic_status}
              />

              <InfoItem
                icon={GraduationCap}
                label="Batch (entry year)"
                value={batchInfo?.batch != null ? `${batchInfo.batch} E.C.` : ""}
              />

              <InfoItem
                icon={CalendarDays}
                label={batchInfo?.isGraduate ? "Status" : "Year of study"}
                value={batchInfo?.batch != null ? batchInfo.yearText : ""}
              />

              <InfoItem
                icon={CalendarDays}
                label={
                  batchInfo?.isGraduate
                    ? "Graduation year"
                    : "Expected graduation"
                }
                value={
                  batchInfo?.graduationEc
                    ? `${batchInfo.graduationEc} E.C.`
                    : ""
                }
              />

              <InfoItem
                icon={Clock3}
                label="Program length"
                value={
                  batchInfo?.programYears
                    ? `${batchInfo.programYears} years`
                    : ""
                }
              />

                            {member.fellowship_id && member.small_group_names !== undefined && (
                <InfoItem
                  icon={UsersRound}
                  label="Small groups"
                  value={member.small_group_names || "Not yet in a small group"}
                />
              )}

              {member.fellowship_id && member.family_names !== undefined && (
                <InfoItem
                  icon={Home}
                  label="Families"
                  value={member.family_names || "Not yet in a family"}
                />
              )} 

              <InfoItem
                icon={UsersRound}
                label="Member number"
                value={memberNumber}
              />

              {showFullDetails && (
                <InfoItem
                  icon={CalendarDays}
                  label="Baptism date"
                  value={formatDate(member.baptism_date)}
                />
              )}

              {member.created_at && (
                <InfoItem
                  icon={Clock3}
                  label="Joined"
                  value={formatDate(member.created_at)}
                />
              )}
            </div>

            {showFullDetails &&
              member.alumni_contact_consent !== undefined && (
                <div className="mt-3">
                  <InfoItem
                    icon={BadgeCheck}
                    label="May be contacted after graduation"
                    value={member.alumni_contact_consent ? "Yes" : "No"}
                  />
                </div>
              )}
          </SectionCard>
        </div>

        {/* Emergency contact: managers only */}
        {showFullDetails &&
          (member.emergency_contact_name ||
            member.emergency_contact_phone ||
            member.emergency_contact_relation) && (
            <SectionCard
              icon={Phone}
              title="Emergency Contact"
              description="Who to call if something happens."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoItem
                  icon={UserRound}
                  label="Name"
                  value={member.emergency_contact_name}
                />

                <InfoItem
                  icon={Phone}
                  label="Phone"
                  value={member.emergency_contact_phone}
                />

                <InfoItem
                  icon={UsersRound}
                  label="Relation"
                  value={member.emergency_contact_relation}
                />
              </div>
            </SectionCard>
          )}

        {/* Account information: managers only */}
        {showFullDetails && (
          <SectionCard
            icon={ShieldCheck}
            title="Account Information"
            description="System and account information associated with this member."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem icon={ShieldCheck} label="User ID" value={String(member.user_id ?? "")} />
              <InfoItem icon={ShieldCheck} label="Role" value={role} />

              {member.is_small_group_leader !== undefined && (
                <InfoItem
                  icon={ShieldCheck}
                  label="Leadership"
                  value={
                    [
                      member.is_small_group_leader && "Small group overseer",
                      member.is_ministry_leader && "Ministry leader",
                    ]
                      .filter(Boolean)
                      .join(", ") || "None"
                  }
                />
              )}

              {member.last_login_at !== undefined && (
                <InfoItem
                  icon={Clock3}
                  label="Last sign-in"
                  value={
                    member.last_login_at
                      ? formatDate(member.last_login_at)
                      : "Never signed in"
                  }
                />
              )}
              <InfoItem
                icon={Clock3}
                label="Last updated"
                value={formatDate(member.updated_at)}
              />
            </div>
          </SectionCard>
        )}

        {/* Bottom navigation */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {canEdit && !isSelf && editLink}
        </div>
      </div>
    </main>
  );
}