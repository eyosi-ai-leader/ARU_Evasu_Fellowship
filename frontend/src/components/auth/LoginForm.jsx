"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail } from "lucide-react";

import PasswordInput from "@/components/shared/Password/PasswordInput";
import GoogleSignInButton from "./GoogleSignInButton";
import InactiveAccountNotice from "./InactiveAccountNotice";
import { loginUser } from "@/lib/authApi";
import { loginWithGoogle } from "@/lib/googleAuthApi";
import { saveSession } from "@/lib/authSession";

const GOOGLE_ENABLED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

function readSession(result) {
  const token = result?.data?.token || result?.token;
  const user = result?.data?.user || result?.user;

  if (!token) throw new Error("No authentication token received.");
  if (!user) throw new Error("User information not received.");

  return { token, user };
}

// The backend sends code "ACCOUNT_INACTIVE" (the message check is a fallback).
function isInactiveError(err) {
  return (
    err?.code === "ACCOUNT_INACTIVE" ||
    String(err?.message || "").toLowerCase().includes("inactive")
  );
}

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [inactive, setInactive] = useState(null); // { name, email }

  const busy = loading || googleLoading;

  // A signed-in person whose account was made inactive is sent back here.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("chms:inactive") === "1") {
        sessionStorage.removeItem("chms:inactive");
        setInactive({ name: "", email: "" });
      }
    } catch {
      /* storage can be blocked: ignore */
    }
  }, []);

  function showInactive(err, fallbackEmail) {
    setError("");
    setInactive({
      name: err?.data?.firstName || "",
      email: err?.data?.email || fallbackEmail || "",
    });
  }

  function backToSignIn() {
    setInactive(null);
    setPassword("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    setError("");
    setLoading(true);

    try {
      const result = await loginUser(email.trim(), password);
      const { token, user } = readSession(result);

      saveSession({ token, user, rememberMe });
      router.push("/dashboard");
    } catch (err) {
      const message = err.message || "Unable to sign in.";

      // Inactive account: show the gentle message, not a red error.
      if (isInactiveError(err)) {
        showInactive(err, email.trim());
        return;
      }

      // Unverified account: send the person to the code page.
      if (message.toLowerCase().includes("verify your email")) {
        router.push(
          `/verify-email?email=${encodeURIComponent(email.trim())}`
        );
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(credential) {
    if (busy) return;

    setError("");
    setGoogleLoading(true);

    try {
      const result = await loginWithGoogle(credential);
      const { token, user } = readSession(result);

      saveSession({ token, user, rememberMe });
      router.push("/dashboard");
      // Stay in the loading state while the dashboard opens.
    } catch (err) {
      if (isInactiveError(err)) {
        showInactive(err, "");
      } else {
        setError(err.message || "We couldn't sign you in with Google.");
      }

      setGoogleLoading(false);
    }
  }

  if (inactive) {
    return (
      <InactiveAccountNotice
        name={inactive.name}
        email={inactive.email}
        onBack={backToSignIn}
      />
    );
  }

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </div>
      )}

      {GOOGLE_ENABLED && (
        <>
          <GoogleSignInButton
            onCredential={handleGoogle}
            onError={setError}
            disabled={busy}
          />

          {googleLoading && (
            <p
              role="status"
              className="mt-3 flex items-center justify-center gap-2 text-sm text-body"
            >
              <Loader2 size={15} className="animate-spin text-primary" />
              Signing you in with Google...
            </p>
          )}

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-line" />

            <span className="whitespace-nowrap text-xs font-medium text-body">
              or sign in with email
            </span>

            <div className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="mb-2 block text-sm font-semibold text-ink"
          >
            Email address
          </label>

          <div className="relative">
            <Mail
              size={18}
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60"
            />

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@fellowship.com"
              autoComplete="email"
              required
              className="w-full rounded-2xl border border-line bg-white py-3.5 pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        {/* Password */}
        <PasswordInput
          id="login-password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-line text-primary focus:ring-primary/40"
            />

            <span className="text-sm text-body">Remember me</span>
          </label>

          <Link
            href="/forgot-password"
            className="rounded text-sm font-semibold text-primary transition hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Forgot password?
          </Link>
        </div>

        {/* Sign in */}
        <button
          type="submit"
          disabled={busy}
          className="group flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight
                size={17}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-body">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="rounded font-semibold text-primary transition hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Register
        </Link>
      </p>
    </div>
  );
}