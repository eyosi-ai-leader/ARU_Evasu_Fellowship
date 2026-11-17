const express = require("express");
const router = express.Router();

const memberController = require("../controllers/memberController");
const ministryMemberController = require("../controllers/ministryMemberController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  loadAccess,
  requireCapability,
} = require("../middleware/accessMiddleware");

const { ROLE_IDS } = require("../constants/roles");

const {
  memberIdValidator,
  createMemberValidator,
  updateMemberValidator,
} = require("../validators/memberValidator");

const { uploadProfileImage } = require("../middleware/uploadMiddleware");
const { validationResult } = require("express-validator");

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
 * Every route below needs a signed-in person (authMiddleware) and then
 * loads what that person is allowed to do (loadAccess -> req.access).
 */
router.use(authMiddleware);
router.use(loadAccess);

/**
 * Small group leader routes.
 *
 * Open to ANYONE who leads a small group (capability "smallgroup:lead"),
 * whatever their role is. They see only the members of the group(s) they
 * lead, and only the fields a leader needs.
 */
router.get(
  "/my-small-group",
  requireCapability("smallgroup:lead"),
  memberController.getMySmallGroupMembers
);

router.get(
  "/my-small-group/:id",
  requireCapability("smallgroup:lead"),
  memberIdValidator,
  validateRequest,
  memberController.getMySmallGroupMemberById
);

/**
 * Ministry Leader routes (unchanged).
 * Role 4 can access only members assigned to active ministries
 * that the authenticated leader actively leads.
 */
router.get(
  "/my-ministry",
  roleMiddleware(ROLE_IDS.MINISTRY_LEADER),
  ministryMemberController.getMyMinistryMembers
);

router.get(
  "/my-ministry/:id",
  roleMiddleware(ROLE_IDS.MINISTRY_LEADER),
  memberIdValidator,
  validateRequest,
  ministryMemberController.getMyMinistryMemberById
);

router.put(
  "/my-ministry/:id",
  roleMiddleware(ROLE_IDS.MINISTRY_LEADER),
  uploadProfileImage.single("profileImage"),
  memberIdValidator,
  updateMemberValidator,
  validateRequest,
  ministryMemberController.updateMyMinistryMember
);

/**
 * Fellowship management routes.
 *
 * Open to people who manage at least one campus fellowship (capability
 * "fellowship:manage"): Super Admin, Fellowship Admin and Staff (in the
 * fellowships assigned to them) and Main Leaders (their own fellowship).
 *
 * The controllers then check, member by member, that the fellowship is one
 * the person manages.
 */
const canManageFellowship = requireCapability("fellowship:manage");

router.post(
  "/",
  canManageFellowship,
  uploadProfileImage.single("profileImage"),
  createMemberValidator,
  validateRequest,
  memberController.createMember
);

router.get(
  "/",
  canManageFellowship,
  memberController.getAllMembers
);

router.get(
  "/:id",
  canManageFellowship,
  memberIdValidator,
  validateRequest,
  memberController.getMemberById
);

router.put(
  "/:id",
  canManageFellowship,
  uploadProfileImage.single("profileImage"),
  updateMemberValidator,
  validateRequest,
  memberController.updateMember
);

router.delete(
  "/:id",
  canManageFellowship,
  memberIdValidator,
  validateRequest,
  memberController.deleteMember
);

module.exports = router;
