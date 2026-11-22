const db = require("../config/db");

const { httpError, canManageCampus } = require("../utils/accessScope");

const FAMILY_ROLES = ["Father", "Mother", "Child"];
const MAX_BATCH = 50;

// IN (?) needs a non-empty list. Ids start at 1, so 0 matches nothing.
const idList = (list) => (list.length > 0 ? list : [0]);

const fullName = (first, middle, last) =>
  [first, middle, last].filter(Boolean).join(" ");

// Optional text: empty becomes NULL.
const clean = (value) => {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();

  return text || null;
};

const capacityOf = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);

  if (!Number.isInteger(number) || number < 1 || number > 1000) {
    throw httpError("Capacity must be a number between 1 and 1000.", 400);
  }

  return number;
};

const isManager = (access, fellowshipId) =>
  canManageCampus(access, fellowshipId);

const leadsGroup = (access, groupId) =>
  access.positions.smallGroups.some((g) => g.id === Number(groupId));

// Managers of the campus, or an overseer of this small group.
const canWorkOnGroup = (access, group) =>
  isManager(access, group.fellowship_id) || leadsGroup(access, group.id);

const assertManager = (access, fellowshipId) => {
  if (!isManager(access, fellowshipId)) {
    throw httpError(
      "Only the Fellowship Admin, Main Leader or Staff of this campus can do this.",
      403
    );
  }
};

const getGroup = async (conn, groupId) => {
  const [rows] = await conn.execute(
    `
      SELECT
        sg.id,
        sg.fellowship_id,
        sg.name,
        sg.description,
        sg.purpose,
        sg.meeting_schedule,
        sg.meeting_place,
        sg.capacity,
        sg.status,
        f.name AS fellowship_name
      FROM small_groups sg
      INNER JOIN fellowships f ON f.id = sg.fellowship_id
      WHERE sg.id = ?
      LIMIT 1
    `,
    [groupId]
  );

  if (!rows[0]) throw httpError("Small group not found.", 404);

  return rows[0];
};

const getFamily = async (conn, familyId, { lock = false } = {}) => {
  const [rows] = await conn.execute(
    `
      SELECT
        f.id,
        f.fellowship_id,
        f.small_group_id,
        f.name,
        f.status,
        sg.status AS group_status
      FROM families f
      INNER JOIN small_groups sg ON sg.id = f.small_group_id
      WHERE f.id = ?
      LIMIT 1
      ${lock ? "FOR UPDATE" : ""}
    `,
    [familyId]
  );

  if (!rows[0]) throw httpError("Family not found.", 404);

  return rows[0];
};

const assertCanWorkOnFamily = (access, family) => {
  const group = { id: family.small_group_id, fellowship_id: family.fellowship_id };

  if (!canWorkOnGroup(access, group)) {
    throw httpError("You can only work on the families of your own small group.", 403);
  }
};

const assertFamilyOpen = (family) => {
  if (family.status !== "Active" || family.group_status !== "Active") {
    throw httpError("This family or its small group is not active.", 400);
  }
};

const duplicateName = (error, message) => {
  if (error.code === "ER_DUP_ENTRY") throw httpError(message, 409);

  throw error;
};

/* ------------------------------------------------------------------ */
/* Membership helpers                                                   */
/* ------------------------------------------------------------------ */

// Puts a member in a small group (nothing happens if they already are).
const ensureGroupMember = async (conn, groupId, memberId, addedBy) => {
  await conn.execute(
    `
      INSERT IGNORE INTO small_group_members
        (small_group_id, member_id, joined_at, added_by)
      VALUES (?, ?, CURDATE(), ?)
    `,
    [groupId, memberId, addedBy]
  );
};

const loadPlaceableMember = async (conn, memberId, { lock = false } = {}) => {
  const [rows] = await conn.execute(
    `
      SELECT
        m.id,
        m.fellowship_id,
        m.gender,
        m.status,
        u.first_name,
        u.last_name
      FROM members m
      INNER JOIN users u ON u.id = m.user_id
      WHERE m.id = ?
      LIMIT 1
      ${lock ? "FOR UPDATE" : ""}
    `,
    [memberId]
  );

  if (!rows[0]) throw httpError("Member not found.", 404);

  return rows[0];
};

