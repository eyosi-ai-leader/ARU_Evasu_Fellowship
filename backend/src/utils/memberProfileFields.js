/**
 * Shared by public registration and by the admin "add / edit member" forms,
 * so both read and clean the new fellowship fields in exactly the same way.
 *
 * Meaning of the returned values:
 *   undefined -> the field was not sent (on update: keep the existing value)
 *   null      -> the field was sent empty (on update: clear it)
 *
 * entryYear is the year the student started at the university, as an
 * Ethiopian (E.C.) year such as 2016. The batch, the year of study and the
 * expected graduation year are all worked out from it.
 */

const ACADEMIC_STATUSES = ["Student", "Graduate"];

const RESIDENCE_TYPES = [
  "Dormitory",
  "Off-campus rental",
  "With family or relatives",
  "Other",
];

// Roles a person can have had in a ministry (same words as the form).
const MINISTRY_ROLES = ["Member", "Leader", "Volunteer or helper", "Other"];

const toText = (value, maxLength) => {
  if (value === undefined) return undefined;

  if (value === null) return null;

  const text = String(value).trim();

  return text === "" ? null : text.slice(0, maxLength);
};

const toInt = (value) => {
  if (value === undefined) return undefined;

  if (
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isInteger(number) ? number : null;
};

const toBool = (value) => {
  if (value === undefined) return undefined;

  if (value === null || value === "") return null;

  if (value === true || value === "true" || value === "1" || value === 1) {
    return true;
  }

  if (value === false || value === "false" || value === "0" || value === 0) {
    return false;
  }

  return null;
};

const toTelegram = (value) => {
  const text = toText(value, 64);

  return typeof text === "string"
    ? text.replace(/^@+/, "")
    : text;
};

const pickProfileFields = (body = {}) => ({
  fellowshipId: toInt(body.fellowshipId),
  departmentId: toInt(body.departmentId),

  studentId: toText(body.studentId, 50),
  academicStatus: toText(body.academicStatus, 20),
  entryYear: toInt(body.entryYear),
  graduationYear: toInt(body.graduationYear),

  homeRegion: toText(body.homeRegion, 100),
  homeTown: toText(body.homeTown, 100),
  residenceType: toText(body.residenceType, 40),
  telegramUsername: toTelegram(body.telegramUsername),

  emergencyContactName: toText(body.emergencyContactName, 150),
  emergencyContactPhone: toText(body.emergencyContactPhone, 30),
  emergencyContactRelation: toText(body.emergencyContactRelation, 50),

  newChristian: toBool(body.newChristian),
  previousChurch: toText(body.previousChurch, 150),

  // Ministries: the name, and the role they had in it.
  highSchoolMinistry: toText(body.highSchoolMinistry, 255),
  highSchoolMinistryRole: toText(body.highSchoolMinistryRole, 50),
  churchMinistry: toText(body.churchMinistry, 255),
  churchMinistryRole: toText(body.churchMinistryRole, 50),

  spiritualJourney: toText(body.spiritualJourney, 1000),

  alumniContactConsent: toBool(body.alumniContactConsent),
});

module.exports = {
  ACADEMIC_STATUSES,
  RESIDENCE_TYPES,
  MINISTRY_ROLES,
  pickProfileFields,
};