const db = require("../config/db");

const { httpError, canManageCampus } = require("../utils/accessScope");

const FAMILY_ROLES = ["Father", "Mother", "Child"];
const MAX_BATCH = 50;

// IN (?) needs a non-empty list. Ids start at 1, so 0 matches nothing.
const idList = (list) => (list.length > 0 ? list : [0]);

const fullName = (first, middle, last) =>
  [first, middle, last].filter(Boolean).join(" ");

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
      SELECT id, fellowship_id, name, status
      FROM small_groups
      WHERE id = ?
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
      SELECT id, fellowship_id, small_group_id, name, status
      FROM families
      WHERE id = ?
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

const duplicateName = (error, message) => {
  if (error.code === "ER_DUP_ENTRY") throw httpError(message, 409);

  throw error;
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
        sg.name,
        sg.description,
        sg.status,
        (
          SELECT COUNT(*) FROM families f
          WHERE f.small_group_id = sg.id AND f.status = 'Active'
        ) AS familyCount,
        (
          SELECT COUNT(*) FROM members m
          WHERE m.small_group_id = sg.id AND m.status = 'Active'
        ) AS memberCount,
        (
          SELECT COUNT(*) FROM members m
          WHERE m.small_group_id = sg.id
            AND m.status = 'Active'
            AND NOT EXISTS (
              SELECT 1 FROM family_members fm WHERE fm.member_id = m.id
            )
        ) AS withoutFamily
      FROM small_groups sg
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
    name: g.name,
    description: g.description,
    status: g.status,
    familyCount: Number(g.familyCount),
    memberCount: Number(g.memberCount),
    withoutFamily: Number(g.withoutFamily),
    overseers: byGroup.get(g.id) || [],
    canManage: isManager(access, g.fellowship_id),
  }));
};

const createSmallGroup = async (access, { fellowshipId, name, description }) => {
  assertManager(access, fellowshipId);

  try {
    const [result] = await db.execute(
      `
        INSERT INTO small_groups (fellowship_id, name, description)
        VALUES (?, ?, ?)
      `,
      [fellowshipId, name.trim(), description ? description.trim() : null]
    );

    return { id: result.insertId };
  } catch (error) {
    return duplicateName(
      error,
      "A small group with this name already exists in this campus."
    );
  }
};

