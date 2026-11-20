const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  loadAccess,
  requireCapability,
} = require("../middleware/accessMiddleware");

const controller = require("../controllers/leadershipController");

const {
  setRoleValidator,
} = require("../validators/leadershipValidator");

// Super Admin, Staff, Fellowship Admin and Main Leader.
// The service then limits each person to their own campus.
router.use(authMiddleware, loadAccess, requireCapability("fellowship:manage"));

router.get("/options", controller.getOptions);

router.put("/members/:memberId/role", setRoleValidator, controller.setRole);



module.exports = router;