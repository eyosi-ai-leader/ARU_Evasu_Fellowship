"use client";

export default function CampusBreakdown({ campuses = [] }) {
  if (campuses.length < 2) return null;

  const max = Math.max(...campuses.map((campus) => campus.total), 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Members by campus
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          How the members are spread across the campuses you manage.
        </p>
      </div>

      <ul className="mt-5 space-y-4">
        {campuses.map((campus) => (
          <li key={campus.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">
                {campus.name}
              </p>

              <p className="text-xs text-slate-500">
                {campus.active} active of {campus.total}
              </p>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900"
                style={{
                  width: `${Math.max((campus.total / max) * 100, 2)}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}