// Active members of the same campus only (Staff have no campus).
const assertPlaceable = (member, fellowshipId) => {
  const name = `${member.first_name} ${member.last_name}`.trim();

  if (member.status !== "Active") {
    throw httpError(`${name} is not an active member.`, 400);
  }

  if (
    !member.fellowship_id ||
    Number(member.fellowship_id) !== Number(fellowshipId)
  ) {
    throw httpError(`${name} does not belong to this campus.`, 400);
  }
};

/*
 * Put a member in a family with a role. A member may be in several families.
 * Father is male, Mother is female, at most one of each per family.
 * The member also joins the family's small group.
 */
const placeInFamily = async (conn, family, member, role, addedBy) => {
  const name = `${member.first_name} ${member.last_name}`.trim();

  if (role === "Father" && member.gender !== "Male") {
    throw httpError(`${name} cannot be a Father (the member's gender is not male).`, 400);
  }

  if (role === "Mother" && member.gender !== "Female") {
    throw httpError(`${name} cannot be a Mother (the member's gender is not female).`, 400);
  }

  if (role !== "Child") {
    const [taken] = await conn.execute(
      `
        SELECT member_id FROM family_members
        WHERE family_id = ? AND family_role = ? AND member_id <> ?
        LIMIT 1
      `,
      [family.id, role, member.id]
    );

    if (taken[0]) {
      throw httpError(
        `${family.name} already has a ${role}. Remove or change them first.`,
        409
      );
    }
  }

  const [existing] = await conn.execute(
    "SELECT id FROM family_members WHERE family_id = ? AND member_id = ? LIMIT 1",
    [family.id, member.id]
  );

  if (existing[0]) {
    await conn.execute(
      "UPDATE family_members SET family_role = ?, assigned_by = ? WHERE id = ?",
      [role, addedBy, existing[0].id]
    );
  } else {
    await conn.execute(
      `
        INSERT INTO family_members (family_id, member_id, family_role, assigned_by)
        VALUES (?, ?, ?, ?)
      `,
      [family.id, member.id, role, addedBy]
    );
  }

  await ensureGroupMember(conn, family.small_group_id, member.id, addedBy);
};

// Takes a member out of a small group and out of its families.
const removeFromGroupTx = async (conn, groupId, memberId) => {
  await conn.execute(
    `
      DELETE fm FROM family_members fm
      INNER JOIN families fa ON fa.id = fm.family_id
      WHERE fm.member_id = ? AND fa.small_group_id = ?
    `,
    [memberId, groupId]
  );

  const [result] = await conn.execute(
    "DELETE FROM small_group_members WHERE small_group_id = ? AND member_id = ?",
    [groupId, memberId]
  );

  return result.affectedRows;
};

const inTransaction = async (work) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const result = await work(conn);

    await conn.commit();

    return result;
  } catch (error) {
    await conn.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      throw httpError(
        "The family changed while you were saving. Please refresh and try again.",
        409
      );
    }

    throw error;
  } finally {
    conn.release();
  }
};

/* ------------------------------------------------------------------ */
/* Small groups                                                         */
/* ------------------------------------------------------------------ */

