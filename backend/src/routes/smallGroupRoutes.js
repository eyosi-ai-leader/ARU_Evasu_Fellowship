const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  loadAccess,
  requireCapability,
} = require("../middleware/accessMiddleware");

const controller = require("../controllers/smallGroupController");

const {
  groupIdValidator,
  createGroupValidator,
  updateGroupValidator,
  addLeaderValidator,
  removeLeaderValidator,
  createFamilyValidator,
  familyIdValidator,
  updateFamilyValidator,
  familyMembersValidator,
  removeFamilyMemberValidator,
  candidatesValidator,
} = require("../validators/smallGroupValidator");

// Campus managers and small group overseers. The service then limits each
// person to their own campus or their own small group.
router.use(
  authMiddleware,
  loadAccess,
  requireCapability("fellowship:manage", "smallgroup:lead")
);

router.get("/", controller.listGroups);
router.post("/", createGroupValidator, controller.createGroup);

// Family routes first (fixed word "families"), then the :groupId routes.
router.put("/families/:familyId", updateFamilyValidator, controller.updateFamily);
router.delete("/families/:familyId", familyIdValidator, controller.deleteFamily);
router.put(
  "/families/:familyId/members",
  familyMembersValidator,
  controller.saveFamilyMembers
);
router.delete(
  "/families/:familyId/members/:memberId",
  removeFamilyMemberValidator,
  controller.removeFamilyMember
);

router.put("/:groupId", updateGroupValidator, controller.updateGroup);
router.post("/:groupId/leaders", addLeaderValidator, controller.addLeader);
router.delete(
  "/:groupId/leaders/:memberId",
  removeLeaderValidator,
  controller.removeLeader
);
router.get("/:groupId/families", groupIdValidator, controller.listFamilies);
router.get(
  "/:groupId/candidates",
  candidatesValidator,
  controller.listCandidates
);
router.post("/:groupId/families", createFamilyValidator, controller.createFamily);

module.exports = router;