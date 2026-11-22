const db = require("../config/db");

const { ROLE_LABELS } = require("../constants/roles");

const num = (value) => Number(value || 0);

const emptyStats = {
  total: 0,
  active: 0,
  inactive: 0,
  newToday: 0,
};

/*
 * Every function that takes campusIds expects a NON-empty list
 * (the service never calls them with an empty one).
 */

async function getMemberStats(campusIds) {
  const [rows] = await db.query(
    `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) AS inactive,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS newToday
      FROM members
      WHERE fellowship_id IN (?)
    `,
    [campusIds]
  );

  const row = rows[0];

  if (!row) return emptyStats;

  return {
    total: num(row.total),
    active: num(row.active),
    inactive: num(row.inactive),
    newToday: num(row.newToday),
  };
}

async function getCampusBreakdown(managedIds) {
  const [rows] = await db.query(
    `
      SELECT
        f.id,
        f.name,
        f.code,
        COUNT(m.id) AS total,
        SUM(CASE WHEN m.status = 'Active' THEN 1 ELSE 0 END) AS active
      FROM fellowships f
      LEFT JOIN members m ON m.fellowship_id = f.id
      WHERE f.id IN (?)
      GROUP BY f.id, f.name, f.code
      ORDER BY f.id ASC
    `,
    [managedIds]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    total: num(row.total),
    active: num(row.active),
  }));
}

async function getStructureCounts(campusIds) {
  const [rows] = await db.query(
    `
      SELECT
        (
          SELECT COUNT(*) FROM small_groups
          WHERE fellowship_id IN (?) AND status = 'Active'
        ) AS smallGroups,
        (
          SELECT COUNT(*) FROM small_groups sg
          WHERE sg.fellowship_id IN (?) AND sg.status = 'Active'
            AND NOT EXISTS (
              SELECT 1 FROM small_group_leaders l
              WHERE l.small_group_id = sg.id AND l.status = 'Active'
            )
        ) AS smallGroupsWithoutLeader,
        (
          SELECT COUNT(*) FROM families
          WHERE fellowship_id IN (?) AND status = 'Active'
        ) AS families,
        (
          SELECT COUNT(*) FROM members m
          WHERE m.fellowship_id IN (?) AND m.status = 'Active'
            AND NOT EXISTS (
              SELECT 1 FROM small_group_members sgm WHERE sgm.member_id = m.id
            )
        ) AS membersWithoutSmallGroup,
        (
          SELECT COUNT(*) FROM ministries
          WHERE fellowship_id IN (?) AND status = 'Active'
        ) AS ministries
    `,
    [campusIds, campusIds, campusIds, campusIds, campusIds]
  );

  const row = rows[0] || {};

  return {
    smallGroups: num(row.smallGroups),
    smallGroupsWithoutLeader: num(row.smallGroupsWithoutLeader),
    families: num(row.families),
    membersWithoutSmallGroup: num(row.membersWithoutSmallGroup),
    ministries: num(row.ministries),
  };
}

/*
 * People per role. Super Admin looking at everything sees every account.
 * Everyone else sees only people of the campus(es) in view: members of
 * those campuses, plus Fellowship Admins and Staff assigned to them.
 */
async function getRoleDistribution(campusIds, unfiltered) {
  const [rows] = unfiltered
    ? await db.query(`
        SELECT r.id AS roleId, r.name AS roleName, COUNT(u.id) AS total
        FROM roles r
        LEFT JOIN users u ON u.role_id = r.id
        GROUP BY r.id, r.name
        ORDER BY r.id ASC
      `)
    : await db.query(
        `
          SELECT r.id AS roleId, r.name AS roleName, COUNT(DISTINCT u.id) AS total
          FROM roles r
          LEFT JOIN users u
            ON u.role_id = r.id
           AND (
             EXISTS (
               SELECT 1 FROM members m
               WHERE m.user_id = u.id AND m.fellowship_id IN (?)
             )
             OR EXISTS (
               SELECT 1 FROM user_fellowship_access a
               WHERE a.user_id = u.id AND a.fellowship_id IN (?)
             )
           )
          GROUP BY r.id, r.name
          ORDER BY r.id ASC
        `,
        [campusIds, campusIds]
      );

  return rows.map((row) => ({
    roleId: row.roleId,
    roleName: ROLE_LABELS[row.roleId] || row.roleName,
    total: num(row.total),
  }));
}

