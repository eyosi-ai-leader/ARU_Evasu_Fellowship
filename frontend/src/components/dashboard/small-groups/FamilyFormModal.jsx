"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { createFamily, updateFamily } from "@/lib/smallGroupApi";
import {
  ModalShell,
  inputClass,
  primaryButton,
  secondaryButton,
} from "./parts";

export default function FamilyFormModal({
  mode = "create",
  groupId,
  family = null,
  onClose,
  onSaved,
}) {
  const editing = mode === "edit";

  const [name, setName] = useState(family?.name || "");
  const [description, setDescription] = useState(family?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    if (!name.trim()) {
      setError("Please give the family a name.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const body = { name: name.trim(), description: description.trim() };

      if (editing) {
        await updateFamily(family.id, body);
      } else {
        await createFamily(groupId, body);
      }

      await onSaved?.();
    } catch (err) {
      setError(err.message || "We couldn't save the family.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={editing ? "Edit family" : "New family"}
      subtitle={
        editing
          ? family?.name
          : "A family has a father and/or mother and the members they look after."
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
            form="family-form"
            disabled={saving}
            className={primaryButton}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {editing ? "Save changes" : "Create family"}
          </button>
        </>
      }
    >
      <form id="family-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="family-name"
            className="mb-2 block text-xs font-semibold text-slate-700"
          >
            Family name
          </label>

          <input
            id="family-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            placeholder="e.g. Family A"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="family-description"
            className="mb-2 block text-xs font-semibold text-slate-700"
          >
            Note (optional)
          </label>

          <textarea
            id="family-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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