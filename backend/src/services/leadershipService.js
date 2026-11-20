const db = require("../config/db");

const {
  ROLE_IDS,
  ROLE_LABELS,
  isPrivilegedRole,
  getAccessLevelForRole,
} = require("../constants/roles");

const {
  httpError,
  getManagedCampusIds,
  canManageCampus,
} = require("../utils/accessScope");

// Roles that can be given through the role form.
// Small Group Leader and Ministry Leader are positions, set on the
// small group / ministry itself.
const ASSIGNABLE = [
  ROLE_IDS.SUPER_ADMIN,
  ROLE_IDS.MAIN_LEADER,
  ROLE_IDS.MEMBER,
  ROLE_IDS.FELLOWSHIP_ADMIN,
  ROLE_IDS.STAFF,
];

const toIds = (value) => [
  ...new Set(
    (Array.isArray(value) ? value : [])
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0)
  ),
];

const loadFellowships = async (conn, ids) => {
  if (ids.length === 0) return [];

  const [rows] = await conn.query(
    `
      SELECT id, name, fellowship_type
      FROM fellowships
      WHERE id IN (?) AND status = 'Active'
    `,
    [ids]
  );

  return rows;
};

/**
 * What the requester may assign, and the campuses they can pick from.
 * The form is built from this, so people never see options they can't use.
 */
const getOptions = async (access) => {
  const campusIds = access.isSuperAdmin
    ? access.scope.fellowshipIds
    : getManagedCampusIds(access);

  const [campuses] =
    campusIds.length > 0
      ? await db.query(
          `
            SELECT id, name, code, fellowship_type AS type
            FROM fellowships
            WHERE id IN (?) AND status = 'Active'
            ORDER BY id ASC
          `,
          [campusIds]
        )
      : [[]];

  const roles = [
    {
      id: ROLE_IDS.MEMBER,
      label: ROLE_LABELS[ROLE_IDS.MEMBER],
      campusMode: "none",
    },
    {
      id: ROLE_IDS.MAIN_LEADER,
      label: ROLE_LABELS[ROLE_IDS.MAIN_LEADER],
      campusMode: "member", // the campus the member already belongs to
    },
  ];

  if (access.isSuperAdmin) {
    roles.push(
      {
        id: ROLE_IDS.FELLOWSHIP_ADMIN,
        label: ROLE_LABELS[ROLE_IDS.FELLOWSHIP_ADMIN],
        campusMode: "one",
      },
      {
        id: ROLE_IDS.STAFF,
        label: ROLE_LABELS[ROLE_IDS.STAFF],
        campusMode: "many", // or all campuses
      },
      {
        id: ROLE_IDS.SUPER_ADMIN,
        label: ROLE_LABELS[ROLE_IDS.SUPER_ADMIN],
        campusMode: "none",
      }
    );
  }

  return { roles, campuses };
};

/**
 * Give a member a role, with the campus rules:
 *
 *  Main Leader      -> leads the campus the member belongs to
 *  Fellowship Admin -> exactly one campus (Super Admin only)
 *  Staff            -> all campuses or a chosen list (Super Admin only)
 *  Super Admin      -> everything (Super Admin only)
 *  Member           -> no campus; removes any admin/staff access
 *
 * Everyone except a Super Admin can only change people of their own campus.
 */
