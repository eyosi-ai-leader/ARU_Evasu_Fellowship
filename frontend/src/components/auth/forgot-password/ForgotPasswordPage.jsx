import AuthBrand from "@/components/shared/Auth/AuthBrand";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
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

          <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-8">
            <ForgotPasswordForm />
          </div>
        </div>
      </section>
    </main>
  );
}