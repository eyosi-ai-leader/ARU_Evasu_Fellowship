"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { createSmallGroup, updateSmallGroup } from "@/lib/smallGroupApi";
import {
  ModalShell,
  inputClass,
  primaryButton,
  secondaryButton,
  shortCampusName,
} from "./parts";

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

/*
 * Create a small group (managers choose the campus) or edit one.
 * Everything below the name is optional.
 */
export default function SmallGroupFormModal({
  mode = "create",
  group = null,
  campuses = [],
  onClose,
  onSaved,
}) {
  const editing = mode === "edit";

  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [purpose, setPurpose] = useState(group?.purpose || "");
  const [meetingSchedule, setMeetingSchedule] = useState(
    group?.meetingSchedule || ""
  );
  const [meetingPlace, setMeetingPlace] = useState(group?.meetingPlace || "");
  const [capacity, setCapacity] = useState(
    group?.capacity ? String(group.capacity) : ""
  );
  const [fellowshipId, setFellowshipId] = useState(
    !editing && campuses.length === 1 ? String(campuses[0].id) : ""
  );
  const [status, setStatus] = useState(group?.status || "Active");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    if (!name.trim()) {
      setError("Please give the small group a name.");
      return;
    }

    if (!editing && !fellowshipId) {
      setError("Please choose the campus.");
      return;
    }

    if (capacity && !/^\d+$/.test(capacity)) {
      setError("Capacity must be a whole number.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const body = {
        name: name.trim(),
        description: description.trim(),
        purpose: purpose.trim(),
        meetingSchedule: meetingSchedule.trim(),
        meetingPlace: meetingPlace.trim(),
        capacity: capacity ? Number(capacity) : "",
      };

      if (editing) {
        await updateSmallGroup(group.id, { ...body, status });
      } else {
        await createSmallGroup({ ...body, fellowshipId: Number(fellowshipId) });
      }

      await onSaved?.();
    } catch (err) {
      setError(err.message || "We couldn't save the small group.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={editing ? "Edit small group" : "New small group"}
      subtitle={
        editing
          ? group?.name
          : "A small group is usually one department. Its overseers look after the families in it."
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
            form="small-group-form"
            disabled={saving}
            className={primaryButton}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {editing ? "Save changes" : "Create small group"}
          </button>
        </>
      }
    >
      <form
        id="small-group-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        {!editing && (
          <div>
            <Label htmlFor="sg-campus">Campus</Label>

            <select
              id="sg-campus"
              value={fellowshipId}
              onChange={(event) => setFellowshipId(event.target.value)}
              className={inputClass}
            >
              <option value="">Select campus</option>

              {campuses.map((campus) => (
                <option key={campus.id} value={String(campus.id)}>
                  {shortCampusName(campus.name)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <Label htmlFor="sg-name">Name</Label>

          <input
            id="sg-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            placeholder="e.g. Computer Science"
            className={inputClass}
          />
        </div>

        <div>
          <Label htmlFor="sg-purpose">Purpose (optional)</Label>

          <input
            id="sg-purpose"
            type="text"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            maxLength={255}
            placeholder="e.g. Care and discipleship for Computer Science students"
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="sg-schedule">Meets (optional)</Label>

            <input
              id="sg-schedule"
              type="text"
              value={meetingSchedule}
              onChange={(event) => setMeetingSchedule(event.target.value)}
              maxLength={150}
              placeholder="e.g. Saturdays at 7:00 PM"
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="sg-place">Place (optional)</Label>

            <input
              id="sg-place"
              type="text"
              value={meetingPlace}
              onChange={(event) => setMeetingPlace(event.target.value)}
              maxLength={150}
              placeholder="e.g. lounge"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="sg-capacity">Capacity (optional)</Label>

          <input
            id="sg-capacity"
            type="text"
            inputMode="numeric"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            placeholder="e.g. 12"
            className={inputClass}
          />

          <p className="mt-1.5 text-xs text-slate-400">
            A guide only. You are told when the group is full, but nobody is
            blocked from joining.
          </p>
        </div>

        <div>
          <Label htmlFor="sg-description">Notes (optional)</Label>

          <textarea
            id="sg-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={1000}
            className={areaClass}
          />
        </div>

        {editing && (
          <div>
            <Label htmlFor="sg-status">Status</Label>

            <select
              id="sg-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={inputClass}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}

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