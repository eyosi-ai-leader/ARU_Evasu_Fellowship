import { Suspense } from "react";

import AuthBrand from "@/components/shared/Auth/AuthBrand";
import VerifyEmailForm from "./VerifyEmailForm";

export default function VerifyEmailPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-surface-muted">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-20 -z-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
      />

      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <AuthBrand />
          </div>

          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
              Verify your email
            </h1>
            <p className="mt-2 text-sm leading-6 text-body">
              Enter the 6-digit code we sent to your email.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-8">
            <Suspense fallback={null}>
              <VerifyEmailForm />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}