const db = require("../config/db");

const { getAccessLevelForRole } = require("../constants/roles");

/**
 * Give a Fellowship Admin or Staff member access to one fellowship.
 * If the row already exists, only its level is updated.
 */
const grant = async (
  userId,
  fellowshipId,
  accessLevel,
  createdBy = null
) => {
  await db.execute(
    `
      INSERT INTO user_fellowship_access
        (user_id, fellowship_id, access_level, created_by)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE access_level = VALUES(access_level)
    `,
    [userId, fellowshipId, accessLevel, createdBy]
  );
};

const countForUser = async (userId) => {
  const [rows] = await db.execute(
    `
      SELECT COUNT(*) AS total
      FROM user_fellowship_access
      WHERE user_id = ?
    `,
    [userId]
  );

  return Number(rows[0]?.total || 0);
};

const revokeAll = async (userId) => {
  await db.execute(
    "DELETE FROM user_fellowship_access WHERE user_id = ?",
    [userId]
  );
};

const setLevelForAll = async (userId, accessLevel) => {
  await db.execute(
    `
      UPDATE user_fellowship_access
      SET access_level = ?
      WHERE user_id = ?
    `,
    [accessLevel, userId]
  );
};

/**
 * Called when a person's ROLE changes, so their fellowship access always
 * matches the new role:
 *
 *  - becomes Fellowship Admin / Staff (from another kind of role):
 *      gets access to their own fellowship, unless they already have some;
 *  - switches between Fellowship Admin and Staff:
 *      the same fellowships stay, with the new level;
 *  - stops being Fellowship Admin / Staff:
 *      all their access rows are removed.
 */
const syncForRoleChange = async ({
  userId,
  fellowshipId,
  oldRoleId,
  newRoleId,
  createdBy = null,
}) => {
  if (Number(oldRoleId) === Number(newRoleId)) {
    return;
  }

  const oldLevel = getAccessLevelForRole(oldRoleId);
  const newLevel = getAccessLevelForRole(newRoleId);

  if (oldLevel && newLevel) {
    await setLevelForAll(userId, newLevel);
    return;
  }

  if (!oldLevel && newLevel) {
    if ((await countForUser(userId)) === 0 && fellowshipId) {
      await grant(userId, fellowshipId, newLevel, createdBy);
    }

    return;
  }

  if (oldLevel && !newLevel) {
    await revokeAll(userId);
  }
};

module.exports = {
  grant,
  countForUser,
  revokeAll,
  syncForRoleChange,
};
