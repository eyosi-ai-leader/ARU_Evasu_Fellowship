"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, Loader2, Trash2 } from "lucide-react";

import {
  ModalShell,
  inputClass,
  primaryButton,
  secondaryButton,
} from "@/components/dashboard/small-groups/parts";

import { campusLabel, optimizedImage } from "./ministryUtils";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const areaClass =
  "w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

function Label({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-xs font-semibold text-slate-700"
    >
      {children}
    </label>
  );
}

function Group({ title, hint, children }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
      <legend className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </legend>

      {hint && <p className="-mt-2 text-xs text-slate-400">{hint}</p>}

      {children}
    </fieldset>
  );
}

const PHONE_PATTERN = /^[0-9+\-\s()]{6,30}$/;

/*
 * Create or edit a ministry. Only the name (and the campus when creating)
 * is required. Everything else is optional.
 *
 * ministry: a normalized ministry (see ministryUtils)
 * onSubmit(data) may throw: the message is shown here.
 */
export default function MinistryFormModal({
  mode = "create",
  ministry = null,
  campuses = [],
  onClose,
  onSubmit,
}) {
  const editing = mode === "edit";

  const [fellowshipId, setFellowshipId] = useState(
    !editing && campuses.length === 1 ? String(campuses[0].id) : ""
  );
  const [name, setName] = useState(ministry?.name || "");
  const [purpose, setPurpose] = useState(ministry?.purpose || "");
  const [verseReference, setVerseReference] = useState(
    ministry?.verseReference || ""
  );
  const [verseText, setVerseText] = useState(ministry?.verseText || "");
  const [meetingSchedule, setMeetingSchedule] = useState(
    ministry?.meetingSchedule || ""
  );
  const [meetingPlace, setMeetingPlace] = useState(ministry?.meetingPlace || "");
  const [contactPhone, setContactPhone] = useState(ministry?.contactPhone || "");
  const [description, setDescription] = useState(ministry?.description || "");

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const fileRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const currentImage = removeImage ? "" : ministry?.imageUrl || "";
  const shownImage = preview || optimizedImage(currentImage, 900);

  function handleImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("The cover image must not exceed 10 MB.");
      return;
    }

    setError("");
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setRemoveImage(false);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setPreview("");
    setRemoveImage(Boolean(ministry?.imageUrl));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    if (!name.trim()) {
      setError("Please give the ministry a name.");
      return;
    }

    if (!editing && !fellowshipId) {
      setError("Please choose the campus.");
      return;
    }

    if (contactPhone.trim() && !PHONE_PATTERN.test(contactPhone.trim())) {
      setError("Please enter a valid contact phone number.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data = {
        name: name.trim(),
        purpose: purpose.trim(),
        verseReference: verseReference.trim(),
        verseText: verseText.trim(),
        meetingSchedule: meetingSchedule.trim(),
        meetingPlace: meetingPlace.trim(),
        contactPhone: contactPhone.trim(),
        description: description.trim(),
      };

      if (!editing) data.fellowshipId = Number(fellowshipId);
      if (imageFile) data.imageFile = imageFile;
      if (removeImage) data.removeImage = true;

      await onSubmit(data);
    } catch (err) {
      setError(err.message || "We couldn't save the ministry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={editing ? "Edit ministry" : "New ministry"}
      subtitle={
        editing
          ? ministry?.name
          : "A ministry is a team that serves together. Only the name is required."
      }
      onClose={onClose}
      busy={saving}
      wide
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={secondaryButton}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="ministry-form"
            disabled={saving}
            className={primaryButton}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {editing ? "Save changes" : "Create ministry"}
          </button>
        </>
      }
    >
      <form
        id="ministry-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5"
      >
        <Group
          title="Cover image"
          hint="Shown behind the ministry name. Optional."
        >
          <div className="relative h-36 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white">
            {shownImage ? (
              <img
                src={shownImage}
                alt="Ministry cover preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <ImagePlus size={28} aria-hidden="true" />
                <p className="mt-2 text-xs">JPG, PNG or WEBP, up to 10 MB</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImage}
              className="sr-only"
              id="ministry-cover"
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={saving}
              className={secondaryButton}
            >
              <Camera size={14} aria-hidden="true" />
              {shownImage ? "Change image" : "Upload image"}
            </button>

            {shownImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={saving}
                className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 sm:h-10"
              >
                <Trash2 size={14} aria-hidden="true" />
                Remove
              </button>
            )}
          </div>
        </Group>

        <Group title="The ministry">
          {!editing && (
            <div>
              <Label htmlFor="ministry-campus">Campus</Label>

              <select
                id="ministry-campus"
                value={fellowshipId}
                onChange={(event) => setFellowshipId(event.target.value)}
                className={inputClass}
              >
                <option value="">Select campus</option>

                {campuses.map((campus) => (
                  <option key={campus.id} value={String(campus.id)}>
                    {campusLabel(campus)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="ministry-name">Name</Label>

            <input
              id="ministry-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              autoFocus
              placeholder="e.g. Worship Team"
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="ministry-purpose">Purpose (optional)</Label>

            <input
              id="ministry-purpose"
              type="text"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              maxLength={255}
              placeholder="e.g. Lead the fellowship into God's presence through song"
              className={inputClass}
            />
          </div>
        </Group>

        <Group
          title="Scripture"
          hint="A verse that guides this ministry. Optional."
        >
          <div>
            <Label htmlFor="ministry-verse-ref">Reference</Label>

            <input
              id="ministry-verse-ref"
              type="text"
              value={verseReference}
              onChange={(event) => setVerseReference(event.target.value)}
              maxLength={100}
              placeholder="e.g. Psalm 100:1-2"
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="ministry-verse-text">Verse text</Label>

            <textarea
              id="ministry-verse-text"
              value={verseText}
              onChange={(event) => setVerseText(event.target.value)}
              rows={3}
              maxLength={600}
              placeholder="Type the verse as it is in your Bible."
              className={areaClass}
            />

            <p className="mt-1.5 text-xs text-slate-400">
              {verseText.length}/600
            </p>
          </div>
        </Group>

        <Group title="Meeting and contact" hint="All optional.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ministry-schedule">Meets</Label>

              <input
                id="ministry-schedule"
                type="text"
                value={meetingSchedule}
                onChange={(event) => setMeetingSchedule(event.target.value)}
                maxLength={150}
                placeholder="e.g. Thursdays at 6:30 PM"
                className={inputClass}
              />
            </div>

            <div>
              <Label htmlFor="ministry-place">Place</Label>

              <input
                id="ministry-place"
                type="text"
                value={meetingPlace}
                onChange={(event) => setMeetingPlace(event.target.value)}
                maxLength={150}
                placeholder="e.g. Main hall"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ministry-phone">Contact phone</Label>

            <input
              id="ministry-phone"
              type="tel"
              inputMode="tel"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              maxLength={30}
              placeholder="0911 000 000"
              className={inputClass}
            />
          </div>
        </Group>

        <div>
          <Label htmlFor="ministry-notes">Notes (optional)</Label>

          <textarea
            id="ministry-notes"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Anything else leaders and members should know."
            className={areaClass}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
          >
            {error}
          </div>
        )}
      </form>
    </ModalShell>
  );
}