const listSmallGroups = async (access) => {
  const managedIds = access.scope.memberFellowshipIds;
  const ledIds = access.positions.smallGroups.map((g) => g.id);

  const [groups] = await db.query(
    `
      SELECT
        sg.id,
        sg.fellowship_id,
        f.name AS fellowship_name,
        sg.name,
        sg.description,
        sg.purpose,
        sg.meeting_schedule,
        sg.meeting_place,
        sg.capacity,
        sg.status,
        (
          SELECT COUNT(*) FROM families fa
          WHERE fa.small_group_id = sg.id AND fa.status = 'Active'
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
              INNER JOIN families fa2 ON fa2.id = fm.family_id
              WHERE fm.member_id = sgm.member_id
                AND fa2.small_group_id = sg.id
            )
        ) AS withoutFamily
      FROM small_groups sg
      INNER JOIN fellowships f ON f.id = sg.fellowship_id
      WHERE sg.fellowship_id IN (?) OR sg.id IN (?)
      ORDER BY sg.fellowship_id ASC, sg.name ASC
    `,
    [idList(managedIds), idList(ledIds)]
  );

  if (groups.length === 0) return [];

  const [leaders] = await db.query(
    `
      SELECT
        l.small_group_id AS groupId,
        m.id AS memberId,
        u.first_name,
        u.middle_name,
        u.last_name
      FROM small_group_leaders l
      INNER JOIN members m ON m.id = l.member_id
      INNER JOIN users u ON u.id = m.user_id
      WHERE l.small_group_id IN (?) AND l.status = 'Active'
      ORDER BY u.first_name ASC
    `,
    [groups.map((g) => g.id)]
  );

  const byGroup = new Map();

  for (const leader of leaders) {
    const list = byGroup.get(leader.groupId) || [];

    list.push({
      memberId: leader.memberId,
      name: fullName(leader.first_name, leader.middle_name, leader.last_name),
    });

    byGroup.set(leader.groupId, list);
  }

  return groups.map((g) => ({
    id: g.id,
    fellowshipId: g.fellowship_id,
    fellowshipName: g.fellowship_name,
    name: g.name,
    description: g.description,
    purpose: g.purpose,
    meetingSchedule: g.meeting_schedule,
    meetingPlace: g.meeting_place,
    capacity: g.capacity,
    status: g.status,
    familyCount: Number(g.familyCount),
    memberCount: Number(g.memberCount),
    withoutFamily: Number(g.withoutFamily),
    overseers: byGroup.get(g.id) || [],
    canManage: isManager(access, g.fellowship_id),
  }));
};

