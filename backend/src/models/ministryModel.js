const db = require("../config/db");

const listMinistries = async ({
  search = "",
  status = "",
  fellowshipIds = null,
} = {}) => {
  let query = `
    SELECT
      m.id,
      m.fellowship_id,
      f.name AS fellowship_name,
      f.code AS fellowship_code,
      f.fellowship_type,
      m.name,
      m.description,
      m.meeting_schedule,
      m.meeting_place,
      m.contact_phone,
      m.image_url,
      m.status,
      m.created_at,
      m.updated_at,
      (
        SELECT COUNT(*)
        FROM ministry_members mm
        WHERE mm.ministry_id = m.id
          AND mm.status = 'Active'
          AND mm.assignment_role = 'Member'
      ) AS member_count,
      (
        SELECT COUNT(*)
        FROM ministry_members mm
        WHERE mm.ministry_id = m.id
          AND mm.status = 'Active'
          AND mm.assignment_role = 'Ministry Leader'
      ) AS leader_count
    FROM ministries m
    LEFT JOIN fellowships f ON f.id = m.fellowship_id
    WHERE 1 = 1
  `;

  const params = [];

  // null = every campus (Super Admin).
  if (fellowshipIds) {
    query += " AND m.fellowship_id IN (?)";
    params.push(fellowshipIds.length > 0 ? fellowshipIds : [0]);
  }

  if (search) {
    query += " AND (m.name LIKE ? OR m.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    query += " AND m.status = ?";
    params.push(status);
  }

  query += " ORDER BY m.fellowship_id ASC, m.status ASC, m.name ASC";

  // query (not execute): IN (?) needs a list.
  const [rows] = await db.query(query, params);
  return rows;
};

const getMinistryById = async (id) => {
  const [rows] = await db.execute(
    `SELECT
       m.*,
       f.name AS fellowship_name,
       f.code AS fellowship_code,
       f.fellowship_type,
       (SELECT COUNT(*)
        FROM ministry_members mm
        WHERE mm.ministry_id = m.id
          AND mm.status = 'Active'
          AND mm.assignment_role = 'Member') AS member_count,
       (SELECT COUNT(*)
        FROM ministry_members mm
        WHERE mm.ministry_id = m.id
          AND mm.status = 'Active'
          AND mm.assignment_role = 'Ministry Leader') AS leader_count
     FROM ministries m
     LEFT JOIN fellowships f ON f.id = m.fellowship_id
     WHERE m.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const createMinistry = async ({
  fellowshipId,
  name,
  description,
  imageUrl,
  meetingSchedule,
  meetingPlace,
  contactPhone,
}) => {
  const [result] = await db.execute(
    `INSERT INTO ministries
       (fellowship_id, name, description, image_url,
        meeting_schedule, meeting_place, contact_phone)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      fellowshipId,
      name,
      description || null,
      imageUrl || null,
      meetingSchedule || null,
      meetingPlace || null,
      contactPhone || null,
    ]
  );

  return getMinistryById(result.insertId);
};

const updateMinistry = async (
  id,
  { name, description, imageUrl, meetingSchedule, meetingPlace, contactPhone }
) => {
  await db.execute(
    `UPDATE ministries
     SET name = ?, description = ?, image_url = ?,
         meeting_schedule = ?, meeting_place = ?, contact_phone = ?
     WHERE id = ?`,
    [
      name,
      description || null,
      imageUrl || null,
      meetingSchedule || null,
      meetingPlace || null,
      contactPhone || null,
      id,
    ]
  );

  return getMinistryById(id);
};

// Ministry Leaders can edit the name, description and meeting details.
const updateLeaderMinistry = async (
  id,
  { name, description, meetingSchedule, meetingPlace, contactPhone }
) => {
  await db.execute(
    `UPDATE ministries
     SET name = ?, description = ?,
         meeting_schedule = ?, meeting_place = ?, contact_phone = ?
     WHERE id = ?`,
    [
      name,
      description || null,
      meetingSchedule || null,
      meetingPlace || null,
      contactPhone || null,
      id,
    ]
  );

  return getMinistryById(id);
};

