const time = require("./churchTime");

/*
 * "2026-12-05T18:30" or "2026-12-05 18:30(:00)" -> "2026-12-05 18:30:00"
 * (church time), or null when it is not a real date and time.
 */
const parseDateTime = (value) => {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?$/.exec(
    String(value || "").trim()
  );

  if (!match) return null;

  const normalized = `${match[1]} ${match[2]}:00`;
  const date = time.parseNaive(normalized);

  return date && time.formatNaive(date) === normalized ? normalized : null;
};

const parseDateOnly = (value) => {
  const text = String(value || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;

  const date = time.parseNaive(`${text} 00:00:00`);

  return date && time.formatNaive(date) === `${text} 00:00:00` ? text : null;
};

module.exports = { parseDateTime, parseDateOnly };