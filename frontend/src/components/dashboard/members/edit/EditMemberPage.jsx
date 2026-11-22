"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Lock, Save } from "lucide-react";

import {
  changeMemberRole,
  getMemberById,
  updateMember,
} from "@/lib/memberApi";
import { inviteMember } from "@/lib/memberAccessApi";
import { getDepartments } from "@/lib/fellowshipApi";
import useMyAccess from "@/lib/useMyAccess";
import { canManageMembers, getRoleName, isPrivilegedRole } from "@/lib/roles";
import {
  buildMemberFormData,
  emptyMemberForm,
  memberToForm,
  validateMemberForm,
} from "@/lib/memberForm";

import ChangeRoleModal from "@/components/dashboard/members/ChangeRoleModal";
import MemberPhotoEditor from "@/components/dashboard/members/edit/MemberPhotoEditor";
import AccountInformationForm from "@/components/dashboard/members/edit/AccountInformationForm";
import MemberPersonalInfo from "@/components/dashboard/members/create/MemberPersonalInfo";
import MemberContactInfo from "@/components/dashboard/members/create/MemberContactInfo";
import MemberFellowshipInfo from "@/components/dashboard/members/create/MemberFellowshipInfo";
import MemberHomeInfo from "@/components/dashboard/members/create/MemberHomeInfo";
import MemberEmergencyInfo from "@/components/dashboard/members/create/MemberEmergencyInfo";
import MemberSpiritualInfo from "@/components/dashboard/members/create/MemberSpiritualInfo";
import MemberAccountSettings from "@/components/dashboard/members/create/MemberAccountSettings";
import { Section } from "@/components/dashboard/members/create/FormParts";

const getMemberData = (result) => result?.data || result;

