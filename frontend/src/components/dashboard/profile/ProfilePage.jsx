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
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-accent shadow-soft">
          <UserRound size={21} strokeWidth={2} />
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            {editing ? "Edit profile" : "My Profile"}
          </h1>

          <p className="mt-0.5 text-sm text-body">
            {editing
              ? "Update your personal information, then save your changes."
              : "Your personal details and your place in the fellowship."}
          </p>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-3xl border border-success/30 bg-success/10 px-5 py-3 text-sm text-success"
        >
          <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />

          <span className="flex-1">{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
            className="rounded-full p-1.5 text-success transition hover:bg-success/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loading && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-3xl bg-white py-16 text-sm text-body ring-1 ring-line"
        >
          <Loader2 size={18} className="animate-spin text-primary" />
          Loading your profile...
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-3xl border border-danger/30 bg-danger/10 p-6 text-center"
        >
          <p className="text-sm text-danger">{error}</p>

          <button
            type="button"
            onClick={load}
            className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.97]"
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