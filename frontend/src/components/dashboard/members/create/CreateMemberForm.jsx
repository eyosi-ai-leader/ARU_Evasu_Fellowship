"use client";

import { useEffect, useState } from "react";

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { createMember } from "@/lib/memberApi";
import { getDepartments } from "@/lib/fellowshipApi";
import useMyAccess from "@/lib/useMyAccess";
import { canManageMembers } from "@/lib/roles";
import {
  buildMemberFormData,
  emptyMemberForm,
  getAssignableRoles,
  getRoleHelp,
  validateMemberForm,
} from "@/lib/memberForm";

import MemberProfileImage from "./MemberProfileImage";
import MemberPersonalInfo from "./MemberPersonalInfo";
import MemberContactInfo from "./MemberContactInfo";
import MemberFellowshipInfo from "./MemberFellowshipInfo";
import MemberHomeInfo from "./MemberHomeInfo";
import MemberEmergencyInfo from "./MemberEmergencyInfo";
import MemberSpiritualInfo from "./MemberSpiritualInfo";
import MemberAccountSettings from "./MemberAccountSettings";

export default function CreateMemberForm() {
  const router = useRouter();

  const { access, campuses, loading: accessLoading } = useMyAccess();

  // Role saved at sign-in: only used if /api/me cannot be loaded.
  const [storedRoleId, setStoredRoleId] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const [form, setForm] = useState(emptyMemberForm);

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  // Set after a member is created successfully.
  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        setStoredRoleId(Number(JSON.parse(storedUser)?.roleId));
      }
    } catch (error) {
      console.error("Failed to load current user:", error);
    } finally {
      setUserLoaded(true);
    }
  }, []);

  const ready = userLoaded && !accessLoading;

  const capabilities = access?.capabilities || null;

  const canManage = capabilities
    ? capabilities.includes("fellowship:manage")
    : canManageMembers(storedRoleId);

  const isSuperAdmin = access
    ? Boolean(access.isSuperAdmin)
    : Number(storedRoleId) === 1;

  const roleOptions = getAssignableRoles(isSuperAdmin);
  const roleHelp = getRoleHelp(form.roleId);

  // Only people who manage members may open this page.
  useEffect(() => {
    if (ready && !canManage) {
      router.replace("/dashboard/members");
    }
  }, [ready, canManage, router]);

  // A person who manages only one campus does not have to choose it.
  useEffect(() => {
    if (campuses.length === 1) {
      setForm((previous) =>
        previous.fellowshipId
          ? previous
          : { ...previous, fellowshipId: String(campuses[0].id) }
      );
    }
  }, [campuses]);

  // Load the departments of the chosen campus.
  useEffect(() => {
    if (!form.fellowshipId) {
      setDepartments([]);
      return undefined;
    }

    let cancelled = false;

    setDepartmentsLoading(true);

    getDepartments(form.fellowshipId)
      .then((list) => {
        if (!cancelled) setDepartments(list);
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      })
      .finally(() => {
        if (!cancelled) setDepartmentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.fellowshipId]);

  // Release the temporary photo preview when it changes or the page closes.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      // A department belongs to one campus.
      ...(name === "fellowshipId" ? { departmentId: "" } : {}),
      // A new academic status means a different entry-year list.
      ...(name === "academicStatus" ? { entryYear: "" } : {}),
      // A new region means a new city list.
      ...(name === "homeRegion" ? { homeCity: "", homeTownOther: "" } : {}),
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setServerError("");
  }

  function handleProfileImage(file) {
    if (!file) {
      setProfileImage(null);
      setPreview("");
      return;
    }

    setProfileImage(file);
    setPreview(URL.createObjectURL(file));
    setServerError("");
  }

  function resetForm() {
    setForm({
      ...emptyMemberForm,
      fellowshipId: campuses.length === 1 ? String(campuses[0].id) : "",
    });
    setProfileImage(null);
    setPreview("");
    setErrors({});
    setServerError("");
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    const validationErrors = validateMemberForm(form, {
      mode: "create",
      hasDepartments: departments.length > 0,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Invitations are only for active members.
    const invite = form.status === "Active" && Boolean(form.sendInvitation);

    try {
      setSaving(true);
      setServerError("");

      const formData = buildMemberFormData(form, { mode: "create" });

      formData.append("sendInvitation", String(invite));

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await createMember(formData);
      const data = response?.data || {};

      setResult({
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim(),
        memberId: data.memberId,
        memberNumber: data.memberNumber,
        invitationRequested: Boolean(data.invitationRequested),
        invitationSent: Boolean(data.invitationSent),
        inactive: form.status !== "Active",
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Create member error:", error);

      setServerError(error.message || "Failed to create member.");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  // While checking access, don't render the form.
  if (!ready) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm font-medium text-body">
          <Loader2 size={18} className="animate-spin text-primary" />
          Checking access...
        </div>
      </div>
    );
  }

  // Unauthorized people are redirected (see above): show nothing meanwhile.
  if (!canManage) {
    return null;
  }

  /* Result screen after a member is created. */
  if (result) {
    const sent = result.invitationSent;
    const failed = result.invitationRequested && !result.invitationSent;

    return (
      <div className="mx-auto max-w-2xl pb-10">
        <div
          role="status"
          className="rounded-3xl bg-white p-6 text-center shadow-card ring-1 ring-line sm:p-8"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 size={28} aria-hidden="true" />
          </span>

          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
            Member created
          </h1>

          <p className="mt-1 text-sm text-body">
            {result.name}
            {result.memberNumber && ` · ${result.memberNumber}`}
          </p>

          <div
            className={`mx-auto mt-6 max-w-md rounded-2xl px-4 py-3 text-left text-sm ring-1 ${
              sent
                ? "bg-success/10 text-success ring-success/30"
                : failed
                  ? "bg-accent/20 text-ink ring-accent/40"
                  : "bg-surface-muted text-body ring-line"
            }`}
          >
            <p className="flex items-start gap-2">
              {sent ? (
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
              ) : failed ? (
                <AlertTriangle
                  size={17}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <Info
                  size={17}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
              )}

              <span>
                {sent &&
                  `An invitation was emailed to ${result.email}. They can choose a password from the link, which works once and expires in 48 hours.`}

                {failed &&
                  "The member was created, but the invitation email could not be sent. Check the address, then resend it from Member Access."}

                {!sent &&
                  !failed &&
                  (result.inactive
                    ? "This member is inactive, so no invitation was sent."
                    : "No invitation was sent, so this person can't sign in yet. Send one any time from Member Access or the members list.")}
              </span>
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.97]"
            >
              Add another member
            </button>

            {result.memberId && (
              <Link
                href={`/dashboard/members/${result.memberId}`}
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97]"
              >
                View member
              </Link>
            )}

            {(failed || (!sent && !result.inactive)) && (
              <Link
                href="/dashboard/account-access"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97]"
              >
                Open Member Access
              </Link>
            )}

            <Link
              href="/dashboard/members"
              className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-body transition hover:bg-primary/10 hover:text-primary"
            >
              Back to members
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-10">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/dashboard/members"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-body transition hover:text-primary"
            >
              <ArrowLeft size={16} />
              Back to members
            </Link>

            <span className="mb-2 block h-0.5 w-5 rounded-full bg-accent" />

            <h1 className="font-display text-3xl font-semibold text-ink">
              Add Member
            </h1>

            <p className="mt-2 text-sm text-body">
              Add a new student to the fellowship. They choose their own
              password from an invitation email.
            </p>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/dashboard/members"
              className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check size={17} />
                  Create member
                </>
              )}
            </button>
          </div>
        </div>

        {serverError && (
          <div
            role="alert"
            className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {serverError}
          </div>
        )}

        {Object.keys(errors).some((key) => errors[key]) && (
          <div
            role="alert"
            className="rounded-2xl bg-accent/20 px-4 py-3 text-sm text-ink ring-1 ring-accent/40"
          >
            Please fix the highlighted fields below.
          </div>
        )}

        <MemberProfileImage preview={preview} onChange={handleProfileImage} />

        <MemberPersonalInfo
          form={form}
          errors={errors}
          onChange={handleChange}
        />

        <MemberContactInfo
          form={form}
          errors={errors}
          onChange={handleChange}
        />

        <MemberFellowshipInfo
          mode="create"
          form={form}
          errors={errors}
          onChange={handleChange}
          campuses={campuses}
          departments={departments}
          departmentsLoading={departmentsLoading}
        />

        <MemberEmergencyInfo
          form={form}
          errors={errors}
          onChange={handleChange}
        />

        <MemberHomeInfo
          form={form}
          errors={errors}
          onChange={handleChange}
        />

        <MemberSpiritualInfo
          form={form}
          errors={errors}
          onChange={handleChange}
        />

        <MemberAccountSettings
          form={form}
          errors={errors}
          onChange={handleChange}
          roleOptions={roleOptions}
          roleHelp={roleHelp}
        />

        <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-line lg:hidden">
          <div className="flex gap-3">
            <Link
              href="/dashboard/members"
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-white text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.97] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Check size={17} />
              )}

              {saving ? "Creating..." : "Create member"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}