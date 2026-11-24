// "Main Campus Fellowship" -> "Main Campus"
const shortName = (name) => String(name || "").replace(/\s+Fellowship$/i, "");

// Each campus keeps the same colour everywhere, so it is recognised at a glance.
const DOTS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
];

const dotFor = (id) => DOTS[Math.abs(Number(id) || 0) % DOTS.length];

/*
 * Where this person is from, for display next to their role.
 *   all      Super Admin, or someone who serves every campus
 *   multi    Staff with a chosen list of campuses
 *   single   a campus the person belongs to or manages
 *   general  leads the General Fellowship only
 *   none     no campus yet
 */
export function getCampusIdentity(access) {
  const campus = access?.campus;

  if (!access || !campus) return null;

  const managed = campus.managed || [];
  const names = managed.map((item) => shortName(item.name));

  if (access.isSuperAdmin || (campus.coversAll && managed.length > 1)) {
    return {
      kind: "all",
      label: "All campuses",
      title: access.isSuperAdmin
        ? "Every campus of the fellowship"
        : `You serve every campus: ${names.join(", ")}`,
    };
  }

  if (managed.length > 1) {
    return {
      kind: "multi",
      label: names.length === 2 ? names.join(" · ") : `${names.length} campuses`,
      title: `You serve: ${names.join(", ")}`,
      dot: dotFor(managed[0].id),
    };
  }

  if (managed.length === 1) {
    return {
      kind: "single",
      label: names[0],
      title: `${names[0]} campus`,
      dot: dotFor(managed[0].id),
    };
  }

  if (campus.own) {
    const own = shortName(campus.own.name);

    return {
      kind: "single",
      label: own,
      title: `Member of ${own}`,
      dot: dotFor(campus.own.id),
    };
  }

  if (campus.includesGeneral) {
    return {
      kind: "general",
      label: "General Fellowship",
      title: "General Fellowship",
    };
  }

  return {
    kind: "none",
    label: "No campus yet",
    title: "You have not been placed in a campus yet",
    muted: true,
  };
}