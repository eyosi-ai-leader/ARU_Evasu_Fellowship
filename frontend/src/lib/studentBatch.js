import {
  currentEthiopianYear,
  gregorianGraduationToEc,
} from "@/lib/ethiopianCalendar";

/**
 * Batch and year of study.
 *
 * Nothing extra is stored. Everything is worked out from what the member
 * already has:
 *   - the graduation year (the database keeps it in G.C. = E.C. year + 8)
 *   - the length of the DEPARTMENT'S program, in years, set per department
 *     (engineering 5, medicine 6, information systems 4, ...)
 *
 *   batch (the year they started, E.C.) = graduation year (E.C.) - program length
 *   year of study                        = this E.C. year - batch + 1
 *
 * There is no "general" length. When a department has no program length
 * yet, the batch is simply "not set" instead of a wrong guess.
 *
 * The backend uses the same formula for the Batch filter.
 */

const ORDINAL_SUFFIX = { 1: "st", 2: "nd", 3: "rd" };

export const ordinal = (number) => {
  const n = Number(number);
  const lastTwo = n % 100;

  if (lastTwo >= 11 && lastTwo <= 13) {
    return `${n}th`;
  }

  return `${n}${ORDINAL_SUFFIX[n % 10] || "th"}`;
};

/**
 * Returns null when the member has no graduation year.
 * When the department has no program length, `batch` is null and
 * `needsDuration` is true.
 */
export function getBatchInfo(member) {
  const graduationGc = Number(member?.graduation_year);

  if (!graduationGc) {
    return null;
  }

  const graduationEc = gregorianGraduationToEc(graduationGc);
  const programYears = Number(member?.department_duration_years) || null;

  if (!programYears) {
    return {
      batch: null,
      graduationEc,
      programYears: null,
      studyYear: null,
      isGraduate: member?.academic_status === "Graduate",
      needsDuration: true,
      yearText: "",
      text: "Batch not set",
    };
  }

  const batch = graduationEc - programYears;
  const isGraduate = member?.academic_status === "Graduate";

  const studyYear = isGraduate
    ? null
    : currentEthiopianYear() - batch + 1;

  let yearText;

  if (isGraduate) {
    yearText = `Graduated ${graduationEc}`;
  } else if (studyYear >= 1) {
    yearText = `${ordinal(studyYear)} year`;
  } else {
    yearText = "Starting soon";
  }

  return {
    batch,
    graduationEc,
    programYears,
    studyYear,
    isGraduate,
    needsDuration: false,
    yearText,
    text: `Batch ${batch} · ${yearText}`,
  };
}

/**
 * The Batch / Year filter has two kinds of choice, both worked out from
 * TODAY's E.C. year, so nothing is fixed and it keeps working every year:
 *
 *   "year:3"   -> everybody who is in the 3rd year now
 *                 (the label never changes: 1st year ... 6th year)
 *   "batch:2019" -> everybody who started in 2019 E.C.
 *                 (the list moves forward by itself every Meskerem)
 *
 * Both end up as one batch year for the backend.
 */
export const MAX_STUDY_YEAR = 6; // medicine and veterinary medicine

const BATCH_LIST_LENGTH = 10;

export function getYearOptions() {
  return Array.from({ length: MAX_STUDY_YEAR }, (_, index) => ({
    value: `year:${index + 1}`,
    label: `${ordinal(index + 1)} year`,
  }));
}

export function getBatchOptions() {
  const now = currentEthiopianYear();

  return Array.from({ length: BATCH_LIST_LENGTH }, (_, index) => ({
    value: `batch:${now - index}`,
    label: `Batch ${now - index}`,
  }));
}

/**
 * "year:3" / "batch:2017" -> the batch year as text ("" for no filter).
 */
export function batchFromChoice(choice) {
  if (!choice) {
    return "";
  }

  const [kind, value] = String(choice).split(":");
  const number = Number(value);

  if (!Number.isInteger(number)) {
    return "";
  }

  if (kind === "year") {
    return String(currentEthiopianYear() - number + 1);
  }

  if (kind === "batch") {
    return String(number);
  }

  return "";
}