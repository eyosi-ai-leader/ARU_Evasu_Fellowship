"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Lock, MapPin, Phone, Trash2, UserRound } from "lucide-react";

import UserAvatar from "@/components/shared/Avatar/UserAvatar";
import useConfirm from "@/components/dashboard/ministries/useConfirm";
import CampusBadge from "@/components/dashboard/access/CampusBadge";
import { inputClass } from "@/components/dashboard/small-groups/parts";
import { updateMyProfile } from "@/lib/profileApi";
import { updateStoredUser } from "@/lib/userStorage";
import { formatDate } from "./profileFormat";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHONE_PATTERN = /^[0-9+\-\s()]{6,20}$/;

const toForm = (profile) => ({
  firstName: profile.firstName || "",
  middleName: profile.middleName || "",
  lastName: profile.lastName || "",
  gender: profile.gender || "",
  dateOfBirth: profile.dateOfBirth || "",
  phone: profile.phone || "",
  address: profile.address || "",
});

const errorClass = "border-red-300 focus:border-red-400 focus:ring-red-100";

function Field({ id, label, required, hint, error, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      {children}

      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function Card({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        </span>

        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function Locked({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-700">
        {children || <span className="font-normal text-slate-400">Not set</span>}
      </dd>
    </div>
  );
}

export default function ProfileForm({ profile, campusName, onSaved, onCancel }) {
  const { confirm, confirmDialog } = useConfirm();

  const [form, setForm] = useState(toForm(profile));
  const [errors, setErrors] = useState({});
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

  const fieldClass = (name) =>
    `${inputClass} ${errors[name] ? errorClass : ""}`;

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
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

  function validate() {
    const next = {};

    if (form.firstName.trim().length < 2) {
      next.firstName = "Enter at least 2 characters.";
    }

    if (form.lastName.trim().length < 2) {
      next.lastName = "Enter at least 2 characters.";
    }

    if (form.dateOfBirth && form.dateOfBirth > today) {
      next.dateOfBirth = "The date of birth can't be in the future.";
    }

    if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) {
      next.phone = "Enter a valid phone number (6 to 20 digits).";
    }

    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || !dirty) return;

    setError("");

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
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
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-6">
          {/* Photo */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <UserAvatar user={avatarUser} className="h-24 w-24 text-2xl" />

              <div className="text-center sm:text-left">
                <p className="text-sm font-semibold text-slate-900">
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
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  >
                    <Camera size={16} aria-hidden="true" />
                    {hasPhoto ? "Change photo" : "Upload photo"}
                  </button>

                  {hasPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Remove
                    </button>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  JPG, PNG or WEBP, up to 10 MB.
                </p>
              </div>
            </div>
          </section>

          {/* Personal */}
          <Card icon={UserRound} title="Personal information">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                id="firstName"
                label="First name"
                required
                error={errors.firstName}
              >
                <input
                  ref={firstNameRef}
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  maxLength={100}
                  autoComplete="given-name"
                  aria-invalid={Boolean(errors.firstName)}
                  className={fieldClass("firstName")}
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

              <Field
                id="lastName"
                label="Last name"
                required
                error={errors.lastName}
              >
                <input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  maxLength={100}
                  autoComplete="family-name"
                  aria-invalid={Boolean(errors.lastName)}
                  className={fieldClass("lastName")}
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

              <Field
                id="dateOfBirth"
                label="Date of birth"
                error={errors.dateOfBirth}
              >
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  max={today}
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.dateOfBirth)}
                  className={fieldClass("dateOfBirth")}
                />
              </Field>
            </div>
          </Card>

          {/* Contact */}
          <Card icon={Phone} title="Contact information">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                id="phone"
                label="Phone number"
                error={errors.phone}
                hint="Your leaders use this to reach you."
              >
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={handleChange}
                  maxLength={20}
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  className={fieldClass("phone")}
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
                    className={inputClass}
                  />

                  <p className="mt-1.5 text-right text-xs text-slate-400">
                    {form.address.length} / 500
                  </p>
                </Field>
              </div>
            </div>
          </Card>
        </div>

        {/* Managed by the fellowship */}
        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6 lg:sticky lg:top-6">
          <div className="flex items-start gap-3">
            <Lock
              size={17}
              className="mt-0.5 shrink-0 text-slate-400"
              aria-hidden="true"
            />

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Managed by the fellowship
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Your leaders keep these up to date, so they can&apos;t be
                edited here.
              </p>
            </div>
          </div>

          <dl className="mt-5 space-y-4">
            <Locked label="Email">{profile.email}</Locked>
            <Locked label="Member number">{profile.memberNumber}</Locked>
            <Locked label="Role">{profile.roleName}</Locked>
            <Locked label="Campus">
              {campusName || <CampusBadge variant="inline" />}
            </Locked>
            <Locked label="Baptism date">
              {formatDate(profile.baptismDate)}
            </Locked>
          </dl>
        </aside>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className={`px-2 text-xs font-medium ${
            dirty ? "text-amber-600" : "text-slate-400"
          }`}
        >
          {dirty ? "You have unsaved changes." : "No changes yet."}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || !dirty}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {confirmDialog}
    </form>
  );
}