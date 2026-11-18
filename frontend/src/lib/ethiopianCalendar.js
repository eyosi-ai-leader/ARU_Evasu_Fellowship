/**
 * Ethiopian calendar (E.C.) helpers.
 *
 * People see and type dates in E.C.; the database keeps Gregorian (G.C.).
 * The Ethiopian calendar has 12 months of 30 days and a 13th month, Pagume,
 * of 5 days (6 in a leap year, when year % 4 === 3).
 */

export const ETHIOPIAN_MONTHS = [
  { en: "Meskerem", am: "መስከረም" },
  { en: "Tikimt", am: "ጥቅምት" },
  { en: "Hidar", am: "ኅዳር" },
  { en: "Tahsas", am: "ታኅሣሥ" },
  { en: "Tir", am: "ጥር" },
  { en: "Yekatit", am: "የካቲት" },
  { en: "Megabit", am: "መጋቢት" },
  { en: "Miazia", am: "ሚያዝያ" },
  { en: "Ginbot", am: "ግንቦት" },
  { en: "Sene", am: "ሰኔ" },
  { en: "Hamle", am: "ሐምሌ" },
  { en: "Nehase", am: "ነሐሴ" },
  { en: "Pagume", am: "ጳጉሜን" },
];

const JDN_OFFSET = 1723856;

const pad = (value) => String(value).padStart(2, "0");

/* ---------- Julian day number conversions ---------- */

const gregorianToJdn = (year, month, day) => {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
};

const jdnToGregorian = (jdn) => {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);

  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: 100 * b + d - 4800 + Math.floor(m / 10),
  };
};

const ethiopianToJdn = (year, month, day) =>
  JDN_OFFSET +
  365 +
  365 * (year - 1) +
  Math.floor(year / 4) +
  30 * month +
  day -
  31;

const jdnToEthiopian = (jdn) => {
  const r = (jdn - JDN_OFFSET) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);

  return {
    year:
      4 * Math.floor((jdn - JDN_OFFSET) / 1461) +
      Math.floor(r / 365) -
      Math.floor(r / 1460),
    month: Math.floor(n / 30) + 1,
    day: (n % 30) + 1,
  };
};

/* ---------- Public helpers ---------- */

export const daysInEthiopianMonth = (year, month) =>
  month < 13 ? 30 : year % 4 === 3 ? 6 : 5;

export const ethiopianToIso = (year, month, day) => {
  const g = jdnToGregorian(ethiopianToJdn(year, month, day));

  return `${g.year}-${pad(g.month)}-${pad(g.day)}`;
};

export const todayEthiopian = () => {
  const now = new Date();

  return jdnToEthiopian(
    gregorianToJdn(now.getFullYear(), now.getMonth() + 1, now.getDate())
  );
};

export const currentEthiopianYear = () => todayEthiopian().year;

/**
 * Graduation happens in Sene/Hamle, in the second half of the Ethiopian year,
 * so the Gregorian year is the E.C. year + 8.
 */
export const ecGraduationToGregorian = (ecYear) => Number(ecYear) + 8;

export const gregorianGraduationToEc = (gcYear) => Number(gcYear) - 8;

/**
 * The date fields keep their value as the text "year-month-day" in E.C.
 * ("" when empty, partly filled while the person is still choosing).
 */
export const parseEcValue = (value) => {
  const [year = "", month = "", day = ""] = String(value ?? "").split("-");

  return { year, month, day };
};

export const formatEcValue = ({ year, month, day }) =>
  !year && !month && !day ? "" : `${year}-${month}-${day}`;

/**
 * "year-month-day" in E.C. -> "YYYY-MM-DD" in G.C. ("" if incomplete).
 */
export const ecValueToIso = (value) => {
  const { year, month, day } = parseEcValue(value);

  if (!year || !month || !day) return "";

  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (d > daysInEthiopianMonth(y, m)) return "";

  return ethiopianToIso(y, m, d);
};

/**
 * Returns a message when a (optional) date is half-filled, impossible or in
 * the future; returns "" when it is fine or empty.
 */
export const ecDateProblem = (value, label) => {
  const { year, month, day } = parseEcValue(value);

  if (!year && !month && !day) return "";

  if (!year || !month || !day) {
    return `Please complete the ${label.toLowerCase()}: day, month and year.`;
  }

  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (d > daysInEthiopianMonth(y, m)) {
    return `${label} is not a valid date.`;
  }

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;

  if (ethiopianToIso(y, m, d) > todayIso) {
    return `${label} cannot be in the future.`;
  }

  return "";
};

/**
 * For showing saved dates later (member list, profile):
 * "2007-09-26" -> "15 Meskerem 2000 E.C."
 */
export const formatEthiopianDate = (value) => {
  if (!value) return "";

  let y;
  let m;
  let d;

  if (value instanceof Date) {
    y = value.getFullYear();
    m = value.getMonth() + 1;
    d = value.getDate();
  } else {
    [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  }

  if (!y || !m || !d) return "";

  const e = jdnToEthiopian(gregorianToJdn(y, m, d));

  return `${e.day} ${ETHIOPIAN_MONTHS[e.month - 1].en} ${e.year} E.C.`;
  
};

/**
 * Today (or any date) in words: "Sunday, 6 Hidar 2019 E.C."
 */
export const formatEthiopianLongDate = (date = new Date()) => {
  const e = jdnToEthiopian(
    gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate())
  );

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });

  return `${weekday}, ${e.day} ${ETHIOPIAN_MONTHS[e.month - 1].en} ${e.year} E.C.`;
};

/**
 * "YYYY-MM-DD" (G.C.) -> "year-month-day" in E.C., for the date drop-downs.
 */
export const isoToEcValue = (value) => {
  const [y, m, d] = String(value || "").slice(0, 10).split("-").map(Number);

  if (!y || !m || !d) return "";

  const e = jdnToEthiopian(gregorianToJdn(y, m, d));

  return `${e.year}-${e.month}-${e.day}`;
};