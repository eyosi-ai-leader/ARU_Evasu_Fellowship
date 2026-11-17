const { getAccessContext } = require("../services/accessService");

/**
 * Load what the signed-in person is allowed to be and do.
 *
 * Runs AFTER authMiddleware. The result is read fresh from the database on
 * every request, so a role, a staff assignment or a small group leadership
 * that was just changed takes effect immediately, not when the token expires.
 *
 * Adds req.access (see services/accessService.js).
 */
const loadAccess = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const access = await getAccessContext(req.user.id);

    if (!access) {
      return res.status(401).json({
        success: false,
        message: "Account not found",
      });
    }

    if (!access.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    req.access = access;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Allow the request only if the person has at least one of the capabilities.
 * Use after loadAccess.
 *
 *   router.get("/", authMiddleware, loadAccess,
 *     requireCapability("fellowship:manage", "smallgroup:lead"), handler);
 */
const requireCapability =
  (...capabilities) =>
  (req, res, next) => {
    if (!req.access) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const allowed = capabilities.some((capability) =>
      req.access.capabilities.includes(capability)
    );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions",
      });
    }

    next();
  };

module.exports = {
  loadAccess,
  requireCapability,
};