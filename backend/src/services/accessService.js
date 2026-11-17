const db = require("../config/db");

/**
 * Role ids (users.role_id). The account type of a person.
 */
const ROLE_IDS = {
  SUPER_ADMIN: 1,
  MAIN_LEADER: 2,
  SMALL_GROUP_LEADER: 3,
  MINISTRY_LEADER: 4,
  MEMBER: 5,
  FELLOWSHIP_ADMIN: 6,
  STAFF: 7,
};

/**
 * Names shown to people (the same labels the web and mobile apps use).
 */
const ROLE_LABELS = {
  [ROLE_IDS.SUPER_ADMIN]: "Super Admin",
  [ROLE_IDS.MAIN_LEADER]: "Main Leader",
  [ROLE_IDS.SMALL_GROUP_LEADER]: "Small Group Leader",
  [ROLE_IDS.MINISTRY_LEADER]: "Ministry Leader",
  [ROLE_IDS.MEMBER]: "Member",
  [ROLE_IDS.FELLOWSHIP_ADMIN]: "Fellowship Admin",
  [ROLE_IDS.STAFF]: "Staff",
};

/**
 * Work out everything a person is allowed to be and do.
 *
 * One person can hold many roles at once. Two things are combined:
 *
 *  1. The ROLE (users.role_id): the type of account.
 *     Super Admin, Fellowship Admin and Staff decide WHICH fellowships a
 *     person can manage (Staff and Fellowship Admin through
 *     user_fellowship_access).
 *
 *  2. POSITIONS, read from the data and never typed in by hand:
 *     - leads a small group          (small_groups.leader_member_id)
 *     - leads a ministry             (ministry_members.assignment_role)
 *     - is a main leader             (fellowship_leaders)
 *     - is a General Main Leader     (fellowship_leaders of the General row)
 *
 * What the person can do is the UNION of both, so a Member who leads a
 * small group gets small group access without any role change.
 *
 * Returns null when the user does not exist.
 */
