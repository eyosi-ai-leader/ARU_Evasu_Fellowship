import Link from "next/link";

export default function RegisterHeader() {
  return (
    <div className="mb-8 text-center">
      <Link href="/" className="inline-block">
        <div className="font-display text-2xl font-semibold tracking-tight text-ink">
          ARSI UNIVERSITY EvaSUE FELLOWSHIP
        </div>
      </Link>

      <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink">
        Create your account
      </h1>

      <p className="mt-2 text-sm leading-6 text-body">
        Join your campus fellowship and get started.
      </p>
    </div>
  );
}