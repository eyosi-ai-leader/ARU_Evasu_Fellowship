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
       SELECT
  r.id AS roleId,
  r.name AS roleName,
  COUNT(
    DISTINCT CASE
      WHEN m.user_id IS NOT NULL OR a.user_id IS NOT NULL
      THEN u.id
    END
  ) AS total
FROM roles r
LEFT JOIN users u
  ON u.role_id = r.id
LEFT JOIN members m
  ON m.user_id = u.id
  AND m.fellowship_id IN (1, 2, 3)
LEFT JOIN user_fellowship_access a
  ON a.user_id = u.id
  AND a.fellowship_id IN (1, 2, 3)
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

// Where a member belongs: small groups, families and ministries, with details.
async function getMyFellowship(memberId) {
  const [groups] = await db.execute(
    `
      SELECT
        sg.id,
        sg.name,
        (
          SELECT COUNT(*)
          FROM small_group_members x
          INNER JOIN members mm ON mm.id = x.member_id
          WHERE x.small_group_id = sg.id AND mm.status = 'Active'
        ) AS memberCount,
        (
          SELECT COUNT(*) FROM families f
          WHERE f.small_group_id = sg.id AND f.status = 'Active'
        ) AS familyCount
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
        SELECT
          l.small_group_id AS groupId,
          u.first_name,
          u.last_name,
          COALESCE(m.phone, u.phone) AS phone
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
        fm.family_role,
        (
          SELECT COUNT(*) FROM family_members x WHERE x.family_id = fa.id
        ) AS memberCount
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
          u.last_name,
          COALESCE(m.phone, u.phone) AS phone
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
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mm.assignment_role,
        mm.assigned_at,
        (
          SELECT COUNT(*)
          FROM ministry_members x
          INNER JOIN members m2 ON m2.id = x.member_id
          WHERE x.ministry_id = mi.id
            AND x.status = 'Active'
            AND m2.status = 'Active'
        ) AS memberCount
      FROM ministry_members mm
      INNER JOIN ministries mi ON mi.id = mm.ministry_id
      WHERE mm.member_id = ?
        AND mm.status = 'Active'
        AND mi.status = 'Active'
      ORDER BY mi.name ASC
    `,
    [memberId]
  );

  let ministryLeaders = [];

  if (ministries.length > 0) {
    [ministryLeaders] = await db.query(
      `
        SELECT
          mm.ministry_id AS ministryId,
          u.first_name,
          u.last_name,
          COALESCE(m.phone, u.phone) AS phone
        FROM ministry_members mm
        INNER JOIN members m ON m.id = mm.member_id
        INNER JOIN users u ON u.id = m.user_id
        WHERE mm.ministry_id IN (?)
          AND mm.status = 'Active'
          AND mm.assignment_role = 'Ministry Leader'
        ORDER BY u.first_name ASC
      `,
      [ministries.map((ministry) => ministry.id)]
    );
  }

  const nameOf = (person) =>
    person ? [person.first_name, person.last_name].filter(Boolean).join(" ") : null;

  const contactOf = (person) => ({
    name: nameOf(person),
    phone: person.phone || null,
  });

  const parentOf = (familyId, role) =>
    parents.find(
      (parent) => parent.familyId === familyId && parent.family_role === role
    );

  return {
    smallGroups: groups.map((group) => {
      const mine = overseers.filter((o) => o.groupId === group.id);

      return {
        id: group.id,
        name: group.name,
        memberCount: num(group.memberCount),
        familyCount: num(group.familyCount),
        overseers: mine.map(nameOf),
        overseerContacts: mine.map(contactOf),
      };
    }),
    families: families.map((family) => ({
      id: family.id,
      name: family.name,
      smallGroupName: family.smallGroupName,
      myRole: family.family_role,
      memberCount: num(family.memberCount),
      father: nameOf(parentOf(family.id, "Father")),
      mother: nameOf(parentOf(family.id, "Mother")),
      fatherPhone: parentOf(family.id, "Father")?.phone || null,
      motherPhone: parentOf(family.id, "Mother")?.phone || null,
    })),
    ministries: ministries.map((ministry) => ({
      id: ministry.id,
      name: ministry.name,
      role: ministry.assignment_role,
      description: ministry.description || "",
      assignedAt: ministry.assigned_at,
      memberCount: num(ministry.memberCount),
      leaders: ministryLeaders
        .filter((leader) => leader.ministryId === ministry.id)
        .map(contactOf),
    })),
  };
}

