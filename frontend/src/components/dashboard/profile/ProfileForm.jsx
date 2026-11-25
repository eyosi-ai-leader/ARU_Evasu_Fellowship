"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  HeartPulse,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";

import UserAvatar from "@/components/shared/Avatar/UserAvatar";
import useConfirm from "@/components/dashboard/ministries/useConfirm";
import CampusBadge from "@/components/dashboard/access/CampusBadge";
import { inputClass } from "@/components/dashboard/small-groups/parts";
import {
  ETHIOPIA_REGIONS,
  OTHER_OPTION,
  getCities,
} from "@/lib/ethiopiaLocations";
import { updateMyProfile } from "@/lib/profileApi";
import { updateStoredUser } from "@/lib/userStorage";
import { formatDate } from "./profileFormat";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHONE_PATTERN = /^[0-9+\-\s()]{6,20}$/;
const EMERGENCY_PHONE_PATTERN = /^[0-9+\-\s()]{6,30}$/;
const TELEGRAM_PATTERN = /^@?[A-Za-z0-9_]{1,63}$/;

/*
 * The saved town is one text. The form shows it the way registration does:
 * a city of the region, or "Other" with the town typed in.
 */
const toForm = (profile) => {
  const region = profile.homeRegion || "";
  const town = profile.homeTown || "";
  const listed = region && town ? getCities(region).includes(town) : false;

  return {
    firstName: profile.firstName || "",
    middleName: profile.middleName || "",
    lastName: profile.lastName || "",
    gender: profile.gender || "",
    dateOfBirth: profile.dateOfBirth || "",
    phone: profile.phone || "",
    telegramUsername: profile.telegramUsername || "",
    homeRegion: region,
    homeCity: town && region ? (listed ? town : OTHER_OPTION) : "",
    homeTownOther: town && region && !listed ? town : "",
    address: profile.address || "",
    emergencyContactName: profile.emergencyContactName || "",
    emergencyContactPhone: profile.emergencyContactPhone || "",
    emergencyContactRelation: profile.emergencyContactRelation || "",
  };
};

const errorClass =
  "border-danger/50 focus:border-danger focus:ring-danger/10";

function Field({ id, label, required, hint, error, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-ink"
      >
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>

      {children}

      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-body">{hint}</p>
      )}
    </div>
  );
}

