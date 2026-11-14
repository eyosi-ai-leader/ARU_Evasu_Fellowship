const express = require("express");
const rateLimit = require("express-rate-limit");
const { param, validationResult } = require("express-validator");

const router = express.Router();

const {
  getFellowships,
  getFellowshipDepartments,
} = require("../controllers/fellowshipcontroller");

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    }),
});

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  next();
};

/**
 * Public routes (no login): the registration form needs them.
 */
router.get("/", publicLimiter, getFellowships);

router.get(
  "/:id/departments",
  publicLimiter,
  param("id")
    .isInt({ min: 1 })
    .withMessage("Fellowship ID must be a positive integer"),
  validateRequest,
  getFellowshipDepartments
);

module.exports = router;