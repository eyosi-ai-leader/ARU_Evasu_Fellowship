import Link from "next/link";

export default function RegisterHeader() {
  return (
    <div className="mb-8 text-center">
      <Link href="/" className="inline-block">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          ARSI UNIVERSITY EVASU FELLOWSHIP
        </div>
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
        Create your account
      </h1>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Join your campus fellowship and get started.
      </p>
    </div>
  );
}