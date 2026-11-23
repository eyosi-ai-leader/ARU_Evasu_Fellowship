const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  loadAccess,
  requireCapability,
} = require("../middleware/accessMiddleware");

const controller = require("../controllers/announcementController");

const {
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
} = require("../validators/announcementValidator");

const perUserLimiter = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `user-${req.user.id}`,
    handler: (req, res) =>
      res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      }),
  });

const previewLimiter = perUserLimiter(15 * 60 * 1000, 120);
const browseLimiter = perUserLimiter(15 * 60 * 1000, 300);
const testLimiter = perUserLimiter(60 * 60 * 1000, 10);
const createLimiter = perUserLimiter(60 * 60 * 1000, 20);
const retryLimiter = perUserLimiter(60 * 60 * 1000, 30);
const deleteLimiter = perUserLimiter(60 * 60 * 1000, 60);

/*
 * Anyone who manages a campus, leads a ministry or oversees a small group
 * can send announcements. The service limits each person to the people they
 * can reach (see utils/reachScope.js).
 */
router.use(
  authMiddleware,
  loadAccess,
  requireCapability(
    "fellowship:manage",
    "general:manage",
    "ministry:lead",
    "smallgroup:lead"
  )
);

// Fixed paths first, then the ":id" routes.
router.get("/options", controller.getOptions);
router.get("/members", browseLimiter, membersQueryValidator, controller.searchMembers);
router.get("/", listQueryValidator, controller.list);

router.post("/preview", previewLimiter, previewValidator, controller.preview);
router.post("/test", testLimiter, testValidator, controller.sendTest);
router.post("/", createLimiter, createAnnouncementValidator, controller.create);

router.get("/:id", detailsValidator, controller.details);
router.delete("/:id", deleteLimiter, detailsValidator, controller.remove);
router.post("/:id/retry", retryLimiter, retryValidator, controller.retry);
router.post("/:id/cancel", retryLimiter, cancelValidator, controller.cancel);
router.patch("/:id/pin", retryLimiter, pinValidator, controller.pin);
router.post(
  "/:id/recipients/:recipientId/retry",
  retryLimiter,
  retryRecipientValidator,
  controller.retryRecipient
);

module.exports = router;