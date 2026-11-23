const { body, param, query } = require("express-validator");

const DELIVERY_VALUES = ["both", "dashboard", "email"];
const PRIORITY_VALUES = ["normal", "important", "urgent"];

const audienceRule = body("audience")
  .isObject()
  .withMessage("Choose who should receive this announcement.");

const deliveryRule = body("delivery")
  .optional()
  .isIn(DELIVERY_VALUES)
  .withMessage("Choose how to deliver this announcement.");

const subjectRule = body("subject")
  .trim()
  .notEmpty()
  .withMessage("Subject is required")
  .isLength({ max: 150 })
  .withMessage("Subject must not exceed 150 characters");

const messageRule = body("message")
  .trim()
  .notEmpty()
  .withMessage("Message is required")
  .isLength({ min: 10, max: 5000 })
  .withMessage("Message must be between 10 and 5000 characters");

// Everything below is optional. The service checks the values in detail.
const optionalRules = [
  body("priority")
    .optional({ values: "falsy" })
    .isIn(PRIORITY_VALUES)
    .withMessage("Choose a valid priority"),
  body("category")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 40 })
    .withMessage("Category is too long"),
  body("actionLabel")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 40 })
    .withMessage("The button text must not exceed 40 characters"),
  body("actionUrl")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("The link is too long"),
  body("scheduledAt").optional({ values: "falsy" }).isString(),
  body("expiresAt").optional({ values: "falsy" }).isString(),
  body("pinned")
    .optional()
    .isBoolean()
    .withMessage("Pinned must be true or false"),
];

const idRule = param("id").isInt({ min: 1 }).withMessage("Invalid announcement");

const previewValidator = [audienceRule, deliveryRule];

const testValidator = [
  subjectRule,
  messageRule,
  body("priority").optional({ values: "falsy" }).isIn(PRIORITY_VALUES),
  body("actionLabel").optional({ values: "falsy" }).trim().isLength({ max: 40 }),
  body("actionUrl").optional({ values: "falsy" }).trim().isLength({ max: 500 }),
];

const createAnnouncementValidator = [
  subjectRule,
  messageRule,
  audienceRule,
  deliveryRule,
  ...optionalRules,
];

const retryValidator = [idRule];
const detailsValidator = [idRule];
const cancelValidator = [idRule];

const pinValidator = [
  idRule,
  body("pinned").isBoolean().withMessage("Pinned must be true or false"),
];

const retryRecipientValidator = [
  idRule,
  param("recipientId").isInt({ min: 1 }).withMessage("Invalid recipient"),
];

const idQuery = (name, label) =>
  query(name)
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage(`Invalid ${label}`);

const membersQueryValidator = [
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search is too long"),
  idQuery("campusId", "campus"),
  idQuery("ministryId", "ministry"),
  idQuery("smallGroupId", "small group"),
  query("page")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 1000 })
    .withMessage("Invalid page"),
  query("delivery")
    .optional({ values: "falsy" })
    .isIn(DELIVERY_VALUES)
    .withMessage("Invalid delivery"),
];

const listQueryValidator = [
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search is too long"),
  query("page")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 10000 })
    .withMessage("Invalid page"),
  query("status")
    .optional({ values: "falsy" })
    .isIn(["scheduled", "sending", "sent", "partial", "failed", "cancelled"])
    .withMessage("Invalid status"),
];

module.exports = {
  previewValidator,
  testValidator,
  createAnnouncementValidator,
  retryValidator,
  detailsValidator,
  cancelValidator,
  pinValidator,
  retryRecipientValidator,
  membersQueryValidator,
  listQueryValidator,
};