export default function EditMemberPage() {
  const params = useParams();
  const router = useRouter();

  const memberId = params?.id;

  const { access, loading: accessLoading } = useMyAccess();

  // Saved at sign-in: only used if /api/me cannot be loaded.
  const [storedUser, setStoredUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const [member, setMember] = useState(null);
  const [form, setForm] = useState(emptyMemberForm);
  const [initialJson, setInitialJson] = useState("");
  const [errors, setErrors] = useState({});

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);

  const [roleOpen, setRoleOpen] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [roleError, setRoleError] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");

      if (raw) {
        setStoredUser(JSON.parse(raw));
      }
    } catch (err) {
      console.error("Failed to load current user:", err);
    } finally {
      setUserLoaded(true);
    }
  }, []);

  const ready = userLoaded && !accessLoading;

  const capabilities = access?.capabilities || null;

  const canManage = capabilities
    ? capabilities.includes("fellowship:manage")
    : canManageMembers(storedUser?.roleId);

  const isSuperAdmin = access
    ? Boolean(access.isSuperAdmin)
    : Number(storedUser?.roleId) === 1;

  const currentUserId = access?.user?.id ?? storedUser?.id ?? null;

  // Only people who manage members may open this page.
  useEffect(() => {
    if (ready && !canManage) {
      router.replace("/dashboard/members");
    }
  }, [ready, canManage, router]);

  // Release a temporary photo preview when it changes or the page closes.
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Load the member.
  useEffect(() => {
    if (!memberId || !ready || !canManage) {
      return;
    }

    let cancelled = false;

    async function loadMember() {
      try {
        setLoading(true);
        setError("");

        const data = getMemberData(await getMemberById(memberId));

        if (cancelled) return;

        const values = memberToForm(data);

        setMember(data);
        setForm(values);
        setInitialJson(JSON.stringify(values));
        setImagePreview(data.profile_image || data.profileImage || "");
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load member information.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMember();

    return () => {
      cancelled = true;
    };
  }, [memberId, ready, canManage]);

  // The departments of the member's own campus (Staff have none).
  useEffect(() => {
    if (!member?.fellowship_id) {
      setDepartments([]);
      return undefined;
    }

    let cancelled = false;

    setDepartmentsLoading(true);

    getDepartments(member.fellowship_id)
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
  }, [member?.fellowship_id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "academicStatus" ? { entryYear: "" } : {}),
      ...(name === "homeRegion" ? { homeCity: "", homeTownOther: "" } : {}),
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setError("");
    setSuccess("");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Profile image must be smaller than 10MB.");
      event.target.value = "";
      return;
    }

    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
    setSuccess("");
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview("");
    setError("");
    setSuccess("");

    const input = document.getElementById("profileImage");

    if (input) {
      input.value = "";
    }
  };

  // A person with no campus (for example Staff) has no student details.
  const hasCampus = Boolean(member?.fellowship_id);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationErrors = validateMemberForm(form, {
      mode: "edit",
      student: hasCampus,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = buildMemberFormData(form, { mode: "edit" });

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      formData.append("removeProfileImage", imagePreview ? "false" : "true");

      await updateMember(memberId, formData);

      setProfileImage(null);
      setSuccess("Member information updated successfully.");

      setTimeout(() => {
        router.push(`/dashboard/members/${memberId}`);
      }, 900);
    } catch (err) {
      setError(err.message || "Failed to update member.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  async function handleInvite() {
    if (inviting || !member) {
      return;
    }

    try {
      setInviting(true);
      setError("");
      setSuccess("");

      await inviteMember(member.id);

      setSuccess(`An invitation email was sent to ${member.email}.`);

      setMember(getMemberData(await getMemberById(memberId)));
    } catch (err) {
      setError(err.message || "Failed to send the invitation.");
    } finally {
      setInviting(false);
    }
  }

  /*
   * Change the role with the same dialog as the members list. The campus is
   * chosen there too. Afterwards the member is loaded again, because a role
   * change can change the campus (for example Staff have none).
   */
  async function handleRoleConfirm(target, payload) {
    try {
      setChangingRole(true);
      setRoleError("");

      await changeMemberRole(target.id, payload);

      const fresh = getMemberData(await getMemberById(memberId));
      const values = memberToForm(fresh);

      setMember(fresh);
      setForm(values);
      setInitialJson(JSON.stringify(values));
      setRoleOpen(false);
      setSuccess("The role was updated.");
    } catch (err) {
      // The dialog stays open so the choice can be fixed.
      setRoleError(err.message || "Failed to change the role.");
    } finally {
      setChangingRole(false);
    }
  }

  if (!ready || (canManage && loading)) {
    return <LoadingState />;
  }

  // Redirected (see above): show nothing meanwhile.
  if (!canManage) {
    return null;
  }

  if (error && !member) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="text-sm font-bold text-red-800">
          Unable to load member
        </h2>

        <p className="mt-2 text-sm text-red-600">{error}</p>

        <Link
          href="/dashboard/members"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          Back to Members
        </Link>
      </div>
    );
  }

  // Super Admin, Fellowship Admin and Staff accounts: only a Super Admin edits them.
  if (isPrivilegedRole(member?.role_id) && !isSuperAdmin) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <Lock className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />

        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          Protected account
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Only a Super Admin can edit Super Admin, Fellowship Admin and Staff
          accounts.
        </p>

        <Link
          href={`/dashboard/members/${memberId}`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          Back to member
        </Link>
      </div>
    );
  }

  const isSelf =
    currentUserId !== null &&
    currentUserId !== undefined &&
    Number(member?.user_id) === Number(currentUserId);

  const emailChanged =
    form.email.trim().toLowerCase() !==
    String(member?.email || "").trim().toLowerCase();

  // Unsaved edits would be lost when the member is loaded again.
  const originalImage = member?.profile_image || member?.profileImage || "";

  const dirty =
    JSON.stringify(form) !== initialJson ||
    Boolean(profileImage) ||
    imagePreview !== originalImage;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href={`/dashboard/members/${memberId}`}
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          title="Back to member"
        >
          <ArrowLeft size={17} />
        </Link>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Edit Member
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Update member information and account settings.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {Object.keys(errors).some((key) => errors[key]) && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          Please fix the highlighted fields below.
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          <Check size={16} />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <MemberPhotoEditor
          form={form}
          profileImage={profileImage}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
          onRemoveImage={handleRemoveImage}
        />

        <MemberPersonalInfo
          form={form}
          errors={errors}
          onChange={handleChange}
          genderRequired={false}
        />

        <MemberContactInfo
          form={form}
          errors={errors}
          onChange={handleChange}
        />

        {hasCampus ? (
          <MemberFellowshipInfo
            mode="edit"
            form={form}
            errors={errors}
            onChange={handleChange}
            campusName={member?.fellowship_name || ""}
                       smallGroup={member?.small_group_names || ""}
            family={member?.family_names || ""}
            departments={departments}
            departmentsLoading={departmentsLoading}
          />
        ) : (
          <Section
            title="Campus & Student Information"
            description="This person belongs to no campus."
          >
            <p className="text-sm leading-6 text-slate-500">
              They have no campus, small group or student details (for example
              a Staff member, who serves full time and is not a student). To
              place them in a campus, use <strong>Change role</strong> below
              and choose Member, Main Leader or Fellowship Admin.
            </p>
          </Section>
        )}

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
          roleOptions={[
            {
              value: String(member?.role_id ?? ""),
              label: getRoleName(member?.role_id),
            },
          ]}
          roleLocked
          roleLockedReason={
            isSelf
              ? "You can't change your own role."
              : "Use Change role to change the role. The campus is chosen there too."
          }
          onChangeRole={
            isSelf
              ? null
              : () => {
                  setRoleError("");
                  setRoleOpen(true);
                }
          }
          changeRoleDisabled={dirty}
          changeRoleHint={
            dirty ? "Save your changes first, then change the role." : ""
          }
          memberNumber={member?.member_number || ""}
          showInvitation={false}
        />

        <AccountInformationForm
          member={member}
          canInvite
          emailChanged={emailChanged}
          inviting={inviting}
          onInvite={handleInvite}
        />

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <Link
            href={`/dashboard/members/${memberId}`}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:h-10"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      <ChangeRoleModal
        member={member}
        open={roleOpen}
        saving={changingRole}
        error={roleError}
        onClose={() => setRoleOpen(false)}
        onConfirm={handleRoleConfirm}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />

        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-64 animate-pulse rounded bg-slate-100" />
        </div>
      </div>

      <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}