// Announcements that reached this person's dashboard (not "email only" ones).
async function getMyAnnouncements(userId, nowStr) {
  const [rows] = await db.execute(
    `
      SELECT
        a.id,
        a.subject,
        a.message,
        a.priority,
        a.category,
        a.pinned,
        a.action_label,
        a.action_url,
        a.created_at,
        u.first_name,
        u.last_name,
        ar.read_at
      FROM announcement_recipients ar
      INNER JOIN announcements a ON a.id = ar.announcement_id
      INNER JOIN users u ON u.id = a.created_by
      WHERE ar.user_id = ?
        AND a.deleted_at IS NULL
        AND a.delivery <> 'email'
        AND a.status NOT IN ('scheduled', 'cancelled')
        AND (a.expires_at IS NULL OR a.expires_at > ?)
      ORDER BY a.pinned DESC, a.id DESC
      LIMIT 20
    `,
    [userId, nowStr]
  );

  return rows;
}

async function markAnnouncementRead(userId, announcementId) {
  await db.execute(
    `
      UPDATE announcement_recipients
      SET read_at = NOW()
      WHERE announcement_id = ? AND user_id = ? AND read_at IS NULL
    `,
    [announcementId, userId]
  );
}
// The membership details shown on the profile's Fellowship tab.
const getProfileMember = async (userId) => {
  const [rows] = await db.execute(
    `
      SELECT
        m.member_number,
        m.status,
        m.created_at,
        m.student_id,
        m.academic_status,
        m.entry_year,
        m.graduation_year,
        f.id AS fellowship_id,
        f.name AS campus_name,
        d.name AS department_name
      FROM members m
      LEFT JOIN fellowships f ON f.id = m.fellowship_id
      LEFT JOIN departments d
        ON d.fellowship_id = m.fellowship_id AND d.id = m.department_id
      WHERE m.user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
};

/* ---------- "My circle" pages: my groups, families, ministries with people ---------- */

const circlePerson = (row, role, showPhone, myMemberId) => ({
  id: row.id,
  name: [row.first_name, row.last_name].filter(Boolean).join(" "),
  profileImage: row.profile_image || null,
  role,
  extra: row.extra || null,
  phone: showPhone ? row.phone || null : null,
  isMe: Number(row.id) === Number(myMemberId),
});

const ACTIVE_PERSON = `m.status = 'Active' AND (u.is_active IS NULL OR u.is_active = 1)`;

async function getMySmallGroupCircles(memberId) {
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

  if (groups.length === 0) return [];

  const [rows] = await db.query(
    `
      SELECT
        sgm.small_group_id AS circleId,
        m.id,
        u.first_name,
        u.last_name,
        u.profile_image,
        COALESCE(m.phone, u.phone) AS phone,
        EXISTS (
          SELECT 1 FROM small_group_leaders l
          WHERE l.small_group_id = sgm.small_group_id
            AND l.member_id = m.id AND l.status = 'Active'
        ) AS isLeader,
        (
          SELECT fa.name
          FROM family_members fm
          INNER JOIN families fa
            ON fa.id = fm.family_id
           AND fa.small_group_id = sgm.small_group_id
           AND fa.status = 'Active'
          WHERE fm.member_id = m.id
          LIMIT 1
        ) AS extra
      FROM small_group_members sgm
      INNER JOIN members m ON m.id = sgm.member_id
      INNER JOIN users u ON u.id = m.user_id
      WHERE sgm.small_group_id IN (?) AND ${ACTIVE_PERSON}
      ORDER BY isLeader DESC, u.first_name ASC, u.last_name ASC
    `,
    [groups.map((group) => group.id)]
  );

  return groups.map((group) => {
    const members = rows
      .filter((row) => row.circleId === group.id)
      .map((row) =>
        circlePerson(
          row,
          Number(row.isLeader) ? "Overseer" : "Member",
          Boolean(Number(row.isLeader)),
          memberId
        )
      );

    return {
      id: group.id,
      name: group.name,
      subtitle: null,
      memberCount: members.length,
      members,
    };
  });
}

async function getMyFamilyCircles(memberId) {
  const [families] = await db.execute(
    `
      SELECT fa.id, fa.name, sg.name AS smallGroupName
      FROM family_members fm
      INNER JOIN families fa ON fa.id = fm.family_id AND fa.status = 'Active'
      INNER JOIN small_groups sg ON sg.id = fa.small_group_id
      WHERE fm.member_id = ?
      ORDER BY fa.name ASC
    `,
    [memberId]
  );

  if (families.length === 0) return [];

  const [rows] = await db.query(
    `
      SELECT
        fm.family_id AS circleId,
        fm.family_role AS role,
        m.id,
        u.first_name,
        u.last_name,
        u.profile_image,
        COALESCE(m.phone, u.phone) AS phone
      FROM family_members fm
      INNER JOIN members m ON m.id = fm.member_id
      INNER JOIN users u ON u.id = m.user_id
      WHERE fm.family_id IN (?) AND ${ACTIVE_PERSON}
      ORDER BY FIELD(fm.family_role, 'Mother', 'Father') DESC,
               u.first_name ASC, u.last_name ASC
    `,
    [families.map((family) => family.id)]
  );

  return families.map((family) => {
    const members = rows
      .filter((row) => row.circleId === family.id)
      .map((row) =>
        circlePerson(
          row,
          row.role,
          row.role === "Father" || row.role === "Mother",
          memberId
        )
      );

    return {
      id: family.id,
      name: family.name,
      subtitle: family.smallGroupName,
      memberCount: members.length,
      members,
    };
  });
}

async function getMyMinistryCircles(memberId) {
  const [ministries] = await db.execute(
    `
      SELECT mi.id, mi.name, mi.description
      FROM ministry_members mm
      INNER JOIN ministries mi ON mi.id = mm.ministry_id AND mi.status = 'Active'
      WHERE mm.member_id = ? AND mm.status = 'Active'
      ORDER BY mi.name ASC
    `,
    [memberId]
  );

  if (ministries.length === 0) return [];

  const [rows] = await db.query(
    `
      SELECT
        mm.ministry_id AS circleId,
        mm.assignment_role AS role,
        m.id,
        u.first_name,
        u.last_name,
        u.profile_image,
        COALESCE(m.phone, u.phone) AS phone
      FROM ministry_members mm
      INNER JOIN members m ON m.id = mm.member_id
      INNER JOIN users u ON u.id = m.user_id
      WHERE mm.ministry_id IN (?) AND mm.status = 'Active' AND ${ACTIVE_PERSON}
      ORDER BY (mm.assignment_role = 'Ministry Leader') DESC,
               u.first_name ASC, u.last_name ASC
    `,
    [ministries.map((ministry) => ministry.id)]
  );

  return ministries.map((ministry) => {
    const members = rows
      .filter((row) => row.circleId === ministry.id)
      .map((row) =>
        circlePerson(
          row,
          row.role === "Ministry Leader" ? "Leader" : "Member",
          row.role === "Ministry Leader",
          memberId
        )
      );

    return {
      id: ministry.id,
      name: ministry.name,
      subtitle: ministry.description || null,
      memberCount: members.length,
      members,
    };
  });
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
  getProfileMember,
  getMyAnnouncements,
  markAnnouncementRead,
  getMySmallGroupCircles,
  getMyFamilyCircles,
  getMyMinistryCircles,
};