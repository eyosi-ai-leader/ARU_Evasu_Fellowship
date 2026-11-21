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

// A campus a person can be placed in: an active campus fellowship that the
// requester manages (a Super Admin may pick any).
const assertPlaceableCampus = async (conn, access, campusId) => {
  const [found] = await loadFellowships(conn, [campusId]);

  if (!found || found.fellowship_type !== "regular") {
    throw httpError("Choose a valid campus.", 400);
  }

  if (!access.isSuperAdmin && !canManageCampus(access, campusId)) {
    throw httpError("You can only choose a campus you manage.", 403);
  }

  return Number(campusId);
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
      campusMode: "member", // the campus the member belongs to
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
        campusMode: "many", // all campuses or a chosen list
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
 *                      (a member with no campus is placed in the chosen one)
 *  Fellowship Admin -> exactly one campus (Super Admin only)
 *  Staff            -> full-time servants are not students: their campus and
 *                      student details are removed, and they serve all
 *                      campuses or a chosen list (Super Admin only)
 *  Super Admin      -> everything (Super Admin only)
 *  Member           -> no admin access; a member with no campus (for example
 *                      someone who was Staff) must be placed in one
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
    const hasCampus =
      target.fellowship_id !== null && target.fellowship_id !== undefined;

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

    // People with no campus (Staff) belong to no campus manager.
    if (
      !access.isSuperAdmin &&
      (!hasCampus || !canManageCampus(access, target.fellowship_id))
    ) {
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
    const requested = toIds(input.fellowshipIds);

    let accessFellowshipIds = []; // what Fellowship Admin / Staff manage
    let memberCampusId = hasCampus ? Number(target.fellowship_id) : null;
    let clearCampus = false;

    if (newRoleId === ROLE_IDS.MAIN_LEADER) {
      if (target.member_status !== "Active") {
        throw httpError(
          "Activate this member before making them a Main Leader.",
          400
        );
      }

      if (requested.length !== 1) {
        throw httpError("Choose the campus this Main Leader will lead.", 400);
      }

      if (hasCampus) {
        if (requested[0] !== Number(target.fellowship_id)) {
          throw httpError(
            "A Main Leader leads the campus they belong to. To lead another campus, move the member to that campus first.",
            400
          );
        }
      } else {
        memberCampusId = await assertPlaceableCampus(
          conn,
          access,
          requested[0]
        );
      }
    }

    if (newRoleId === ROLE_IDS.MEMBER && !hasCampus) {
      if (requested.length !== 1) {
        throw httpError("Choose the campus this member belongs to.", 400);
      }

      memberCampusId = await assertPlaceableCampus(conn, access, requested[0]);
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

      // An administrator with no campus is placed in the one they run.
      if (!hasCampus) memberCampusId = requested[0];
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

      // Staff are not students and belong to no campus. Positions that
      // belong to a campus must be handed over first.
      const [overseer] = await conn.execute(
        `
          SELECT 1 FROM small_group_leaders
          WHERE member_id = ? AND status = 'Active'
          LIMIT 1
        `,
        [target.member_id]
      );

      if (overseer.length > 0) {
        throw httpError(
          "This member oversees a small group. Change the overseer first, then make them Staff.",
          409
        );
      }

      const [ministryLeader] = await conn.execute(
        `
          SELECT 1 FROM ministry_members
          WHERE member_id = ?
            AND assignment_role = 'Ministry Leader'
            AND status = 'Active'
          LIMIT 1
        `,
        [target.member_id]
      );

      if (ministryLeader.length > 0) {
        throw httpError(
          "This member leads a ministry. Change the ministry leader first, then make them Staff.",
          409
        );
      }

      clearCampus = true;
      memberCampusId = null;
    }

    // ---------- save ----------
    await conn.execute(
      "UPDATE users SET role_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newRoleId, target.user_id]
    );

    if (clearCampus) {
      // Not a student: no campus, small group, family or student details.
      await conn.execute("DELETE FROM family_members WHERE member_id = ?", [
        target.member_id,
      ]);

      await conn.execute(
        `
          UPDATE members
          SET fellowship_id = NULL,
              small_group_id = NULL,
              department_id = NULL,
              student_id = NULL,
              entry_year = NULL,
              graduation_year = NULL
          WHERE id = ?
        `,
        [target.member_id]
      );
    } else if (!hasCampus && memberCampusId) {
      await conn.execute("UPDATE members SET fellowship_id = ? WHERE id = ?", [
        memberCampusId,
        target.member_id,
      ]);
    }

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

    // Main Leaders are also listed in fellowship_leaders (campus leaders,
    // General Fellowship). Leaving the role ends every leadership row.
    if (newRoleId === ROLE_IDS.MAIN_LEADER) {
      await conn.execute(
        `
          INSERT INTO fellowship_leaders
            (fellowship_id, member_id, status, started_at)
          VALUES (?, ?, 'Active', CURDATE())
          ON DUPLICATE KEY UPDATE status = 'Active', ended_at = NULL
        `,
        [memberCampusId, target.member_id]
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
      memberCampusId,
      fellowshipIds:
        newRoleId === ROLE_IDS.MAIN_LEADER
          ? [memberCampusId]
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