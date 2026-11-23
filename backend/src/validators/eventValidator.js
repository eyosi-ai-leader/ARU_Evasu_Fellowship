const { body, param, query } = require("express-validator");

const idValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid event"),
];

const statusValidator = [
  ...idValidator,
  body("status")
    .isIn(["published", "cancelled"])
    .withMessage("Status must be published or cancelled"),
];

const rsvpValidator = [
  ...idValidator,
  body("response")
    .isIn(["going", "maybe", "not_going"])
    .withMessage("Choose going, maybe or not going"),
  body("guests")
    .optional({ values: "falsy" })
    .isInt({ min: 0, max: 5 })
    .withMessage("Guests must be between 0 and 5"),
];

const listValidator = [
  query("scope")
    .optional({ values: "falsy" })
    .isIn(["upcoming", "past"])
    .withMessage("Invalid scope"),
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search is too long"),
  query("page")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 10000 })
    .withMessage("Invalid page"),
  query("fellowshipId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Invalid campus"),
];

const publicListValidator = [
  query("limit")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 50 })
    .withMessage("Invalid limit"),
  query("campus")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Invalid campus"),
];

const slugValidator = [
  param("slug")
    .isString()
    .isLength({ min: 3, max: 160 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Invalid event"),
];

module.exports = {
  idValidator,
  statusValidator,
  rsvpValidator,
  listValidator,
  publicListValidator,
  slugValidator,
};