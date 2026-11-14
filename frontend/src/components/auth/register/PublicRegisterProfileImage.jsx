"use client";

import { useEffect, useState } from "react";
import { Camera, Trash2, User } from "lucide-react";

import { FieldError, SectionCard } from "./RegisterFields";

export default function PublicRegisterProfileImage({
  value,
  onChange,
  error,
}) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(value);

    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [value]);

  return (
    <SectionCard
      icon={Camera}
      title="Profile photo"
      description="Optional. It helps leaders and friends recognise you."
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-4 ring-indigo-100">
          {preview ? (
            <img
              src={preview}
              alt="Profile preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <User
              size={44}
              strokeWidth={1.5}
              className="text-slate-400"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="text-center sm:text-left">
          <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-indigo-500/20">
              <Camera size={16} aria-hidden="true" />

              {preview ? "Change photo" : "Upload photo"}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;

                  onChange(file);

                  event.target.value = "";
                }}
              />
            </label>

            {preview && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Trash2 size={16} aria-hidden="true" />
                Remove
              </button>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-500">
            JPG, PNG or WEBP · up to 10MB
          </p>

          <FieldError message={error} />
        </div>
      </div>
    </SectionCard>
  );
}