const updateMinistryStatus = async (id, status) => {
  await db.execute(
    "UPDATE ministries SET status = ? WHERE id = ?",
    [status, id]
  );

  return getMinistryById(id);
};

// Check that the authenticated user currently leads this active ministry.
const isLeaderOfMinistry = async (userId, ministryId) => {
  const [rows] = await db.execute(
    `SELECT 1
     FROM ministry_members leader_assignment
     INNER JOIN members leader_member
       ON leader_member.id = leader_assignment.member_id
     INNER JOIN users leader_user
       ON leader_user.id = leader_member.user_id
     INNER JOIN ministries mi
       ON mi.id = leader_assignment.ministry_id
     WHERE leader_user.id = ?
       AND mi.id = ?
       AND mi.status = 'Active'
       AND leader_assignment.assignment_role = 'Ministry Leader'
       AND leader_assignment.status = 'Active'
       AND leader_member.status = 'Active'
       AND leader_user.is_active = 1
     LIMIT 1`,
    [userId, ministryId]
  );

  return rows.length > 0;
};

const getMinistryMembers = async (
  ministryId,
  role = "",
  status = "Active"
) => {
  let query = `
    SELECT
      mm.id AS assignment_id,
      mm.ministry_id,
      mm.member_id,
      mm.assignment_role,
      mm.status AS assignment_status,
      mm.assigned_at,
      mm.ended_at,
      m.member_number,
      m.gender,
      m.date_of_birth,
      m.baptism_date,
      m.address,
      m.phone AS member_phone,
      m.status AS member_status,
      CASE
        WHEN m.date_of_birth IS NOT NULL
        THEN TIMESTAMPDIFF(YEAR, m.date_of_birth, CURDATE())
        ELSE NULL
      END AS age,
      u.first_name,
      u.middle_name,
      u.last_name,
      u.email,
      u.phone AS user_phone,
      u.profile_image
    FROM ministry_members mm
    INNER JOIN members m ON m.id = mm.member_id
    INNER JOIN users u ON u.id = m.user_id
    WHERE mm.ministry_id = ?
  `;

  const params = [ministryId];

  if (status && status !== "All") {
    query += " AND mm.status = ?";
    params.push(status);
  }

  if (role) {
    query += " AND mm.assignment_role = ?";
    params.push(role);
  }

  query += " ORDER BY mm.assignment_role DESC, u.first_name ASC";

  const [rows] = await db.execute(query, params);
  return rows;
};

// Fetch the latest assignment record for a particular member/ministry pair.
const getMinistryAssignment = async (ministryId, memberId) => {
  const [rows] = await db.execute(
    `SELECT id, ministry_id, member_id, assignment_role, status
     FROM ministry_members
     WHERE ministry_id = ? AND member_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [ministryId, memberId]
  );

  return rows[0] || null;
};

const getEligibleMember = async (memberId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT
       m.id,
       m.member_number,
       m.fellowship_id,
       m.status,
       u.first_name,
       u.middle_name,
       u.last_name,
       u.email,
       u.is_active
     FROM members m
     INNER JOIN users u ON u.id = m.user_id
     WHERE m.id = ?
     LIMIT 1`,
    [memberId]
  );

  const member = rows[0] || null;

  if (
    !member ||
    member.status !== "Active" ||
    Number(member.is_active) !== 1
  ) {
    return null;
  }

  return member;
};

