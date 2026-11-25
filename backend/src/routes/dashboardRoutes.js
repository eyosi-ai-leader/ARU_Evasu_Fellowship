const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { loadAccess } = require("../middleware/accessMiddleware");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

/*
 * Dashboard
 * Every signed-in person gets a dashboard built from what they may do
 * (loadAccess), not from one role number.
 *
 * Optional: ?fellowshipId=2 narrows it to one campus, but only if the
 * person manages that campus.
 */
router.get(
  "/overview",
  authMiddleware,
  loadAccess,
  dashboardController.getDashboardOverview
);

router.get(
  "/my-fellowship",
  authMiddleware,
  loadAccess,
  dashboardController.getMyFellowshipProfile
);

router.get(
  "/my-announcements",
  authMiddleware,
  loadAccess,
  dashboardController.getMyAnnouncements
);

router.patch(
  "/my-announcements/:id/read",
  authMiddleware,
  loadAccess,
  dashboardController.markAnnouncementRead
);

router.get(
  "/my-circles/:type",
  authMiddleware,
  loadAccess,
  dashboardController.getMyCircles
);

module.exports = router;