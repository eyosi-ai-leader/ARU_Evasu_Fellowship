const express = require("express");

const router = express.Router();

const ministryController = require("../controllers/ministryController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  loadAccess,
  requireCapability,
} = require("../middleware/accessMiddleware");

router.use(authMiddleware, loadAccess);

/*
 * Ministry Leaders. A ministry leader is a position (read from
 * ministry_members), not a role number. The service checks that the person
 * leads THIS ministry.
 */
const leads = requireCapability("ministry:lead");

router.get("/my-ministries", leads, ministryController.getMyMinistries);
router.get("/:id/leader-members", leads, ministryController.getLeaderMembers);
router.patch("/:id/leader-details", leads, ministryController.updateLeaderMinistry);
router.post("/:id/leader-members", leads, ministryController.assignLeaderMember);
router.patch(
  "/:id/leader-members/:memberId/status",
  leads,
  ministryController.updateLeaderAssignmentStatus
);
router.delete(
  "/:id/leader-members/:memberId",
  leads,
  ministryController.removeLeaderAssignment
);

// Members who could be added (managers and the ministry's own leaders).
router.get(
  "/:id/candidates",
  requireCapability("fellowship:manage", "general:manage", "ministry:lead"),
  ministryController.getCandidates
);

/*
 * Campus managers: Super Admin, Staff, Fellowship Admin, Main Leader
 * (and General Main Leaders for the General Fellowship). The service limits
 * each person to their own campuses.
 */
router.use(requireCapability("fellowship:manage", "general:manage"));

router.get("/", ministryController.list);
router.post("/", ministryController.create);
router.get("/:id", ministryController.getById);
router.put("/:id", ministryController.update);
router.patch("/:id/status", ministryController.updateStatus);

router.get("/:id/members", ministryController.getMembers);
router.post("/:id/members", ministryController.assignMember);

router.delete(
  "/:id/members/:memberId",
  ministryController.removeAssignment
);

router.post(
  "/:id/members/:memberId/move",
  ministryController.moveMember
);

module.exports = router;