// Active members who could still be added to a ministry.
const getCandidates = async ({ ministryId, campusIds, search = "" }) => {
  let query = `
    SELECT
      m.id AS member_id,
      m.member_number,
      m.gender,
      u.first_name,
      u.middle_name,
      u.last_name,
      f.code AS campus_code
    FROM members m
    INNER JOIN users u ON u.id = m.user_id
    INNER JOIN fellowships f ON f.id = m.fellowship_id
    WHERE m.status = 'Active'
      AND u.is_active = 1
      AND m.fellowship_id IN (?)
      AND NOT EXISTS (
        SELECT 1 FROM ministry_members mm
        WHERE mm.ministry_id = ?
          AND mm.member_id = m.id
          AND mm.status = 'Active'
      )
  `;

  const params = [campusIds.length > 0 ? campusIds : [0], ministryId];

  if (search) {
    query += `
      AND (
        u.first_name LIKE ?
        OR u.last_name LIKE ?
        OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
        OR m.member_number LIKE ?
      )
    `;

    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  query += " ORDER BY u.first_name ASC, u.last_name ASC LIMIT 30";

  const [rows] = await db.query(query, params);
  return rows;
};

const getRegularFellowshipIds = async () => {
  const [rows] = await db.execute(
    "SELECT id FROM fellowships WHERE fellowship_type = 'regular' AND status = 'Active'"
  );

  return rows.map((row) => Number(row.id));
};

const getLeaderMinistries = async (userId) => {
  const [ministries] = await db.execute(
    `SELECT DISTINCT
       mi.id,
       mi.fellowship_id,
       mi.meeting_schedule,
       mi.meeting_place,
       mi.contact_phone,
       mi.name,
       mi.description,
       mi.image_url,
       mi.status
     FROM ministries mi
     INNER JOIN ministry_members leader_assignment
       ON leader_assignment.ministry_id = mi.id
     INNER JOIN members leader_member
       ON leader_member.id = leader_assignment.member_id
     INNER JOIN users leader_user
       ON leader_user.id = leader_member.user_id
     WHERE leader_user.id = ?
       AND leader_assignment.assignment_role = 'Ministry Leader'
       AND leader_assignment.status = 'Active'
       AND leader_member.status = 'Active'
       AND leader_user.is_active = 1
       AND mi.status = 'Active'
     ORDER BY mi.name ASC`,
    [userId]
  );

  if (ministries.length === 0) {
    return [];
  }

  const ministryIds = ministries.map((ministry) => ministry.id);
  const placeholders = ministryIds.map(() => "?").join(", ");

  const [members] = await db.execute(
    `SELECT
       mm.ministry_id,
       mm.member_id,
       mm.assignment_role,
       mm.status AS assignment_status,
       mm.assigned_at,
       mm.ended_at,
       m.member_number,
       m.gender,
       m.date_of_birth,
       m.baptism_date,
       m.address,
       m.phone AS member_phone,
       m.status AS member_status,
       CASE
         WHEN m.date_of_birth IS NOT NULL
         THEN TIMESTAMPDIFF(YEAR, m.date_of_birth, CURDATE())
         ELSE NULL
       END AS age,
       u.first_name,
       u.middle_name,
       u.last_name,
       u.email,
       u.phone,
       u.profile_image
     FROM ministry_members mm
     INNER JOIN members m ON m.id = mm.member_id
     INNER JOIN users u ON u.id = m.user_id
     WHERE mm.ministry_id IN (${placeholders})
       AND mm.status = 'Active'
       AND m.status = 'Active'
       AND u.is_active = 1
     ORDER BY u.first_name ASC, u.last_name ASC`,
    ministryIds
  );

  return ministries.map((ministry) => {
    const ministryMembers = members.filter(
      (member) => member.ministry_id === ministry.id
    );

    return {
      ...ministry,
      members: ministryMembers,
      memberCount: ministryMembers.filter(
        (member) => member.assignment_role === "Member"
      ).length,
      leaderCount: ministryMembers.filter(
        (member) => member.assignment_role === "Ministry Leader"
      ).length,
    };
  });
};

module.exports = {
  listMinistries,
  getMinistryById,
  createMinistry,
  updateMinistry,
  updateLeaderMinistry,
  updateMinistryStatus,
  isLeaderOfMinistry,
  getMinistryMembers,
  getMinistryAssignment,
  getEligibleMember,
  getCandidates,
  getRegularFellowshipIds,
  getLeaderMinistries,
};