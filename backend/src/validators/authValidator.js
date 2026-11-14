const { body } = require("express-validator");

const {
  PASSWORD_RULES_MESSAGE,
  isStrongPassword,
} = require("../utils/passwordPolicy");

const { profileRules } = require("./memberProfileRules");

const registerValidator = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "First name must be between 2 and 100 characters"
    ),

  body("middleName")
    .optional({
      values: "falsy",
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Middle name must not exceed 100 characters"
    ),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Last name must be between 2 and 100 characters"
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage(
      "Please provide a valid email"
    )
    .normalizeEmail(),

  /*
   * Phone is required: leaders use it to reach members,
   * including after they graduate.
   */
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isLength({
      max: 20,
    })
    .withMessage(
      "Phone number must not exceed 20 characters"
    ),

  body("gender")
    .trim()
    .notEmpty()
    .withMessage("Gender is required")
    .bail()
    .isIn(["Male", "Female"])
    .withMessage(
      "Gender must be Male or Female"
    ),

  body("dateOfBirth")
    .optional({
      values: "falsy",
    })
    .trim()
    .isISO8601()
    .withMessage(
      "Date of birth must be a valid date"
    ),

  body("baptismDate")
    .optional({
      values: "falsy",
    })
    .trim()
    .isISO8601()
    .withMessage(
      "Baptism date must be a valid date"
    ),

  /*
   * Where the member lives now (dormitory block, area, house...).
   */
  body("address")
    .optional({
      values: "falsy",
    })
    .trim()
    .isLength({
      max: 255,
    })
    .withMessage(
      "Address must not exceed 255 characters"
    ),

  /*
   * Campus, department, graduation year, hometown, emergency contact,
   * spiritual background and permission to contact after graduation.
   */
  ...profileRules(),

  body("password").custom((value) => {
    if (!isStrongPassword(value)) {
      throw new Error(PASSWORD_RULES_MESSAGE);
    }

    return true;
  }),

  body("confirmPassword")
    .notEmpty()
    .withMessage(
      "Confirm password is required"
    )
    .custom(
      (value, { req }) => {
        if (
          value !== req.body.password
        ) {
          throw new Error(
            "Passwords do not match"
          );
        }

        return true;
      }
    ),
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage(
      "Please provide a valid email"
    )
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

module.exports = {
  registerValidator,
  loginValidator,
};