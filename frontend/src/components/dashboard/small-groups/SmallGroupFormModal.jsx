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

/*
 * Create a small group (managers choose the campus) or edit one.
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

    try {
      setSaving(true);
      setError("");

      if (editing) {
        await updateSmallGroup(group.id, {
          name: name.trim(),
          description: description.trim(),
          status,
        });
      } else {
        await createSmallGroup({
          fellowshipId: Number(fellowshipId),
          name: name.trim(),
          description: description.trim(),
        });
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
            <label
              htmlFor="sg-campus"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Campus
            </label>

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
          <label
            htmlFor="sg-name"
            className="mb-2 block text-xs font-semibold text-slate-700"
          >
            Name
          </label>

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
          <label
            htmlFor="sg-description"
            className="mb-2 block text-xs font-semibold text-slate-700"
          >
            Description (optional)
          </label>

          <textarea
            id="sg-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        {editing && (
          <div>
            <label
              htmlFor="sg-status"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Status
            </label>

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