const updateSmallGroup = async (access, groupId, { name, description, status }) => {
  const group = await getGroup(db, groupId);

  assertManager(access, group.fellowship_id);

  try {
    await db.execute(
      `
        UPDATE small_groups
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            status = COALESCE(?, status)
        WHERE id = ?
      `,
      [
        name ? name.trim() : null,
        description ? description.trim() : null,
        status || null,
        groupId,
      ]
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
/* Families                                                             */
/* ------------------------------------------------------------------ */

const toPerson = (row) => ({
  memberId: row.memberId,
  memberNumber: row.member_number,
  name: fullName(row.first_name, row.middle_name, row.last_name),
  gender: row.gender,
  status: row.status,
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
        u.first_name,
        u.middle_name,
        u.last_name
      FROM family_members fm
      INNER JOIN families f ON f.id = fm.family_id
      INNER JOIN members m ON m.id = fm.member_id
      INNER JOIN users u ON u.id = m.user_id
      WHERE f.small_group_id = ?
      ORDER BY FIELD(fm.family_role, 'Father', 'Mother', 'Child'), u.first_name ASC
    `,
    [groupId]
  );

  const [unassigned] = await db.execute(
    `
      SELECT
        m.id AS memberId,
        m.member_number,
        m.gender,
        m.status,
        u.first_name,
        u.middle_name,
        u.last_name,
        d.name AS department
      FROM members m
      INNER JOIN users u ON u.id = m.user_id
      LEFT JOIN departments d ON d.id = m.department_id
      WHERE m.small_group_id = ?
        AND m.status = 'Active'
        AND NOT EXISTS (
          SELECT 1 FROM family_members fm WHERE fm.member_id = m.id
        )
      ORDER BY u.first_name ASC
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
      fellowshipId: group.fellowship_id,
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
    unassigned: unassigned.map((row) => ({
      ...toPerson(row),
      department: row.department,
    })),
  };
};

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
        name.trim(),
        description ? description.trim() : null,
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
      [
        name ? name.trim() : null,
        description ? description.trim() : null,
        status || null,
        familyId,
      ]
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
const deleteFamily = async (access, familyId) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const family = await getFamily(conn, familyId, { lock: true });

    assertCanWorkOnFamily(access, family);

    await conn.execute("DELETE FROM family_members WHERE family_id = ?", [familyId]);
    await conn.execute("DELETE FROM families WHERE id = ?", [familyId]);

    await conn.commit();

    return { id: Number(familyId) };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Put members in a family as Father, Mother or Child (one request can add
 * many children). A member already in another family is moved.
 *
 * Rules: active members of the same campus; a Father is male and a Mother
 * is female; at most one of each per family; someone who belongs to another
 * small group can only be moved by a campus manager.
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

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const family = await getFamily(conn, familyId, { lock: true });

    assertCanWorkOnFamily(access, family);

    if (family.status !== "Active") {
      throw httpError("This family is not active.", 400);
    }

    for (const entry of list) {
      const [rows] = await conn.execute(
        `
          SELECT
            m.id,
            m.fellowship_id,
            m.small_group_id,
            m.gender,
            m.status,
            u.first_name,
            u.last_name
          FROM members m
          INNER JOIN users u ON u.id = m.user_id
          WHERE m.id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [entry.memberId]
      );

      const member = rows[0];

      if (!member) throw httpError("Member not found.", 404);

      const name = `${member.first_name} ${member.last_name}`.trim();

      if (member.status !== "Active") {
        throw httpError(`${name} is not an active member.`, 400);
      }

      if (Number(member.fellowship_id) !== Number(family.fellowship_id)) {
        throw httpError(`${name} belongs to a different campus.`, 400);
      }

      if (
        member.small_group_id &&
        Number(member.small_group_id) !== Number(family.small_group_id) &&
        !isManager(access, family.fellowship_id)
      ) {
        throw httpError(
          `${name} belongs to another small group. Ask the Main Leader or Fellowship Admin to move them.`,
          403
        );
      }

      if (entry.familyRole === "Father" && member.gender !== "Male") {
        throw httpError(`${name} cannot be a Father (the member's gender is not male).`, 400);
      }

      if (entry.familyRole === "Mother" && member.gender !== "Female") {
        throw httpError(`${name} cannot be a Mother (the member's gender is not female).`, 400);
      }

      if (entry.familyRole !== "Child") {
        const [taken] = await conn.execute(
          `
            SELECT member_id FROM family_members
            WHERE family_id = ? AND family_role = ? AND member_id <> ?
            LIMIT 1
          `,
          [familyId, entry.familyRole, entry.memberId]
        );

        if (taken[0]) {
          throw httpError(
            `This family already has a ${entry.familyRole}. Remove or change them first.`,
            409
          );
        }
      }

      // A member is in one family only: moving replaces the old place.
      await conn.execute("DELETE FROM family_members WHERE member_id = ?", [
        entry.memberId,
      ]);

      await conn.execute(
        `
          INSERT INTO family_members (family_id, member_id, family_role, assigned_by)
          VALUES (?, ?, ?, ?)
        `,
        [familyId, entry.memberId, entry.familyRole, access.user.id]
      );

      await conn.execute(
        "UPDATE members SET small_group_id = ? WHERE id = ?",
        [family.small_group_id, entry.memberId]
      );
    }

    await conn.commit();

    return { familyId: Number(familyId), saved: list.length };
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

module.exports = {
  listSmallGroups,
  createSmallGroup,
  updateSmallGroup,
  addLeader,
  removeLeader,
  listFamilies,
  createFamily,
  updateFamily,
  deleteFamily,
  saveFamilyMembers,
  removeFamilyMember,
};