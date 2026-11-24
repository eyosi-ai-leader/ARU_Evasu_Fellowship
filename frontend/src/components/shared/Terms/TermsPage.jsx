import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import AuthBrand from "@/components/shared/Auth/AuthBrand";
import TermsContent from "./TermsContent";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface-muted">
      <header className="border-b border-line bg-white/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          <AuthBrand showHome />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <span
          aria-hidden="true"
          className="mb-4 block h-0.5 w-5 rounded-full bg-accent"
        />

        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Fellowship Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-body">
          Arsi University Evasu Fellowship
        </p>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-8">
          <TermsContent />
        </div>

        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to registration
        </Link>
      </div>
    </main>
  );
}