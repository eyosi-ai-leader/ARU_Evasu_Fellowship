const db = require("../config/db");

// member statuses that must NOT be allowed to sign in (lowercase)
const BLOCKED_MEMBER_STATUSES = ["inactive"];

/*
 * Reads the real, current status from the database.
 * Inactive if users.is_active = 0 OR members.status = "Inactive".
 */
const checkAccountActive = async (userId) => {
  const [rows] = await db.execute(
    `
      SELECT u.is_active, m.status AS member_status
      FROM users u
      LEFT JOIN members m ON m.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId]
  );

  if (!rows[0]) return { exists: false, active: false };

  const { is_active: isActive, member_status: memberStatus } = rows[0];

  const userOff =
    isActive !== null && isActive !== undefined && Number(isActive) === 0;

  const memberOff = BLOCKED_MEMBER_STATUSES.includes(
    String(memberStatus || "").trim().toLowerCase()
  );

  return { exists: true, active: !(userOff || memberOff) };
};

/*
 * The error the frontend recognises (code ACCOUNT_INACTIVE) so it can
 * show the gentle "please contact your fellowship admin" message.
 */
const inactiveAccountError = (user) => {
  const error = new Error(
    "Your account is inactive. Please contact your fellowship admin or main leaders."
  );

  error.statusCode = 403;
  error.code = "ACCOUNT_INACTIVE";
  error.data = {
    firstName: user.first_name || user.firstName || "",
    email: user.email || "",
  };

  return error;
};

const assertAccountActive = async (user) => {
  const state = await checkAccountActive(user.id);

  if (state.exists && !state.active) {
    throw inactiveAccountError(user);
  }
};

module.exports = {
  checkAccountActive,
  inactiveAccountError,
  assertAccountActive,
};