const createSmallGroup = async (access, input = {}) => {
  const fellowshipId = Number(input.fellowshipId);

  assertManager(access, fellowshipId);

  try {
    const [result] = await db.execute(
      `
        INSERT INTO small_groups
          (fellowship_id, name, description, purpose,
           meeting_schedule, meeting_place, capacity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        fellowshipId,
        String(input.name || "").trim(),
        clean(input.description),
        clean(input.purpose),
        clean(input.meetingSchedule),
        clean(input.meetingPlace),
        capacityOf(input.capacity),
      ]
    );

    return { id: result.insertId };
  } catch (error) {
    return duplicateName(
      error,
      "A small group with this name already exists in this campus."
    );
  }
};

const updateSmallGroup = async (access, groupId, input = {}) => {
  const group = await getGroup(db, groupId);

  assertManager(access, group.fellowship_id);

  const sets = [];
  const values = [];

  const put = (column, value) => {
    sets.push(`${column} = ?`);
    values.push(value);
  };

  if (input.name !== undefined) put("name", String(input.name).trim());
  if (input.description !== undefined) put("description", clean(input.description));
  if (input.purpose !== undefined) put("purpose", clean(input.purpose));
  if (input.meetingSchedule !== undefined) put("meeting_schedule", clean(input.meetingSchedule));
  if (input.meetingPlace !== undefined) put("meeting_place", clean(input.meetingPlace));
  if (input.capacity !== undefined) put("capacity", capacityOf(input.capacity));
  if (input.status) put("status", input.status);

  if (sets.length === 0) return { id: Number(groupId) };

  try {
    await db.execute(
      `UPDATE small_groups SET ${sets.join(", ")} WHERE id = ?`,
      [...values, groupId]
    );
  } catch (error) {
    return duplicateName(
      error,
      "A small group with this name already exists in this campus."
    );
  }

  return { id: Number(groupId) };
};

/* ------------------------------------------------------------------ */
/* Overseers (Small Group Leaders): appointed by campus managers only   */
/* ------------------------------------------------------------------ */

const addLeader = async (access, groupId, memberId) => {
  const group = await getGroup(db, groupId);

  assertManager(access, group.fellowship_id);

  if (group.status !== "Active") {
    throw httpError("This small group is not active.", 400);
  }

  const [rows] = await db.execute(
    "SELECT id, fellowship_id, status FROM members WHERE id = ? LIMIT 1",
    [memberId]
  );

  const member = rows[0];

  if (!member) throw httpError("Member not found.", 404);

  if (member.status !== "Active") {
    throw httpError("Only an active member can be an overseer.", 400);
  }

  if (Number(member.fellowship_id) !== Number(group.fellowship_id)) {
    throw httpError(
      "The overseer must belong to the same campus as the small group.",
      400
    );
  }

  await db.execute(
    `
      INSERT INTO small_group_leaders (small_group_id, member_id, status, assigned_by)
      VALUES (?, ?, 'Active', ?)
      ON DUPLICATE KEY UPDATE status = 'Active', assigned_by = VALUES(assigned_by)
    `,
    [groupId, memberId, access.user.id]
  );

  return { groupId: Number(groupId), memberId: Number(memberId) };
};

const removeLeader = async (access, groupId, memberId) => {
  const group = await getGroup(db, groupId);

  assertManager(access, group.fellowship_id);

  const [result] = await db.execute(
    "DELETE FROM small_group_leaders WHERE small_group_id = ? AND member_id = ?",
    [groupId, memberId]
  );

  if (result.affectedRows === 0) {
    throw httpError("This member is not an overseer of this small group.", 404);
  }

  return { groupId: Number(groupId), memberId: Number(memberId) };
};

/* ------------------------------------------------------------------ */
/* Families (read)                                                      */
/* ------------------------------------------------------------------ */

const toPerson = (row) => ({
  memberId: row.memberId,
  memberNumber: row.member_number,
  name: fullName(row.first_name, row.middle_name, row.last_name),
  gender: row.gender,
  status: row.status,
  phone: row.phone || "",
  academicStatus: row.academic_status || "",
  department: row.department || "",
  familyCount: Number(row.familyCount || 0),
  otherGroups: row.otherGroups || "",
});

const listFamilies = async (access, groupId) => {
  const group = await getGroup(db, groupId);

  if (!canWorkOnGroup(access, group)) {
    throw httpError("You can only see the families of your own small group.", 403);
  }

  const [families] = await db.execute(
    `
      SELECT id, name, description, status
      FROM families
      WHERE small_group_id = ?
      ORDER BY name ASC
    `,
    [groupId]
  );

  const [people] = await db.execute(
    `
      SELECT
        fm.family_id,
        fm.family_role,
        m.id AS memberId,
        m.member_number,
        m.gender,
        m.status,
        m.academic_status,
        COALESCE(m.phone, u.phone) AS phone,
        u.first_name,
        u.middle_name,
        u.last_name,
        d.name AS department,
        (
          SELECT COUNT(*) FROM family_members fmc WHERE fmc.member_id = m.id
        ) AS familyCount
      FROM family_members fm
      INNER JOIN families f ON f.id = fm.family_id
      INNER JOIN members m ON m.id = fm.member_id
      INNER JOIN users u ON u.id = m.user_id
      LEFT JOIN departments d ON d.id = m.department_id
      WHERE f.small_group_id = ?
      ORDER BY FIELD(fm.family_role, 'Father', 'Mother', 'Child'), u.first_name ASC
    `,
    [groupId]
  );

  // Members of this small group who are in none of its families.
  const [unassigned] = await db.execute(
    `
      SELECT
        m.id AS memberId,
        m.member_number,
        m.gender,
        m.status,
        m.academic_status,
        COALESCE(m.phone, u.phone) AS phone,
        u.first_name,
        u.middle_name,
        u.last_name,
        d.name AS department,
        (
          SELECT GROUP_CONCAT(sgn.name ORDER BY sgn.name SEPARATOR ', ')
          FROM small_group_members sgx
          INNER JOIN small_groups sgn ON sgn.id = sgx.small_group_id
          WHERE sgx.member_id = m.id AND sgx.small_group_id <> ?
        ) AS otherGroups,
        (
          SELECT COUNT(*) FROM family_members fmc WHERE fmc.member_id = m.id
        ) AS familyCount
      FROM small_group_members sgm
      INNER JOIN members m ON m.id = sgm.member_id
      INNER JOIN users u ON u.id = m.user_id
      LEFT JOIN departments d ON d.id = m.department_id
      WHERE sgm.small_group_id = ?
        AND m.status = 'Active'
        AND NOT EXISTS (
          SELECT 1
          FROM family_members fm
          INNER JOIN families fa ON fa.id = fm.family_id
          WHERE fm.member_id = m.id AND fa.small_group_id = ?
        )
      ORDER BY u.first_name ASC
    `,
    [groupId, groupId, groupId]
  );

  const [leaders] = await db.execute(
    `
      SELECT m.id AS memberId, u.first_name, u.middle_name, u.last_name
      FROM small_group_leaders l
      INNER JOIN members m ON m.id = l.member_id
      INNER JOIN users u ON u.id = m.user_id
      WHERE l.small_group_id = ? AND l.status = 'Active'
      ORDER BY u.first_name ASC
    `,
    [groupId]
  );

  const [[{ memberCount }]] = await db.execute(
    `
      SELECT COUNT(*) AS memberCount
      FROM small_group_members sgm
      INNER JOIN members m ON m.id = sgm.member_id
      WHERE sgm.small_group_id = ? AND m.status = 'Active'
    `,
    [groupId]
  );

  const byFamily = new Map();

  for (const row of people) {
    const list = byFamily.get(row.family_id) || [];

    list.push({ role: row.family_role, person: toPerson(row) });
    byFamily.set(row.family_id, list);
  }

  return {
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      purpose: group.purpose,
      meetingSchedule: group.meeting_schedule,
      meetingPlace: group.meeting_place,
      capacity: group.capacity,
      status: group.status,
      fellowshipId: group.fellowship_id,
      fellowshipName: group.fellowship_name,
      memberCount: Number(memberCount),
      canManage: isManager(access, group.fellowship_id),
      overseers: leaders.map((leader) => ({
        memberId: leader.memberId,
        name: fullName(leader.first_name, leader.middle_name, leader.last_name),
      })),
    },
    families: families.map((family) => {
      const list = byFamily.get(family.id) || [];
      const father = list.find((p) => p.role === "Father");
      const mother = list.find((p) => p.role === "Mother");
      const children = list.filter((p) => p.role === "Child");

      return {
        id: family.id,
        name: family.name,
        description: family.description,
        status: family.status,
        father: father ? father.person : null,
        mother: mother ? mother.person : null,
        children: children.map((p) => p.person),
        childCount: children.length,
        needsParent: !father && !mother,
      };
    }),
    unassigned: unassigned.map(toPerson),
  };
};

/**
 * People who could be added. Active members of the small group's campus
 * (Staff have no campus, so they never appear).
 *
 *   familyId  leaves out people already in that family
 *   scope     "group" leaves out people already in this small group
 */
const listCandidates = async (
  access,
  groupId,
  { search = "", familyId = "", scope = "" } = {}
) => {
  const group = await getGroup(db, groupId);

  if (!canWorkOnGroup(access, group)) {
    throw httpError("You can only work on your own small group.", 403);
  }

  const params = [group.id, group.id, group.fellowship_id];

  let query = `
    SELECT
      m.id AS memberId,
      m.member_number,
      m.gender,
      m.academic_status,
      u.first_name,
      u.middle_name,
      u.last_name,
      d.name AS department,
      EXISTS (
        SELECT 1 FROM small_group_members sgm
        WHERE sgm.member_id = m.id AND sgm.small_group_id = ?
      ) AS inGroup,
      (
        SELECT GROUP_CONCAT(sgn.name ORDER BY sgn.name SEPARATOR ', ')
        FROM small_group_members sgx
        INNER JOIN small_groups sgn ON sgn.id = sgx.small_group_id
        WHERE sgx.member_id = m.id AND sgx.small_group_id <> ?
      ) AS otherGroups,
      (
        SELECT COUNT(*) FROM family_members fmc WHERE fmc.member_id = m.id
      ) AS familyCount
    FROM members m
    INNER JOIN users u ON u.id = m.user_id
    LEFT JOIN departments d ON d.id = m.department_id
    WHERE m.status = 'Active'
      AND u.is_active = 1
      AND m.fellowship_id = ?
  `;

  if (familyId) {
    query += `
      AND NOT EXISTS (
        SELECT 1 FROM family_members fx
        WHERE fx.member_id = m.id AND fx.family_id = ?
      )
    `;
    params.push(Number(familyId));
  }

  if (scope === "group") {
    query += `
      AND NOT EXISTS (
        SELECT 1 FROM small_group_members sgy
        WHERE sgy.member_id = m.id AND sgy.small_group_id = ?
      )
    `;
    params.push(group.id);
  }

  const term = String(search || "").trim();

  if (term) {
    query += `
      AND (
        u.first_name LIKE ?
        OR u.last_name LIKE ?
        OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
        OR m.member_number LIKE ?
      )
    `;

    const like = `%${term}%`;
    params.push(like, like, like, like);
  }

  query += `
    ORDER BY inGroup DESC, u.first_name ASC, u.last_name ASC
    LIMIT 50
  `;

  const [rows] = await db.query(query, params);

  return rows.map((row) => ({
    memberId: row.memberId,
    memberNumber: row.member_number,
    name: fullName(row.first_name, row.middle_name, row.last_name),
    gender: row.gender,
    academicStatus: row.academic_status || "",
    department: row.department || "",
    inGroup: Boolean(row.inGroup),
    otherGroups: row.otherGroups || "",
    familyCount: Number(row.familyCount || 0),
  }));
};

/* ------------------------------------------------------------------ */
/* Families (change)                                                    */
/* ------------------------------------------------------------------ */

const createFamily = async (access, groupId, { name, description }) => {
  const group = await getGroup(db, groupId);

  if (!canWorkOnGroup(access, group)) {
    throw httpError("You can only add families to your own small group.", 403);
  }

  if (group.status !== "Active") {
    throw httpError("This small group is not active.", 400);
  }

  try {
    const [result] = await db.execute(
      `
        INSERT INTO families
          (fellowship_id, small_group_id, name, description, created_by)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        group.fellowship_id,
        group.id,
        String(name).trim(),
        clean(description),
        access.user.id,
      ]
    );

    return { id: result.insertId };
  } catch (error) {
    return duplicateName(
      error,
      "This small group already has a family with this name."
    );
  }
};

