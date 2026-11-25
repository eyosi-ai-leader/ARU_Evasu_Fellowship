const { body } = require("express-validator");

const PHONE_PATTERN = /^[+\d\s()-]{5,30}$/;

const optionalText = (field, max, label) =>
  body(field)
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max })
    .withMessage(`${label} must not exceed ${max} characters`);

const profileValidator = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("First name must be between 2 and 100 characters"),

  optionalText("middleName", 100, "Middle name"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Last name must be between 2 and 100 characters"),

  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("Enter a valid phone number"),

  body("gender")
    .optional({ values: "falsy" })
    .isIn(["Male", "Female"])
    .withMessage("Gender must be Male or Female"),

  body("dateOfBirth")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Date of birth must be a valid date")
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error("Date of birth cannot be in the future");
      }

      return true;
    }),

  // Where they are from (the same region and city lists as registration).
  optionalText("homeRegion", 100, "Region"),
  optionalText("homeTown", 100, "City or town"),
  optionalText("address", 255, "Specific place or area"),

  body("telegramUsername")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^@?[A-Za-z0-9_]{1,63}$/)
    .withMessage(
      "Telegram username can only contain letters, numbers and underscores"
    ),

  // Emergency contact
  optionalText("emergencyContactName", 150, "Emergency contact name"),
  optionalText("emergencyContactRelation", 50, "Relation"),

  body("emergencyContactPhone")
    .optional({ values: "falsy" })
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("Enter a valid emergency contact phone number"),
];

module.exports = {
  profileValidator,
};