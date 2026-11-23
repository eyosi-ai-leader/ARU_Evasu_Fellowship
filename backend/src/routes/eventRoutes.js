const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  loadAccess,
  requireCapability,
} = require("../middleware/accessMiddleware");
const { uploadProfileImage } = require("../middleware/uploadMiddleware");

const controller = require("../controllers/eventController");

const {
  idValidator,
  statusValidator,
  rsvpValidator,
  listValidator,
} = require("../validators/eventValidator");

const limiter = (limit) =>
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `events-${req.user.id}`,
    handler: (req, res) =>
      res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      }),
  });

const changeLimiter = limiter(120);
const rsvpLimiter = limiter(300);

// Anyone who manages a campus, leads a ministry or oversees a small group.
const canManageEvents = requireCapability(
  "fellowship:manage",
  "general:manage",
  "ministry:lead",
  "smallgroup:lead"
);

// Everyone who is signed in can read the events they are allowed to see.
router.use(authMiddleware, loadAccess);

// Fixed paths first, then the ":id" routes.
router.get("/", listValidator, controller.list);
router.get("/options", canManageEvents, controller.options);

router.post(
  "/",
  canManageEvents,
  changeLimiter,
  uploadProfileImage.single("image"),
  controller.create
);

// RSVP: everyone who can see the event.
router.put("/:id/rsvp", rsvpLimiter, rsvpValidator, controller.setRsvp);
router.delete("/:id/rsvp", rsvpLimiter, idValidator, controller.removeRsvp);
router.get("/:id/rsvps", canManageEvents, idValidator, controller.listRsvps);

router.get("/:id", canManageEvents, idValidator, controller.details);

router.put(
  "/:id",
  canManageEvents,
  changeLimiter,
  uploadProfileImage.single("image"),
  idValidator,
  controller.update
);

router.patch(
  "/:id/status",
  canManageEvents,
  changeLimiter,
  statusValidator,
  controller.changeStatus
);

router.delete(
  "/:id",
  canManageEvents,
  changeLimiter,
  idValidator,
  controller.remove
);

module.exports = router;