function Card({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        </span>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            {title}
          </h2>

          {description && <p className="text-sm text-body">{description}</p>}
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function Locked({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-body">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-ink">
        {children || <span className="font-normal text-body/60">Not set</span>}
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

  const cities = getCities(form.homeRegion);

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

    setForm((current) => {
      const next = { ...current, [name]: value };

      // A new region means a new city list.
      if (name === "homeRegion") {
        next.homeCity = "";
        next.homeTownOther = "";
      }

      return next;
    });

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

    if (
      form.telegramUsername.trim() &&
      !TELEGRAM_PATTERN.test(form.telegramUsername.trim())
    ) {
      next.telegramUsername = "Use letters, numbers and underscores only.";
    }

    if (form.homeCity === OTHER_OPTION && !form.homeTownOther.trim()) {
      next.homeTownOther = "Please write your city or town.";
    }

    if (
      form.emergencyContactPhone.trim() &&
      !EMERGENCY_PHONE_PATTERN.test(form.emergencyContactPhone.trim())
    ) {
      next.emergencyContactPhone = "Enter a valid phone number.";
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

    // The chosen city, or the one they typed (same as registration).
    const homeTown =
      form.homeCity === OTHER_OPTION
        ? form.homeTownOther.trim()
        : form.homeCity;

    const data = new FormData();

    const append = (key, value) =>
      data.append(key, String(value ?? "").trim());

    append("firstName", form.firstName);
    append("middleName", form.middleName);
    append("lastName", form.lastName);
    append("gender", form.gender);
    append("dateOfBirth", form.dateOfBirth);
    append("phone", form.phone);
    append("telegramUsername", form.telegramUsername);
    append("homeRegion", form.homeRegion);
    append("homeTown", homeTown);
    append("address", form.address);
    append("emergencyContactName", form.emergencyContactName);
    append("emergencyContactPhone", form.emergencyContactPhone);
    append("emergencyContactRelation", form.emergencyContactRelation);

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
          className="rounded-3xl border border-danger/30 bg-danger/10 px-5 py-3 text-sm font-medium text-danger"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-6">
          {/* Photo */}
          <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-7">
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <div className="shrink-0 rounded-full ring-4 ring-primary/10">
                <UserAvatar user={avatarUser} className="h-24 w-24 text-2xl" />
              </div>

              <div className="text-center sm:text-left">
                <p className="font-display text-lg font-semibold text-ink">
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
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Camera size={16} aria-hidden="true" />
                    {hasPhoto ? "Change photo" : "Upload photo"}
                  </button>

                  {hasPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-danger transition hover:bg-danger/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
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

              <Field
                id="telegramUsername"
                label="Telegram username"
                error={errors.telegramUsername}
              >
                <input
                  id="telegramUsername"
                  name="telegramUsername"
                  value={form.telegramUsername}
                  onChange={handleChange}
                  maxLength={64}
                  placeholder="@username"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.telegramUsername)}
                  className={fieldClass("telegramUsername")}
                />
              </Field>
            </div>
          </Card>

          {/* Where they are from */}
          <Card
            icon={MapPin}
            title="Where you are from"
            description="Where you or your family lived before coming to campus."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field id="homeRegion" label="Region">
                <select
                  id="homeRegion"
                  name="homeRegion"
                  value={form.homeRegion}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select region</option>

                  {ETHIOPIA_REGIONS.map((region) => (
                    <option key={region.name} value={region.name}>
                      {region.label ?? region.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="homeCity" label="City or town">
                <select
                  id="homeCity"
                  name="homeCity"
                  value={form.homeCity}
                  onChange={handleChange}
                  disabled={!form.homeRegion}
                  className={`${inputClass} disabled:bg-surface-muted disabled:text-body/60`}
                >
                  <option value="">
                    {form.homeRegion
                      ? "Select city or town"
                      : "Select region first"}
                  </option>

                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}

                  {form.homeRegion && (
                    <option value={OTHER_OPTION}>Other (write the town)</option>
                  )}
                </select>
              </Field>

              {form.homeCity === OTHER_OPTION && (
                <div className="md:col-span-2">
                  <Field
                    id="homeTownOther"
                    label="City or town"
                    required
                    error={errors.homeTownOther}
                  >
                    <input
                      id="homeTownOther"
                      name="homeTownOther"
                      value={form.homeTownOther}
                      onChange={handleChange}
                      maxLength={100}
                      placeholder="Type the name of the town"
                      aria-invalid={Boolean(errors.homeTownOther)}
                      className={fieldClass("homeTownOther")}
                    />
                  </Field>
                </div>
              )}

              <div className="md:col-span-2">
                <Field id="address" label="Specific place or area">
                  <input
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    maxLength={255}
                    placeholder="e.g. woreda, kebele, village or neighborhood"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </Card>

          {/* Emergency contact */}
          <Card
            icon={HeartPulse}
            title="Emergency contact"
            description="Someone your leaders can call if they cannot reach you."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field id="emergencyContactName" label="Full name">
                <input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={form.emergencyContactName}
                  onChange={handleChange}
                  maxLength={150}
                  autoComplete="off"
                  className={inputClass}
                />
              </Field>

              <Field
                id="emergencyContactPhone"
                label="Phone number"
                error={errors.emergencyContactPhone}
              >
                <input
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  type="tel"
                  inputMode="tel"
                  value={form.emergencyContactPhone}
                  onChange={handleChange}
                  maxLength={30}
                  autoComplete="off"
                  aria-invalid={Boolean(errors.emergencyContactPhone)}
                  className={fieldClass("emergencyContactPhone")}
                />
              </Field>

              <Field id="emergencyContactRelation" label="Relation">
                <input
                  id="emergencyContactRelation"
                  name="emergencyContactRelation"
                  value={form.emergencyContactRelation}
                  onChange={handleChange}
                  maxLength={50}
                  placeholder="Parent, brother, friend..."
                  autoComplete="off"
                  className={inputClass}
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* Managed by the fellowship */}
        <aside className="rounded-3xl bg-surface-warm/60 p-6 ring-1 ring-line lg:sticky lg:top-24">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
              <Lock size={17} aria-hidden="true" />
            </span>

            <div>
              <h2 className="font-display text-base font-semibold text-ink">
                Managed by the fellowship
              </h2>

              <p className="mt-1 text-xs leading-5 text-body">
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
      <div className="sticky bottom-24 z-10 flex flex-col-reverse gap-3 rounded-3xl bg-white/95 p-3 shadow-soft ring-1 ring-line backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between lg:bottom-4">
        <p
          aria-live="polite"
          className={`flex items-center gap-2 px-3 text-xs font-semibold ${
            dirty ? "text-ember" : "text-body"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${
              dirty ? "bg-accent" : "bg-body/40"
            }`}
          />
          {dirty ? "You have unsaved changes." : "No changes yet."}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="h-11 flex-1 rounded-full bg-white px-6 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || !dirty}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
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