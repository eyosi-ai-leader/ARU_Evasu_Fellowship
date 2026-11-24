const db = require("../config/db");
const { successResponse } = require("../utils/response");

const toCampus = (row) => ({
  id: Number(row.id),
  name: row.name,
  code: row.code,
});

/*
 * Where this person belongs and which campuses they serve, for the
 * "campus next to the role" label in the sidebar and header.
 *   own:             the campus they are a member of (null for Staff)
 *   managed:         the campuses they manage (every campus for a Super Admin)
 *   coversAll:       they serve every campus
 *   includesGeneral: they also lead the General Fellowship
 */
const loadCampus = async ({ user, scope, capabilities }) => {
  const [regular] = await db.execute(
    `
      SELECT id, name, code
      FROM fellowships
      WHERE fellowship_type = 'regular' AND status = 'Active'
      ORDER BY id
    `
  );

  const [own] = await db.execute(
    `
      SELECT f.id, f.name, f.code
      FROM members m
      INNER JOIN fellowships f ON f.id = m.fellowship_id
      WHERE m.user_id = ?
      LIMIT 1
    `,
    [user.id]
  );

  const managedIds = scope?.all
    ? regular.map((row) => Number(row.id))
    : (scope?.memberFellowshipIds || []).map(Number);

  const managed = regular
    .filter((row) => managedIds.includes(Number(row.id)))
    .map(toCampus);

  return {
    own: own[0] ? toCampus(own[0]) : null,
    managed,
    coversAll: regular.length > 0 && managed.length === regular.length,
    includesGeneral: capabilities.includes("general:manage"),
  };
};

/**
 * GET /api/me
 *
 * Tells the web app (and later the mobile app) who the signed-in person is
 * and what they may do: their roles, the fellowships they manage, their
 * positions (small group, ministry, General Fellowship), capabilities and
 * the campus they belong to or serve.
 *
 * The apps build their menus from this answer, so the permission rules stay
 * in one place (the backend) for both.
 *
 * Needs authMiddleware and loadAccess before it.
 */
const getMe = async (req, res) => {
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

  let campus = null;

  try {
    campus = await loadCampus({ user, scope, capabilities });
  } catch (error) {
    // The campus label is a nice-to-have: never break sign-in because of it.
    console.error("Campus lookup for /me failed:", error.message);
  }

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
      campus,
    },
    200
  );
};

module.exports = { getMe };