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
 *                     a student must give an expected graduation year.
 * partial = true   -> "edit member": every field is optional, and only the
 *                     fields that are sent are checked.
 */
const profileRules = ({ partial = false } = {}) => {
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 10;

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

    body("graduationYear").custom((value, { req }) => {
      const status = req.body.academicStatus || (partial ? "" : "Student");

      if (!hasValue(value)) {
        if (!partial && status === "Student") {
          throw new Error("Expected graduation year is required");
        }

        return true;
      }

      const year = Number(value);

      if (!Number.isInteger(year) || year < 2000 || year > maxYear) {
        throw new Error(
          `Graduation year must be between 2000 and ${maxYear}`
        );
      }

      if (status === "Student" && year < currentYear) {
        throw new Error(
          "Expected graduation year cannot be in the past. If you have already graduated, choose Graduate."
        );
      }

      return true;
    }),

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