async function getRecentMembers(campusIds) {
  const [rows] = await db.query(
    `
      SELECT
        m.id,
        u.first_name,
        u.last_name,
        f.name AS fellowshipName,
        m.created_at AS createdAt
      FROM members m
      INNER JOIN users u ON u.id = m.user_id
      INNER JOIN fellowships f ON f.id = m.fellowship_id
      WHERE m.fellowship_id IN (?)
      ORDER BY m.created_at DESC
      LIMIT 5
    `,
    [campusIds]
  );

  return rows.map((row) => ({
    id: row.id,
    title: "New member registered",
    description: `${row.first_name} ${row.last_name}`,
    fellowshipName: row.fellowshipName,
    createdAt: row.createdAt,
  }));
}

async function getMemberGrowth(campusIds) {
  const [rows] = await db.query(
    `
      SELECT
        DATE_FORMAT(months.month_date, '%b') AS month,
        (
          SELECT COUNT(*)
          FROM members m
          WHERE m.fellowship_id IN (?)
            AND m.created_at < DATE_ADD(months.month_date, INTERVAL 1 MONTH)
        ) AS value
      FROM (
        SELECT
          DATE_FORMAT(
            DATE_SUB(CURDATE(), INTERVAL 7 MONTH),
            '%Y-%m-01'
          ) + INTERVAL seq.month_offset MONTH AS month_date
        FROM (
          SELECT 0 AS month_offset
          UNION ALL SELECT 1
          UNION ALL SELECT 2
          UNION ALL SELECT 3
          UNION ALL SELECT 4
          UNION ALL SELECT 5
          UNION ALL SELECT 6
          UNION ALL SELECT 7
        ) AS seq
      ) AS months
      ORDER BY months.month_date ASC
    `,
    [campusIds]
  );

  return rows.map((row) => ({
    month: row.month,
    value: num(row.value),
  }));
}

// The campuses for the campus switcher.
async function getCampuses(managedIds) {
  const [rows] = await db.query(
    `
      SELECT id, name, code
      FROM fellowships
      WHERE id IN (?)
      ORDER BY id ASC
    `,
    [managedIds]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
  }));
}

