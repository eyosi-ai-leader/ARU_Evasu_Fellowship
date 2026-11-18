import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import AuthBrand from "@/components/shared/Auth/AuthBrand";
import TermsContent from "./TermsContent";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <AuthBrand showHome />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Fellowship Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Arsi University Evasu Fellowship
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <TermsContent />
        </div>

        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to registration
        </Link>
      </div>
    </main>
  );
}