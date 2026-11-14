import AuthBrand from "@/components/shared/Auth/AuthBrand";
import SetPasswordForm from "./SetPasswordForm";

export default function SetPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <AuthBrand />
          </div>

          <SetPasswordForm />
        </div>
      </section>
    </main>
  );
}