// Ministries a person leads, with their active rosters.
async function getMinistriesLed(ministryIds) {
  const [ministryRows] = await db.query(
    `
      SELECT id, name, description, status, fellowship_id
      FROM ministries
      WHERE id IN (?)
        AND status = 'Active'
      ORDER BY name ASC
    `,
    [ministryIds]
  );

  if (ministryRows.length === 0) return [];

  const [memberRows] = await db.query(
    `
      SELECT
        mm.ministry_id AS ministryId,
        m.id AS memberId,
        u.id AS userId,
        m.member_number AS memberNumber,
        u.first_name AS firstName,
        u.middle_name AS middleName,
        u.last_name AS lastName,
        u.email,
        COALESCE(m.phone, u.phone) AS phone,
        u.profile_image AS profileImage,
        m.status AS memberStatus,
        m.created_at AS memberSince,
        m.updated_at AS updatedAt,
        CASE
          WHEN m.date_of_birth IS NOT NULL
          THEN TIMESTAMPDIFF(YEAR, m.date_of_birth, CURDATE())
          ELSE NULL
        END AS age,
        mm.assignment_role AS assignmentRole,
        mm.assigned_at AS assignedAt
      FROM ministry_members mm
      INNER JOIN members m ON m.id = mm.member_id
      INNER JOIN users u ON u.id = m.user_id
      WHERE mm.ministry_id IN (?)
        AND mm.status = 'Active'
        AND m.status = 'Active'
        AND u.is_active = 1
      ORDER BY u.first_name ASC, u.last_name ASC
    `,
    [ministryRows.map((ministry) => ministry.id)]
  );

  const byMinistry = new Map();

  for (const member of memberRows) {
    const list = byMinistry.get(member.ministryId) || [];

    list.push({
      id: member.memberId,
      userId: member.userId,
      memberNumber: member.memberNumber,
      firstName: member.firstName,
      middleName: member.middleName,
      lastName: member.lastName,
      fullName: [member.firstName, member.middleName, member.lastName]
        .filter(Boolean)
        .join(" "),
      email: member.email,
      phone: member.phone,
      profileImage: member.profileImage,
      age:
        member.age === null || member.age === undefined
          ? null
          : Number(member.age),
      status: member.memberStatus,
      memberSince: member.memberSince,
      updatedAt: member.updatedAt,
      assignmentRole: member.assignmentRole,
      assignedAt: member.assignedAt,
    });

    byMinistry.set(member.ministryId, list);
  }

  return ministryRows.map((ministry) => {
    const members = byMinistry.get(ministry.id) || [];

    return {
      id: ministry.id,
      name: ministry.name,
      description: ministry.description,
      status: ministry.status,
      fellowshipId: ministry.fellowship_id,
      memberCount: members.length,
      members,
    };
  });
}

