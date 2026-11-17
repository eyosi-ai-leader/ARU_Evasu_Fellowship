const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { loadAccess } = require("../middleware/accessMiddleware");
const { getMe } = require("../controllers/accessController");

/**
 * GET /api/me
 * Who am I and what can I do? (used by the web and mobile apps)
 */
router.get("/", authMiddleware, loadAccess, getMe);

module.exports = router;
