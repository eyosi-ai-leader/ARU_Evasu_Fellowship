const { body } = require("express-validator");

const {
  ACADEMIC_STATUSES,
  RESIDENCE_TYPES,
  MINISTRY_ROLES,
} = require("../utils/memberProfileFields");

const hasValue = (value) =>
  value !== undefined &&
  value !== null &&
  String(value).trim() !== "";

const optionalText = (field, max, label) =>
  body(field)
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max })
    .withMessage(`${label} must not exceed ${max} characters`);

const optionalRole = (field, label) =>
  body(field)
    .optional({ values: "falsy" })
    .isIn(MINISTRY_ROLES)
    .withMessage(`${label} role is not valid`);

/**
 * Rules for the fellowship fields.
 *
 * partial = false  -> registration and "add member": campus is required, and
 *                     a student must give the year they started (entry year).
 * partial = true   -> "edit member": every field is optional, and only the
 *                     fields that are sent are checked.
 */
const profileRules = ({ partial = false } = {}) => {
  const currentYear = new Date().getFullYear();

  // Entry years are Gregorian (G.C.), for example 2023. A student can
  // have started this year at the latest.
  const minEntryYear = 1990;
  const maxEntryYear = currentYear;

  return [
    partial
      ? body("fellowshipId")
          .optional({ values: "falsy" })
          .isInt({ min: 1 })
          .withMessage("Campus fellowship is not valid")
      : body("fellowshipId")
          .exists({ values: "falsy" })
          .withMessage("Please select your campus fellowship")
          .bail()
          .isInt({ min: 1 })
          .withMessage("Campus fellowship is not valid"),

    body("departmentId")
      .optional({ values: "falsy" })
      .isInt({ min: 1 })
      .withMessage("Department is not valid"),

    optionalText("studentId", 50, "Student ID"),

    body("academicStatus")
      .optional({ values: "falsy" })
      .isIn(ACADEMIC_STATUSES)
      .withMessage("Academic status must be Student or Graduate"),

    // The year they started at the university, in G.C. (for example 2023).
    body("entryYear").custom((value, { req }) => {
      const status = req.body.academicStatus || (partial ? "" : "Student");

      if (!hasValue(value)) {
        if (!partial && status === "Student") {
          throw new Error("Entry year is required");
        }

        return true;
      }

      const year = Number(value);

      if (
        !Number.isInteger(year) ||
        year < minEntryYear ||
        year > maxEntryYear
      ) {
        throw new Error(
          `Entry year must be a year between ${minEntryYear} and ${maxEntryYear}`
        );
      }

      return true;
    }),

    // Kept for the graduates feature (the real graduation year, G.C.).
    body("graduationYear")
      .optional({ values: "falsy" })
      .isInt({ min: 2000, max: currentYear + 10 })
      .withMessage(
        `Graduation year must be between 2000 and ${currentYear + 10}`
      ),

    optionalText("homeRegion", 100, "Home region"),
    optionalText("homeTown", 100, "Home town"),

    body("residenceType")
      .optional({ values: "falsy" })
      .isIn(RESIDENCE_TYPES)
      .withMessage("Residence type is not valid"),

    body("telegramUsername")
      .optional({ values: "falsy" })
      .trim()
      .matches(/^@?[A-Za-z0-9_]{5,32}$/)
      .withMessage(
        "Telegram username must be 5-32 letters, numbers or underscores"
      ),

    optionalText(
      "emergencyContactName",
      150,
      "Emergency contact name"
    ),

    body("emergencyContactPhone")
      .optional({ values: "falsy" })
      .trim()
      .matches(/^[0-9+\-\s()]{6,30}$/)
      .withMessage("Emergency contact phone is not valid"),

    optionalText(
      "emergencyContactRelation",
      50,
      "Emergency contact relation"
    ),

    body("newChristian")
      .optional({ values: "falsy" })
      .isBoolean()
      .withMessage("New Christian must be yes or no"),

    optionalText("previousChurch", 150, "Previous church"),

    optionalText(
      "highSchoolMinistry",
      255,
      "High school ministry"
    ),
    optionalRole("highSchoolMinistryRole", "High school ministry"),

    optionalText("churchMinistry", 255, "Church ministry"),
    optionalRole("churchMinistryRole", "Church ministry"),

    optionalText("spiritualJourney", 1000, "Spiritual journey"),

    body("alumniContactConsent")
      .optional({ values: "falsy" })
      .isBoolean()
      .withMessage("Contact permission must be yes or no"),
  ];
};

module.exports = { profileRules };