// "2026-11-24" -> "November 24, 2026" (no time zone shifts)
export function formatDate(value) {
  if (!value) return "";

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) return String(value);

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// "2026-11-24T10:00:00Z" -> "November 2026"
export function formatMonth(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, { year: "numeric", month: "long" });
}