const updateFamily = async (access, familyId, { name, description, status }) => {
  const family = await getFamily(db, familyId);

  assertCanWorkOnFamily(access, family);

  try {
    await db.execute(
      `
        UPDATE families
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            status = COALESCE(?, status)
        WHERE id = ?
      `,
      [name ? String(name).trim() : null, clean(description), status || null, familyId]
    );
  } catch (error) {
    return duplicateName(
      error,
      "This small group already has a family with this name."
    );
  }

  return { id: Number(familyId) };
};

// The people stay in the small group; they just have no family any more.
const deleteFamily = async (access, familyId) =>
  inTransaction(async (conn) => {
    const family = await getFamily(conn, familyId, { lock: true });

    assertCanWorkOnFamily(access, family);

    await conn.execute("DELETE FROM family_members WHERE family_id = ?", [familyId]);
    await conn.execute("DELETE FROM families WHERE id = ?", [familyId]);

    return { id: Number(familyId) };
  });

/**
 * Put members in a family as Father, Mother or Child (one request can add
 * many children). A member may already be in other families: that is fine.
 * The member also joins the family's small group.
 */
const saveFamilyMembers = async (access, familyId, entries) => {
  const list = Array.isArray(entries) ? entries : [];

  if (list.length === 0 || list.length > MAX_BATCH) {
    throw httpError(`Choose between 1 and ${MAX_BATCH} members.`, 400);
  }

  const seen = new Set();

  for (const entry of list) {
    if (!FAMILY_ROLES.includes(entry.familyRole)) {
      throw httpError("Choose Father, Mother or Child.", 400);
    }

    if (seen.has(Number(entry.memberId))) {
      throw httpError("The same member is listed twice.", 400);
    }

    seen.add(Number(entry.memberId));
  }

  return inTransaction(async (conn) => {
    const family = await getFamily(conn, familyId, { lock: true });

    assertCanWorkOnFamily(access, family);
    assertFamilyOpen(family);

    for (const entry of list) {
      const member = await loadPlaceableMember(conn, entry.memberId, {
        lock: true,
      });

      assertPlaceable(member, family.fellowship_id);

      await placeInFamily(conn, family, member, entry.familyRole, access.user.id);
    }

    return { familyId: Number(familyId), saved: list.length };
  });
};