// The signed-in person's own member profile.
async function getOwnMember(userId) {
  const [rows] = await db.query(
    `
      SELECT
        m.id,
        m.user_id,
        m.member_number,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.email,
        u.role_id,
        r.name AS role_name,
        u.phone AS user_phone,
        u.profile_image,
        m.gender,
        m.phone,
        m.date_of_birth,
        m.baptism_date,
        m.address,
        m.status,
        m.created_at,
        m.updated_at
      FROM members m
      INNER JOIN users u ON m.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE m.user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  const member = rows[0];

  if (!member) return null;

  return {
    id: member.id,
    userId: member.user_id,
    memberNumber: member.member_number,
    firstName: member.first_name,
    middleName: member.middle_name,
    lastName: member.last_name,
    email: member.email,
    roleId: member.role_id,
    roleName: ROLE_LABELS[member.role_id] || member.role_name,
    phone: member.phone || member.user_phone || null,
    profileImage: member.profile_image,
    gender: member.gender,
    dateOfBirth: member.date_of_birth,
    baptismDate: member.baptism_date,
    address: member.address,
    status: member.status,
    memberSince: member.created_at,
    updatedAt: member.updated_at,
  };
}


// Small groups a person oversees, with family numbers.
async function getSmallGroupsLed(groupIds) {
  const [rows] = await db.query(
    `
      SELECT
        sg.id,
        sg.name,
        sg.fellowship_id,
        (
          SELECT COUNT(*) FROM families f
          WHERE f.small_group_id = sg.id AND f.status = 'Active'
        ) AS familyCount,
        (
          SELECT COUNT(*)
          FROM small_group_members sgm
          INNER JOIN members m ON m.id = sgm.member_id
          WHERE sgm.small_group_id = sg.id AND m.status = 'Active'
        ) AS memberCount,
        (
          SELECT COUNT(*)
          FROM small_group_members sgm
          INNER JOIN members m ON m.id = sgm.member_id
          WHERE sgm.small_group_id = sg.id
            AND m.status = 'Active'
            AND NOT EXISTS (
              SELECT 1
              FROM family_members fm
              INNER JOIN families fa ON fa.id = fm.family_id
              WHERE fm.member_id = sgm.member_id
                AND fa.small_group_id = sg.id
            )
        ) AS withoutFamily,
        (
          SELECT COUNT(*) FROM families f
          WHERE f.small_group_id = sg.id
            AND f.status = 'Active'
            AND NOT EXISTS (
              SELECT 1 FROM family_members fm
              WHERE fm.family_id = f.id
                AND fm.family_role IN ('Father', 'Mother')
            )
        ) AS familiesWithoutParent
      FROM small_groups sg
      WHERE sg.id IN (?) AND sg.status = 'Active'
      ORDER BY sg.name ASC
    `,
    [groupIds]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    fellowshipId: row.fellowship_id,
    familyCount: num(row.familyCount),
    memberCount: num(row.memberCount),
    withoutFamily: num(row.withoutFamily),
    familiesWithoutParent: num(row.familiesWithoutParent),
  }));
}

// Where a member belongs: small groups, families and ministries.
async function getMyFellowship(memberId) {
  const [groups] = await db.execute(
    `
      SELECT sg.id, sg.name
      FROM small_group_members sgm
      INNER JOIN small_groups sg ON sg.id = sgm.small_group_id
      WHERE sgm.member_id = ? AND sg.status = 'Active'
      ORDER BY sg.name ASC
    `,
    [memberId]
  );

  let overseers = [];

  if (groups.length > 0) {
    [overseers] = await db.query(
      `
        SELECT l.small_group_id AS groupId, u.first_name, u.last_name
        FROM small_group_leaders l
        INNER JOIN members m ON m.id = l.member_id
        INNER JOIN users u ON u.id = m.user_id
        WHERE l.small_group_id IN (?) AND l.status = 'Active'
        ORDER BY u.first_name ASC
      `,
      [groups.map((group) => group.id)]
    );
  }

  const [families] = await db.execute(
    `
      SELECT
        fa.id,
        fa.name,
        sg.name AS smallGroupName,
        fm.family_role
      FROM family_members fm
      INNER JOIN families fa ON fa.id = fm.family_id AND fa.status = 'Active'
      INNER JOIN small_groups sg ON sg.id = fa.small_group_id
      WHERE fm.member_id = ?
      ORDER BY fa.name ASC
    `,
    [memberId]
  );

  let parents = [];

  if (families.length > 0) {
    [parents] = await db.query(
      `
        SELECT
          fm.family_id AS familyId,
          fm.family_role,
          u.first_name,
          u.last_name
        FROM family_members fm
        INNER JOIN members m ON m.id = fm.member_id
        INNER JOIN users u ON u.id = m.user_id
        WHERE fm.family_id IN (?) AND fm.family_role IN ('Father', 'Mother')
      `,
      [families.map((family) => family.id)]
    );
  }

  const [ministries] = await db.execute(
    `
      SELECT mi.id, mi.name, mm.assignment_role
      FROM ministry_members mm
      INNER JOIN ministries mi ON mi.id = mm.ministry_id
      WHERE mm.member_id = ?
        AND mm.status = 'Active'
        AND mi.status = 'Active'
      ORDER BY mi.name ASC
    `,
    [memberId]
  );

  const nameOf = (person) =>
    person ? [person.first_name, person.last_name].filter(Boolean).join(" ") : null;

  const parentName = (familyId, role) =>
    nameOf(
      parents.find(
        (parent) => parent.familyId === familyId && parent.family_role === role
      )
    );

  return {
    smallGroups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      overseers: overseers
        .filter((overseer) => overseer.groupId === group.id)
        .map(nameOf),
    })),
    families: families.map((family) => ({
      id: family.id,
      name: family.name,
      smallGroupName: family.smallGroupName,
      myRole: family.family_role,
      father: parentName(family.id, "Father"),
      mother: parentName(family.id, "Mother"),
    })),
    ministries: ministries.map((ministry) => ({
      id: ministry.id,
      name: ministry.name,
      role: ministry.assignment_role,
    })),
  };
}

module.exports = {
  getMemberStats,
  getCampusBreakdown,
  getStructureCounts,
  getRoleDistribution,
  getRecentMembers,
  getMemberGrowth,
  getCampuses,
  getMinistriesLed,
  getOwnMember,
  getMyFellowship,
  getSmallGroupsLed,
};