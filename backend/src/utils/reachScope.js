const db = require("../config/db");

const idList = (list) => (list.length > 0 ? list : [0]);

const shortName = (name) => String(name || "").replace(/\s+Fellowship$/i, "");

/*
 * What this person can reach, from what they may do (req.access):
 *  - coversAll:  every campus (Super Admin, General Main Leader, or Staff
 *                who serve all campuses)
 *  - campusIds:  campuses they manage
 *  - ledMinistryIds / ledGroupIds: ministries and small groups they lead
 */
const getReach = async (access) => {
  const capabilities = access.capabilities || [];
  const general = capabilities.includes("general:manage");
  const managed = [...(access.scope.memberFellowshipIds || [])];

  const [regular] = await db.execute(
    `
      SELECT id, name
      FROM fellowships
      WHERE fellowship_type = 'regular' AND status = 'Active'
      ORDER BY id
    `
  );

  const regularIds = regular.map((row) => Number(row.id));

  const coversAll = Boolean(
    access.scope.all ||
      general ||
      (regularIds.length > 0 && regularIds.every((id) => managed.includes(id)))
  );

  const campusIds = coversAll ? regularIds : managed;
  const ledMinistryIds = access.positions.ministriesLed.map((item) => item.id);
  const ledGroupIds = access.positions.smallGroups.map((item) => item.id);

  return {
    userId: access.user.id,
    coversAll,
    campusIds,
    ledMinistryIds,
    ledGroupIds,
    campuses: regular
      .filter((row) => campusIds.includes(Number(row.id)))
      .map((row) => ({ id: Number(row.id), name: shortName(row.name) })),
    canSend:
      coversAll ||
      campusIds.length > 0 ||
      ledMinistryIds.length > 0 ||
      ledGroupIds.length > 0,
  };
};

// Ministries this person may address or manage (each campus has its own).
const listMinistries = async (reach) => {
  const [rows] = await db.query(
    `
      SELECT
        mi.id,
        mi.name,
        mi.fellowship_id,
        f.name AS campus_name,
        f.fellowship_type,
        (
          SELECT COUNT(*) FROM ministry_members mm
          WHERE mm.ministry_id = mi.id AND mm.status = 'Active'
        ) AS member_count
      FROM ministries mi
      LEFT JOIN fellowships f ON f.id = mi.fellowship_id
      WHERE mi.status = 'Active'
        AND (? = 1 OR mi.fellowship_id IN (?) OR mi.id IN (?))
      ORDER BY mi.fellowship_id ASC, mi.name ASC
    `,
    [
      reach.coversAll ? 1 : 0,
      idList(reach.campusIds),
      idList(reach.ledMinistryIds),
    ]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    fellowshipId: row.fellowship_id,
    campusName: shortName(row.campus_name),
    isGeneral: row.fellowship_type === "general",
    memberCount: Number(row.member_count || 0),
  }));
};

const listSmallGroups = async (reach) => {
  const [rows] = await db.query(
    `
      SELECT
        sg.id,
        sg.name,
        sg.fellowship_id,
        f.name AS campus_name,
        (
          SELECT COUNT(*)
          FROM small_group_members sgm
          INNER JOIN members m ON m.id = sgm.member_id
          WHERE sgm.small_group_id = sg.id AND m.status = 'Active'
        ) AS member_count
      FROM small_groups sg
      INNER JOIN fellowships f ON f.id = sg.fellowship_id
      WHERE sg.status = 'Active'
        AND (? = 1 OR sg.fellowship_id IN (?) OR sg.id IN (?))
      ORDER BY sg.fellowship_id ASC, sg.name ASC
    `,
    [
      reach.coversAll ? 1 : 0,
      idList(reach.campusIds),
      idList(reach.ledGroupIds),
    ]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    fellowshipId: row.fellowship_id,
    campusName: shortName(row.campus_name),
    memberCount: Number(row.member_count || 0),
  }));
};

/*
 * SQL for "members this person can reach" (the members table is aliased m).
 */
const memberCondition = (reach) => {
  if (reach.coversAll) return { sql: "1 = 1", params: [] };

  const parts = [];
  const params = [];

  if (reach.campusIds.length > 0) {
    parts.push("m.fellowship_id IN (?)");
    params.push(reach.campusIds);
  }

  if (reach.ledMinistryIds.length > 0) {
    parts.push(`
      m.id IN (
        SELECT mm.member_id FROM ministry_members mm
        WHERE mm.ministry_id IN (?) AND mm.status = 'Active'
      )
    `);
    params.push(reach.ledMinistryIds);
  }

  if (reach.ledGroupIds.length > 0) {
    parts.push(`
      m.id IN (
        SELECT sgm.member_id FROM small_group_members sgm
        WHERE sgm.small_group_id IN (?)
      )
    `);
    params.push(reach.ledGroupIds);
  }

  return parts.length > 0
    ? { sql: `(${parts.join(" OR ")})`, params }
    : { sql: "1 = 0", params: [] };
};

module.exports = {
  idList,
  getReach,
  listMinistries,
  listSmallGroups,
  memberCondition,
};