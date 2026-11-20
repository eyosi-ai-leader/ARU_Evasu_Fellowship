"use client";

function Chip({ tone, children }) {
  const tones = {
    attention: "bg-amber-50 text-amber-700",
    good: "bg-emerald-50 text-emerald-700",
    neutral: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Count({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-xl font-bold text-slate-900">{value}</dd>
    </div>
  );
}

/*
 * The small groups a person oversees (the people who look after families).
 * The page to open a small group is added in the small group step.
 */
export default function SmallGroupsSection({ groups = [] }) {
  if (groups.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          My small groups
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          The families you oversee and the people who still need a place.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <article
            key={group.id}
            className="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <h3 className="font-semibold text-slate-900">{group.name}</h3>

            <dl className="mt-3 grid grid-cols-2 gap-3">
              <Count label="Families" value={group.familyCount} />
              <Count label="Members" value={group.memberCount} />
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              {group.familyCount === 0 && <Chip tone="neutral">No families yet</Chip>}

              {group.withoutFamily > 0 && (
                <Chip tone="attention">
                  {group.withoutFamily} not yet in a family
                </Chip>
              )}

              {group.familiesWithoutParent > 0 && (
                <Chip tone="attention">
                  {group.familiesWithoutParent}{" "}
                  {group.familiesWithoutParent === 1 ? "family needs" : "families need"} a
                  father or mother
                </Chip>
              )}

              {group.familyCount > 0 &&
                group.withoutFamily === 0 &&
                group.familiesWithoutParent === 0 && (
                  <Chip tone="good">Everyone is placed</Chip>
                )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}