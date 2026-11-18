import { currentEthiopianYear } from "@/lib/ethiopianCalendar";

/**
 * Batch and year of study.
 *
 * Every member has an ENTRY YEAR: the year they started at the university,
 * as an Ethiopian (E.C.) year such as 2016. From it:
 *
 *   batch                = the entry year            ("Batch 2016")
 *   year of study        = this E.C. year - entry + 1 ("3rd year")
 *   expected graduation  = entry year + the department's program length
 *                          (engineering 5, medicine 6, most others 4 ...)
 *
 * The program length only matters for the expected graduation year.
 * The backend filters by the same entry year.
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
 * Returns null when the member has no entry year yet.
 */
export function getBatchInfo(member) {
  const batch = Number(member?.entry_year);

  if (!batch) {
    return null;
  }

  const programYears = Number(member?.department_duration_years) || null;
  const graduationEc = programYears ? batch + programYears : null;

  const isGraduate = member?.academic_status === "Graduate";
  const studyYear = isGraduate ? null : currentEthiopianYear() - batch + 1;

  let yearText;

  if (isGraduate) {
    yearText = graduationEc ? `Graduated ${graduationEc}` : "Graduate";
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
    yearText,
    text: `Batch ${batch} · ${yearText}`,
  };
}

/**
 * The Batch / Year filter has two kinds of choice, both worked out from
 * TODAY's E.C. year, so nothing is fixed and it keeps working every year:
 *
 *   "year:3"     -> everybody who is in the 3rd year now
 *                   (the label never changes: 1st year ... 6th year)
 *   "batch:2019" -> everybody who started in 2019 E.C.
 *                   (the list moves forward by itself every Meskerem)
 *
 * Both end up as one entry year for the backend.
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
 * "year:3" / "batch:2017" -> the entry year as text ("" for no filter).
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

/**
 * The entry years offered in the forms, newest first.
 *   students:  this year back to 7 years ago (the longest program is 6 years)
 *   graduates: the last 30 years
 */
export function getEntryYearOptions(isStudent) {
  const now = currentEthiopianYear();
  const count = isStudent ? 8 : 31;

  return Array.from({ length: count }, (_, index) => {
    const year = now - index;

    return {
      value: String(year),
      label: isStudent
        ? `${year} E.C. · ${ordinal(index + 1)} year`
        : `${year} E.C.`,
    };
  });
}