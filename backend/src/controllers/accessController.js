const { successResponse } = require("../utils/response");

/**
 * GET /api/me
 *
 * Tells the web app (and later the mobile app) who the signed-in person is
 * and what they may do: their roles, the fellowships they manage, their
 * positions (small group, ministry, General Fellowship) and capabilities.
 *
 * The apps build their menus from this answer, so the permission rules stay
 * in one place (the backend) for both.
 *
 * Needs authMiddleware and loadAccess before it.
 */
const getMe = (req, res) => {
  const {
    user,
    roleId,
    roleName,
    roleLabel,
    roles,
    isSuperAdmin,
    member,
    scope,
    positions,
    capabilities,
  } = req.access;

  return successResponse(
    res,
    "Access retrieved successfully",
    {
      user,
      roleId,
      roleName,
      roleLabel,
      roles,
      isSuperAdmin,
      member,
      scope,
      positions,
      capabilities,
    },
    200
  );
};

module.exports = { getMe };