// Takes the member out of this family only. They stay in the small group.
const removeFamilyMember = async (access, familyId, memberId) => {
  const family = await getFamily(db, familyId);

  assertCanWorkOnFamily(access, family);

  const [result] = await db.execute(
    "DELETE FROM family_members WHERE family_id = ? AND member_id = ?",
    [familyId, memberId]
  );

  if (result.affectedRows === 0) {
    throw httpError("This member is not in this family.", 404);
  }

  return { familyId: Number(familyId), memberId: Number(memberId) };
};

// Moves a member from one family to another (same campus).
const moveFamilyMember = async (
  access,
  fromFamilyId,
  memberId,
  { toFamilyId, familyRole }
) => {
  fromFamilyId = Number(fromFamilyId);
  toFamilyId = Number(toFamilyId);

  if (fromFamilyId === toFamilyId) {
    throw httpError("Choose a different family.", 400);
  }

  if (familyRole && !FAMILY_ROLES.includes(familyRole)) {
    throw httpError("Choose Father, Mother or Child.", 400);
  }

  return inTransaction(async (conn) => {
    // Lock the lower id first so two moves can't wait on each other.
    const [firstId, secondId] =
      fromFamilyId < toFamilyId
        ? [fromFamilyId, toFamilyId]
        : [toFamilyId, fromFamilyId];

    const first = await getFamily(conn, firstId, { lock: true });
    const second = await getFamily(conn, secondId, { lock: true });

    const from = first.id === fromFamilyId ? first : second;
    const to = first.id === toFamilyId ? first : second;

    assertCanWorkOnFamily(access, from);
    assertCanWorkOnFamily(access, to);
    assertFamilyOpen(to);

    if (Number(from.fellowship_id) !== Number(to.fellowship_id)) {
      throw httpError("Families must be in the same campus.", 400);
    }

    const member = await loadPlaceableMember(conn, memberId, { lock: true });

    assertPlaceable(member, to.fellowship_id);

    const [current] = await conn.execute(
      `
        SELECT family_role FROM family_members
        WHERE family_id = ? AND member_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [from.id, member.id]
    );

    if (!current[0]) throw httpError("This member is not in that family.", 404);

    await conn.execute(
      "DELETE FROM family_members WHERE family_id = ? AND member_id = ?",
      [from.id, member.id]
    );

    await placeInFamily(
      conn,
      to,
      member,
      familyRole || current[0].family_role,
      access.user.id
    );

    return { memberId: member.id, fromFamilyId: from.id, toFamilyId: to.id };
  });
};

/* ------------------------------------------------------------------ */
/* Small group membership (a family is optional)                        */
/* ------------------------------------------------------------------ */

// Add members to a small group without putting them in a family.
const addGroupMembers = async (access, groupId, memberIds) => {
  const ids = [
    ...new Set(
      (Array.isArray(memberIds) ? memberIds : [])
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];

  if (ids.length === 0 || ids.length > MAX_BATCH) {
    throw httpError(`Choose between 1 and ${MAX_BATCH} members.`, 400);
  }

  return inTransaction(async (conn) => {
    const group = await getGroup(conn, groupId);

    if (!canWorkOnGroup(access, group)) {
      throw httpError("You can only add people to your own small group.", 403);
    }

    if (group.status !== "Active") {
      throw httpError("This small group is not active.", 400);
    }

    for (const memberId of ids) {
      const member = await loadPlaceableMember(conn, memberId, { lock: true });

      assertPlaceable(member, group.fellowship_id);

      await ensureGroupMember(conn, group.id, member.id, access.user.id);
    }

    return { groupId: group.id, added: ids.length };
  });
};

// Remove a member from a small group (and from its families).
const removeFromSmallGroup = async (access, groupId, memberId) =>
  inTransaction(async (conn) => {
    const group = await getGroup(conn, groupId);

    if (!canWorkOnGroup(access, group)) {
      throw httpError("You can only change your own small group.", 403);
    }

    const removed = await removeFromGroupTx(conn, group.id, memberId);

    if (removed === 0) {
      throw httpError("This member is not in this small group.", 404);
    }

    return { groupId: group.id, memberId: Number(memberId) };
  });

/**
 * Move a member to another small group of the same campus, optionally into
 * one of its families. The person must be allowed to work on both groups.
 */
const transferMember = async (
  access,
  fromGroupId,
  memberId,
  { toGroupId, toFamilyId, familyRole }
) => {
  toGroupId = Number(toGroupId);

  if (Number(fromGroupId) === toGroupId) {
    throw httpError("Choose a different small group.", 400);
  }

  const role = familyRole || "Child";

  if (!FAMILY_ROLES.includes(role)) {
    throw httpError("Choose Father, Mother or Child.", 400);
  }

  return inTransaction(async (conn) => {
    const from = await getGroup(conn, fromGroupId);
    const to = await getGroup(conn, toGroupId);

    if (!canWorkOnGroup(access, from) || !canWorkOnGroup(access, to)) {
      throw httpError(
        "You can only move people between small groups you manage or oversee.",
        403
      );
    }

    if (Number(from.fellowship_id) !== Number(to.fellowship_id)) {
      throw httpError("Small groups must be in the same campus.", 400);
    }

    if (to.status !== "Active") {
      throw httpError("The chosen small group is not active.", 400);
    }

    const member = await loadPlaceableMember(conn, memberId, { lock: true });

    assertPlaceable(member, to.fellowship_id);

    const [inFrom] = await conn.execute(
      "SELECT id FROM small_group_members WHERE small_group_id = ? AND member_id = ? LIMIT 1",
      [from.id, member.id]
    );

    if (!inFrom[0]) {
      throw httpError("This member is not in this small group.", 404);
    }

    await removeFromGroupTx(conn, from.id, member.id);
    await ensureGroupMember(conn, to.id, member.id, access.user.id);

    if (toFamilyId) {
      const family = await getFamily(conn, Number(toFamilyId), { lock: true });

      if (Number(family.small_group_id) !== to.id) {
        throw httpError("That family is not in the chosen small group.", 400);
      }

      assertFamilyOpen(family);

      await placeInFamily(conn, family, member, role, access.user.id);
    }

    return { memberId: member.id, fromGroupId: from.id, toGroupId: to.id };
  });
};

module.exports = {
  listSmallGroups,
  createSmallGroup,
  updateSmallGroup,
  addLeader,
  removeLeader,
  listFamilies,
  listCandidates,
  createFamily,
  updateFamily,
  deleteFamily,
  saveFamilyMembers,
  removeFamilyMember,
  moveFamilyMember,
  addGroupMembers,
  removeFromSmallGroup,
  transferMember,
};