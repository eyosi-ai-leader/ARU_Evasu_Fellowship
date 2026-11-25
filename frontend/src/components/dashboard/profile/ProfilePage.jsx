"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, UserRound, X } from "lucide-react";

import ProfileView from "./ProfileView";
import ProfileForm from "./ProfileForm";
import { getMyProfile } from "@/lib/profileApi";
import { getMyFellowshipProfile } from "@/lib/dashboardApi";
import { updateStoredUser } from "@/lib/userStorage";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState("view"); // view | edit
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // The fellowship side loads on its own, so a problem there never hides
  // the person's profile.
  const [fellowship, setFellowship] = useState({
    status: "loading",
    data: null,
    error: "",
  });

  const loadFellowship = useCallback(async () => {
    setFellowship((current) => ({ ...current, status: "loading" }));

    try {
      const result = await getMyFellowshipProfile();

      setFellowship({ status: "ready", data: result?.data ?? null, error: "" });
    } catch (err) {
      setFellowship({
        status: "error",
        data: null,
        error: err.message || "We couldn't load your fellowship details.",
      });
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyProfile();
      setProfile(data);
      // Lets the header and sidebar show the photo.
      updateStoredUser({ profileImage: data.profileImage });
    } catch (err) {
      setError(err.message || "We couldn't load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadFellowship();
  }, [load, loadFellowship]);

  // The success message disappears by itself after a few seconds.
  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(""), 6000);

    return () => clearTimeout(timer);
  }, [notice]);

  function handleSaved(updated) {
    setProfile(updated);
    setMode("view");
    setNotice("Your profile has been updated successfully.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEdit() {
    setNotice("");
    setMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setMode("view");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const editing = mode === "edit";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          <UserRound size={19} strokeWidth={2} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {editing ? "Edit profile" : "My Profile"}
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            {editing
              ? "Update your personal information, then save your changes."
              : "Your personal details and your place in the fellowship."}
          </p>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />

          <span className="flex-1">{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
            className="rounded-md p-1 text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loading && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500"
        >
          <Loader2 size={18} className="animate-spin" />
          Loading your profile...
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
        >
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={load}
            className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && profile && !editing && (
        <ProfileView
          profile={profile}
          fellowship={fellowship}
          onEdit={handleEdit}
          onReloadFellowship={loadFellowship}
        />
      )}

      {!loading && !error && profile && editing && (
        <ProfileForm
          profile={profile}
          campusName={fellowship.data?.member?.campusName || ""}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}