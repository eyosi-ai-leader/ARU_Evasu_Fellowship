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
  moveFamilyMemberValidator,
  candidatesValidator,
  addGroupMembersValidator,
  removeFromGroupValidator,
  transferValidator,
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
router.put(
  "/families/:familyId/members/:memberId/move",
  moveFamilyMemberValidator,
  controller.moveFamilyMember
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

router.get("/:groupId/candidates", candidatesValidator, controller.listCandidates);

router.post("/:groupId/members", addGroupMembersValidator, controller.addGroupMembers);
router.post(
  "/:groupId/members/:memberId/transfer",
  transferValidator,
  controller.transferMember
);
router.delete(
  "/:groupId/members/:memberId",
  removeFromGroupValidator,
  controller.removeFromGroup
);

router.get("/:groupId/families", groupIdValidator, controller.listFamilies);
router.post("/:groupId/families", createFamilyValidator, controller.createFamily);

module.exports = router;