const getAccessContext = async (userId) => {
  const [userRows] = await db.execute(
    `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role_id,
        u.is_active,
        r.name AS role_name,
        m.id AS member_id,
        m.status AS member_status,
        m.fellowship_id AS member_fellowship_id,
        f.name AS member_fellowship_name,
        f.code AS member_fellowship_code
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      LEFT JOIN members m ON m.user_id = u.id
      LEFT JOIN fellowships f ON f.id = m.fellowship_id
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId]
  );

  const row = userRows[0];

  if (!row) {
    return null;
  }

  const roleId = Number(row.role_id);
  const memberId = row.member_id ? Number(row.member_id) : null;
  const ownFellowshipId = row.member_fellowship_id
    ? Number(row.member_fellowship_id)
    : null;

  const [fellowships] = await db.execute(
    `
      SELECT id, name, code, fellowship_type
      FROM fellowships
      WHERE status = 'Active'
      ORDER BY id
    `
  );

  const generalFellowship =
    fellowships.find((f) => f.fellowship_type === "general") || null;

  const regularIds = fellowships
    .filter((f) => f.fellowship_type === "regular")
    .map((f) => Number(f.id));

  const [accessRows] = await db.execute(
    `
      SELECT fellowship_id, access_level
      FROM user_fellowship_access
      WHERE user_id = ?
    `,
    [userId]
  );

  /*
   * Positions (only a person who is a member can hold any).
   */
  let smallGroups = [];
  let ministries = [];
  let leaderRows = [];

  if (memberId) {
    [[smallGroups], [ministries], [leaderRows]] = await Promise.all([
      db.execute(
        `
          SELECT id, name, fellowship_id
          FROM small_groups
          WHERE leader_member_id = ?
            AND status = 'Active'
        `,
        [memberId]
      ),
      db.execute(
        `
          SELECT
            mm.ministry_id AS id,
            mi.name,
            mi.fellowship_id,
            mm.assignment_role
          FROM ministry_members mm
          INNER JOIN ministries mi ON mi.id = mm.ministry_id
          WHERE mm.member_id = ?
            AND mm.status = 'Active'
            AND mi.status = 'Active'
        `,
        [memberId]
      ),
      db.execute(
        `
          SELECT fellowship_id
          FROM fellowship_leaders
          WHERE member_id = ?
            AND status = 'Active'
        `,
        [memberId]
      ),
    ]);
  }

  /*
   * Which fellowships this person MANAGES (admin-like access).
   */
  let manageIds = [];
  const isSuperAdmin = roleId === ROLE_IDS.SUPER_ADMIN;

  if (isSuperAdmin) {
    manageIds = fellowships.map((f) => Number(f.id));
  } else if (roleId === ROLE_IDS.FELLOWSHIP_ADMIN) {
    manageIds = accessRows
      .filter((a) => a.access_level === "admin")
      .map((a) => Number(a.fellowship_id));
  } else if (roleId === ROLE_IDS.STAFF) {
    manageIds = accessRows
      .filter((a) => a.access_level === "staff")
      .map((a) => Number(a.fellowship_id));
  } else if (roleId === ROLE_IDS.MAIN_LEADER && ownFellowshipId) {
    manageIds = [ownFellowshipId];
  }

  manageIds = [...new Set(manageIds)].sort((a, b) => a - b);

  const manageMemberFellowshipIds = manageIds.filter((id) =>
    regularIds.includes(id)
  );

  const leaderFellowshipIds = [
    ...new Set(leaderRows.map((l) => Number(l.fellowship_id))),
  ];

  const generalId = generalFellowship ? Number(generalFellowship.id) : null;

  const isGeneralLeader =
    generalId !== null && leaderFellowshipIds.includes(generalId);

  const canManageGeneral =
    generalId !== null &&
    (manageIds.includes(generalId) || isGeneralLeader);

  const ministriesLed = ministries.filter(
    (m) => m.assignment_role === "Ministry Leader"
  );

  /*
   * Capabilities: what the apps use to decide which menus to show.
   */
  const capabilities = new Set(["profile:own", "general:view"]);

  if (manageMemberFellowshipIds.length > 0) {
    capabilities.add("fellowship:manage");
  }

  if (isSuperAdmin) {
    capabilities.add("system:manage");
  }

  if (smallGroups.length > 0) {
    capabilities.add("smallgroup:lead");
  }

  if (ministriesLed.length > 0 || roleId === ROLE_IDS.MINISTRY_LEADER) {
    capabilities.add("ministry:lead");
  }

  if (canManageGeneral) {
    capabilities.add("general:manage");
  }

  /*
   * Every role this person holds, as names for the screen.
   */
  const roleNames = [ROLE_LABELS[roleId] || "Member"];

  if (smallGroups.length > 0) {
    roleNames.push(ROLE_LABELS[ROLE_IDS.SMALL_GROUP_LEADER]);
  }

  if (ministriesLed.length > 0) {
    roleNames.push(ROLE_LABELS[ROLE_IDS.MINISTRY_LEADER]);
  }

  if (isGeneralLeader) {
    roleNames.push("General Main Leader");
  }

  return {
    user: {
      id: Number(row.id),
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
    },

    isActive: row.is_active !== 0,

    roleId,
    roleName: row.role_name,
    roleLabel: ROLE_LABELS[roleId] || "Member",
    roles: [...new Set(roleNames)],
    isSuperAdmin,

    member: memberId
      ? {
          id: memberId,
          status: row.member_status,
          fellowshipId: ownFellowshipId,
          fellowshipName: row.member_fellowship_name,
          fellowshipCode: row.member_fellowship_code,
        }
      : null,

    scope: {
      all: isSuperAdmin,
      fellowshipIds: manageIds,
      memberFellowshipIds: manageMemberFellowshipIds,
    },

    positions: {
      smallGroups: smallGroups.map((g) => ({
        id: Number(g.id),
        name: g.name,
        fellowshipId: Number(g.fellowship_id),
      })),
      ministriesLed: ministriesLed.map((m) => ({
        id: Number(m.id),
        name: m.name,
        fellowshipId: Number(m.fellowship_id),
      })),
      ministries: ministries.map((m) => ({
        id: Number(m.id),
        name: m.name,
        fellowshipId: Number(m.fellowship_id),
        assignmentRole: m.assignment_role,
      })),
      leaderOf: leaderFellowshipIds.filter((id) => id !== generalId),
      generalLeader: isGeneralLeader,
    },

    capabilities: [...capabilities],
  };
};

/**
 * Can this person manage the given fellowship?
 */
const canManageFellowship = (access, fellowshipId) =>
  Boolean(
    access &&
      (access.scope.all ||
        access.scope.fellowshipIds.includes(Number(fellowshipId)))
  );

module.exports = {
  ROLE_IDS,
  ROLE_LABELS,
  getAccessContext,
  canManageFellowship,
};