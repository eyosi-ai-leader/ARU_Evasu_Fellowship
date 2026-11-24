"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Info, Loader2, Trash2 } from "lucide-react";
import UserAvatar from "@/components/shared/Avatar/UserAvatar";
import useConfirm from "@/components/dashboard/ministries/useConfirm";
import { updateMyProfile } from "@/lib/profileApi";
import { updateStoredUser } from "@/lib/userStorage";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const inputClass =
  "w-full rounded-full border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-4 focus:ring-primary/10";

const textareaClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-4 focus:ring-primary/10";

const toForm = (profile) => ({
  firstName: profile.firstName || "",
  middleName: profile.middleName || "",
  lastName: profile.lastName || "",
  gender: profile.gender || "",
  dateOfBirth: profile.dateOfBirth || "",
  phone: profile.phone || "",
  address: profile.address || "",
});

function Field({ id, label, required, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-ink"
      >
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function ProfileForm({ profile, onSaved, onCancel }) {
  const { confirm, confirmDialog } = useConfirm();

  const [form, setForm] = useState(toForm(profile));
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fileRef = useRef(null);
  const firstNameRef = useRef(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const dirty = useMemo(
    () =>
      JSON.stringify(form) !== JSON.stringify(toForm(profile)) ||
      Boolean(photo) ||
      removePhoto,
    [form, profile, photo, removePhoto]
  );

  const avatarUser = {
    firstName: form.firstName,
    lastName: form.lastName,
    profileImage: preview || (removePhoto ? null : profile.profileImage),
  };

  const hasPhoto = Boolean(preview || (!removePhoto && profile.profileImage));

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  function handlePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Profile image must not exceed 10 MB.");
      return;
    }

    setError("");
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
  }

  function handleRemovePhoto() {
    setPhoto(null);
    setPreview(null);
    setRemovePhoto(Boolean(profile.profileImage));
  }

  async function handleCancel() {
    if (saving) return;

    if (dirty) {
      const discard = await confirm({
        title: "Discard your changes?",
        message: "The changes you made to your profile will be lost.",
        confirmLabel: "Discard",
        cancelLabel: "Keep editing",
        tone: "warning",
      });

      if (!discard) return;
    }

    onCancel();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving || !dirty) return;

    setError("");

    if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2) {
      setError("First and last name must be at least 2 characters.");
      return;
    }

    if (form.dateOfBirth && form.dateOfBirth > today) {
      setError("Date of birth cannot be in the future.");
      return;
    }

    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      data.append(key, value.trim());
    });

    if (photo) data.append("profileImage", photo);
    if (removePhoto) data.append("removeProfileImage", "true");

    setSaving(true);

    try {
      const updated = await updateMyProfile(data);

      updateStoredUser({
        firstName: updated.firstName,
        middleName: updated.middleName,
        lastName: updated.lastName,
        profileImage: updated.profileImage,
      });

      onSaved(updated);
    } catch (err) {
      setError(err.message || "We couldn't save your changes.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </div>
      )}

      {/* Photo */}
      <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <UserAvatar user={avatarUser} className="h-24 w-24 text-2xl" />

          <div className="text-center sm:text-left">
            <p className="font-display text-base font-semibold text-ink">
              Profile photo
            </p>

            <div className="mt-3 flex flex-wrap justify-center gap-3 sm:justify-start">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhoto}
                className="sr-only"
                id="profile-photo"
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <Camera size={16} aria-hidden="true" />
                {hasPhoto ? "Change photo" : "Upload photo"}
              </button>

              {hasPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-danger transition hover:bg-danger/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-danger/20"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>

            <p className="mt-2 text-xs text-body">
              JPG, PNG or WEBP, up to 10 MB.
            </p>
          </div>
        </div>
      </section>

      {/* Personal */}
      <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line">
        <h2 className="font-display text-lg font-semibold text-ink">
          Personal information
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field id="firstName" label="First name" required>
            <input
              ref={firstNameRef}
              id="firstName"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              maxLength={100}
              autoComplete="given-name"
              className={inputClass}
            />
          </Field>

          <Field id="middleName" label="Middle name">
            <input
              id="middleName"
              name="middleName"
              value={form.middleName}
              onChange={handleChange}
              maxLength={100}
              autoComplete="additional-name"
              className={inputClass}
            />
          </Field>

          <Field id="lastName" label="Last name" required>
            <input
              id="lastName"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              maxLength={100}
              autoComplete="family-name"
              className={inputClass}
            />
          </Field>

          <Field id="gender" label="Gender">
            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Prefer not to say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </Field>

          <Field id="dateOfBirth" label="Date of birth">
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              max={today}
              value={form.dateOfBirth}
              onChange={handleChange}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line">
        <h2 className="font-display text-lg font-semibold text-ink">
          Contact information
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field id="phone" label="Phone number">
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              maxLength={30}
              autoComplete="tel"
              className={inputClass}
            />
          </Field>

          <div className="md:col-span-2">
            <Field id="address" label="Address">
              <textarea
                id="address"
                name="address"
                rows={3}
                value={form.address}
                onChange={handleChange}
                maxLength={500}
                className={textareaClass}
              />
            </Field>
          </div>
        </div>
      </section>

      <p className="flex items-start gap-2 text-sm leading-6 text-body">
        <Info
          size={16}
          className="mt-1 shrink-0 text-primary"
          aria-hidden="true"
        />
        Your email, role, member number and baptism date are managed by the
        fellowship office, so they can&apos;t be edited here.
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving || !dirty}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      {confirmDialog}
    </form>
  );
}