const assignRole = async (access, memberId, input) => {
  const newRoleId = Number(input.roleId);

  if (!ASSIGNABLE.includes(newRoleId)) {
    throw httpError(
      "Small Group Leaders and Ministry Leaders are chosen on their small group or ministry, not here.",
      400
    );
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `
        SELECT
          m.id AS member_id,
          m.user_id,
          m.fellowship_id,
          m.status AS member_status,
          u.role_id,
          u.first_name,
          u.last_name
        FROM members m
        INNER JOIN users u ON u.id = m.user_id
        WHERE m.id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [memberId]
    );

    const target = rows[0];

    if (!target) throw httpError("Member not found.", 404);

    const oldRoleId = Number(target.role_id);

    if (target.user_id === access.user.id) {
      throw httpError("You can't change your own role.", 400);
    }

    if (
      (isPrivilegedRole(newRoleId) || isPrivilegedRole(oldRoleId)) &&
      !access.isSuperAdmin
    ) {
      throw httpError(
        "Only a Super Admin can give or change Super Admin, Fellowship Admin and Staff roles.",
        403
      );
    }

    if (!access.isSuperAdmin && !canManageCampus(access, target.fellowship_id)) {
      throw httpError(
        "You can only change roles of members in your own campus.",
        403
      );
    }

    // Never leave the system without a Super Admin.
    if (oldRoleId === ROLE_IDS.SUPER_ADMIN && newRoleId !== oldRoleId) {
      const [[{ total }]] = await conn.query(
        "SELECT COUNT(*) AS total FROM users WHERE role_id = ? FOR UPDATE",
        [ROLE_IDS.SUPER_ADMIN]
      );

      if (Number(total) <= 1) {
        throw httpError(
          "This is the only Super Admin. Make someone else a Super Admin first.",
          409
        );
      }
    }

    // ---------- campus rules per role ----------
    let accessFellowshipIds = [];
    const requested = toIds(input.fellowshipIds);

    if (newRoleId === ROLE_IDS.MAIN_LEADER) {
      if (target.member_status !== "Active") {
        throw httpError("Activate this member before making them a Main Leader.", 400);
      }

      if (
        requested.length !== 1 ||
        requested[0] !== Number(target.fellowship_id)
      ) {
        throw httpError(
          "A Main Leader leads the campus they belong to. To lead another campus, move the member to that campus first.",
          400
        );
      }
    }

    if (newRoleId === ROLE_IDS.FELLOWSHIP_ADMIN) {
      const found = await loadFellowships(conn, requested);

      if (
        requested.length !== 1 ||
        found.length !== 1 ||
        found[0].fellowship_type !== "regular"
      ) {
        throw httpError("Choose exactly one campus for a Fellowship Admin.", 400);
      }

      accessFellowshipIds = requested;
    }

    if (newRoleId === ROLE_IDS.STAFF) {
      if (input.allCampuses) {
        const [all] = await conn.query(
          "SELECT id FROM fellowships WHERE status = 'Active'"
        );

        accessFellowshipIds = all.map((row) => Number(row.id));
      } else {
        const found = await loadFellowships(conn, requested);

        if (requested.length === 0 || found.length !== requested.length) {
          throw httpError(
            'Choose "All campuses" or at least one valid campus for Staff.',
            400
          );
        }

        accessFellowshipIds = requested;
      }
    }

    // ---------- save ----------
    await conn.execute(
      "UPDATE users SET role_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newRoleId, target.user_id]
    );

    // Access rows always match the new role.
    await conn.execute(
      "DELETE FROM user_fellowship_access WHERE user_id = ?",
      [target.user_id]
    );

    const level = getAccessLevelForRole(newRoleId);

    if (level && accessFellowshipIds.length > 0) {
      await conn.query(
        `
          INSERT INTO user_fellowship_access
            (user_id, fellowship_id, access_level, created_by)
          VALUES ?
        `,
        [
          accessFellowshipIds.map((fellowshipId) => [
            target.user_id,
            fellowshipId,
            level,
            access.user.id,
          ]),
        ]
      );
    }

    // Main Leaders are also listed in fellowship_leaders (campus leaders page,
    // General Fellowship). Leaving the role ends every leadership row.
    // This runs AFTER the member (target) and the old role are known.
    if (newRoleId === ROLE_IDS.MAIN_LEADER) {
      await conn.execute(
        `
          INSERT INTO fellowship_leaders
            (fellowship_id, member_id, status, started_at)
          VALUES (?, ?, 'Active', CURDATE())
          ON DUPLICATE KEY UPDATE status = 'Active', ended_at = NULL
        `,
        [target.fellowship_id, target.member_id]
      );
    } else if (oldRoleId === ROLE_IDS.MAIN_LEADER) {
      await conn.execute(
        `
          UPDATE fellowship_leaders
          SET status = 'Inactive', ended_at = CURDATE()
          WHERE member_id = ? AND status = 'Active'
        `,
        [target.member_id]
      );
    }

    await conn.commit();

    return {
      memberId: Number(target.member_id),
      roleId: newRoleId,
      roleLabel: ROLE_LABELS[newRoleId],
      fellowshipIds:
        newRoleId === ROLE_IDS.MAIN_LEADER
          ? [Number(target.fellowship_id)]
          : accessFellowshipIds,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  getOptions,
  assignRole,
};