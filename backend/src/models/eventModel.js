const db = require("../config/db");

const { DEFAULT_MINUTES } = require("../utils/churchTime");

const CANDIDATE_LIMIT = 500;

const COLUMNS = `
  e.id,
  e.slug,
  e.title,
  e.theme,
  e.speaker,
  e.category,
  e.description,
  e.verse_reference,
  e.verse_text,
  e.location,
  e.online_url,
  e.contact_phone,
  DATE_FORMAT(e.start_at, '%Y-%m-%d %H:%i:%s') AS start_at,
  DATE_FORMAT(e.end_at, '%Y-%m-%d %H:%i:%s') AS end_at,
  e.all_day,
  e.image_url,
  e.visibility,
  e.fellowship_id,
  fe.name AS campus_name,
  e.ministry_id,
  mi.name AS ministry_name,
  e.small_group_id,
  sg.name AS small_group_name,
  e.repeat_type,
  DATE_FORMAT(e.repeat_until, '%Y-%m-%d') AS repeat_until,
  e.featured,
  e.rsvp_enabled,
  e.capacity,
  e.status,
  e.created_by,
  u.first_name AS creator_first_name,
  u.last_name AS creator_last_name
`;

const FROM = `
  FROM events e
  LEFT JOIN fellowships fe ON fe.id = e.fellowship_id
  LEFT JOIN ministries mi ON mi.id = e.ministry_id
  LEFT JOIN small_groups sg ON sg.id = e.small_group_id
  INNER JOIN users u ON u.id = e.created_by
`;

const ENDS_AT = `COALESCE(e.end_at, DATE_ADD(e.start_at, INTERVAL ${DEFAULT_MINUTES} MINUTE))`;

const UPCOMING = `(
  (e.repeat_type = 'weekly' AND (e.repeat_until IS NULL OR e.repeat_until >= DATE(?)))
  OR (e.repeat_type = 'none' AND ${ENDS_AT} >= ?)
)`;

const PAST = `(
  (e.repeat_type = 'weekly' AND e.repeat_until IS NOT NULL AND e.repeat_until < DATE(?))
  OR (e.repeat_type = 'none' AND ${ENDS_AT} < ?)
)`;

const searchClause = (search) => {
  if (!search) return { sql: "", params: [] };

  const term = `%${search}%`;

  return {
    sql: " AND (e.title LIKE ? OR e.location LIKE ? OR e.category LIKE ? OR e.theme LIKE ?)",
    params: [term, term, term, term],
  };
};

/*
 * Events that are still to come (or ongoing). The service works out
 * the exact next date of weekly events.
 */
const findUpcoming = async ({ clauseSql, clauseParams, nowStr, search }) => {
  const extra = searchClause(search);

  const [rows] = await db.query(
    `
      SELECT ${COLUMNS}
      ${FROM}
      WHERE e.deleted_at IS NULL
        AND ${clauseSql}
        AND ${UPCOMING}${extra.sql}
      ORDER BY e.start_at ASC
      LIMIT ${CANDIDATE_LIMIT}
    `,
    [...clauseParams, nowStr, nowStr, ...extra.params]
  );

  return rows;
};

const findPast = async ({
  clauseSql,
  clauseParams,
  nowStr,
  search,
  limit,
  offset,
}) => {
  const extra = searchClause(search);

  const params = [...clauseParams, nowStr, nowStr, ...extra.params];

  const [countRows] = await db.query(
    `
      SELECT COUNT(*) AS total
      ${FROM}
      WHERE e.deleted_at IS NULL
        AND ${clauseSql}
        AND ${PAST}${extra.sql}
    `,
    params
  );

  const [rows] = await db.query(
    `
      SELECT ${COLUMNS}
      ${FROM}
      WHERE e.deleted_at IS NULL
        AND ${clauseSql}
        AND ${PAST}${extra.sql}
      ORDER BY e.start_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `,
    params
  );

  return { rows, total: Number(countRows[0]?.total || 0) };
};

const findBySlug = async (slug) => {
  const [rows] = await db.execute(
    `SELECT ${COLUMNS} ${FROM} WHERE e.slug = ? AND e.deleted_at IS NULL LIMIT 1`,
    [slug]
  );

  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await db.execute(
    `SELECT ${COLUMNS} ${FROM} WHERE e.id = ? AND e.deleted_at IS NULL LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

// An event, but only if this viewer is allowed to see it.
const findByIdForViewer = async (id, clauseSql, clauseParams) => {
  const [rows] = await db.query(
    `
      SELECT ${COLUMNS}
      ${FROM}
      WHERE e.id = ? AND e.deleted_at IS NULL AND ${clauseSql}
      LIMIT 1
    `,
    [id, ...clauseParams]
  );

  return rows[0] || null;
};

const slugExists = async (slug) => {
  const [rows] = await db.execute(
    "SELECT 1 FROM events WHERE slug = ? LIMIT 1",
    [slug]
  );

  return rows.length > 0;
};

const insertEvent = async (data) => {
  const [result] = await db.execute(
    `
      INSERT INTO events (
        slug, title, theme, speaker, category, description,
        verse_reference, verse_text, location, online_url, contact_phone,
        start_at, end_at, all_day, image_url, visibility,
        fellowship_id, ministry_id, small_group_id,
        repeat_type, repeat_until, featured, rsvp_enabled, capacity,
        status, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
    `,
    [
      data.slug,
      data.title,
      data.theme,
      data.speaker,
      data.category,
      data.description,
      data.verseReference,
      data.verseText,
      data.location,
      data.onlineUrl,
      data.contactPhone,
      data.startAt,
      data.endAt,
      data.allDay ? 1 : 0,
      data.imageUrl,
      data.visibility,
      data.fellowshipId,
      data.ministryId,
      data.smallGroupId,
      data.repeatType,
      data.repeatUntil,
      data.featured ? 1 : 0,
      data.rsvpEnabled ? 1 : 0,
      data.capacity,
      data.createdBy,
    ]
  );

  return result.insertId;
};

const updateEvent = async (id, data) => {
  await db.execute(
    `
      UPDATE events
      SET title = ?, theme = ?, speaker = ?, category = ?, description = ?,
          verse_reference = ?, verse_text = ?,
          location = ?, online_url = ?, contact_phone = ?,
          start_at = ?, end_at = ?, all_day = ?,
          image_url = ?, visibility = ?,
          fellowship_id = ?, ministry_id = ?, small_group_id = ?,
          repeat_type = ?, repeat_until = ?, featured = ?,
          rsvp_enabled = ?, capacity = ?
      WHERE id = ? AND deleted_at IS NULL
    `,
    [
      data.title,
      data.theme,
      data.speaker,
      data.category,
      data.description,
      data.verseReference,
      data.verseText,
      data.location,
      data.onlineUrl,
      data.contactPhone,
      data.startAt,
      data.endAt,
      data.allDay ? 1 : 0,
      data.imageUrl,
      data.visibility,
      data.fellowshipId,
      data.ministryId,
      data.smallGroupId,
      data.repeatType,
      data.repeatUntil,
      data.featured ? 1 : 0,
      data.rsvpEnabled ? 1 : 0,
      data.capacity,
      id,
    ]
  );
};

const setStatus = async (id, status) => {
  await db.execute(
    "UPDATE events SET status = ? WHERE id = ? AND deleted_at IS NULL",
    [status, id]
  );
};

const softDelete = async (id) => {
  await db.execute(
    "UPDATE events SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL",
    [id]
  );
};

/* ---- Who belongs where ---- */

const getMySmallGroupIds = async (memberId) => {
  const [rows] = await db.execute(
    "SELECT small_group_id FROM small_group_members WHERE member_id = ?",
    [memberId]
  );

  return rows.map((row) => row.small_group_id);
};

const findMinistry = async (id) => {
  const [rows] = await db.execute(
    "SELECT id, name, fellowship_id FROM ministries WHERE id = ? AND status = 'Active' LIMIT 1",
    [id]
  );

  return rows[0] || null;
};

const findSmallGroup = async (id) => {
  const [rows] = await db.execute(
    "SELECT id, name, fellowship_id FROM small_groups WHERE id = ? AND status = 'Active' LIMIT 1",
    [id]
  );

  return rows[0] || null;
};

const findCampus = async (id) => {
  const [rows] = await db.execute(
    "SELECT id FROM fellowships WHERE id = ? AND fellowship_type = 'regular' AND status = 'Active' LIMIT 1",
    [id]
  );

  return rows[0] || null;
};

/* ---- RSVP ---- */

const upsertRsvp = async ({ eventId, userId, date, response, guests }) => {
  await db.execute(
    `
      INSERT INTO event_rsvps (event_id, user_id, occurrence_date, response, guests)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE response = VALUES(response), guests = VALUES(guests)
    `,
    [eventId, userId, date, response, guests]
  );
};

const deleteRsvp = async ({ eventId, userId, date }) => {
  await db.execute(
    "DELETE FROM event_rsvps WHERE event_id = ? AND user_id = ? AND occurrence_date = ?",
    [eventId, userId, date]
  );
};

// People already going (counting guests), without this person.
const sumGoing = async (eventId, date, exceptUserId) => {
  const [rows] = await db.execute(
    `
      SELECT COALESCE(SUM(1 + guests), 0) AS total
      FROM event_rsvps
      WHERE event_id = ? AND occurrence_date = ?
        AND response = 'going' AND user_id <> ?
    `,
    [eventId, date, exceptUserId]
  );

  return Number(rows[0]?.total || 0);
};

const getRsvpSummary = async (eventIds) => {
  if (eventIds.length === 0) return [];

  const [rows] = await db.query(
    `
      SELECT
        event_id,
        DATE_FORMAT(occurrence_date, '%Y-%m-%d') AS date,
        response,
        COUNT(*) AS people,
        COALESCE(SUM(guests), 0) AS guests
      FROM event_rsvps
      WHERE event_id IN (?)
      GROUP BY event_id, occurrence_date, response
    `,
    [eventIds]
  );

  return rows;
};

const getMyRsvps = async (eventIds, userId) => {
  if (eventIds.length === 0) return [];

  const [rows] = await db.query(
    `
      SELECT
        event_id,
        DATE_FORMAT(occurrence_date, '%Y-%m-%d') AS date,
        response,
        guests
      FROM event_rsvps
      WHERE event_id IN (?) AND user_id = ?
    `,
    [eventIds, userId]
  );

  return rows;
};

const listRsvps = async (eventId, date) => {
  const [rows] = await db.execute(
    `
      SELECT
        r.response,
        r.guests,
        r.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        m.member_number
      FROM event_rsvps r
      INNER JOIN users u ON u.id = r.user_id
      LEFT JOIN members m ON m.user_id = u.id
      WHERE r.event_id = ? AND r.occurrence_date = ?
      ORDER BY FIELD(r.response, 'going', 'maybe', 'not_going'),
               u.first_name, u.last_name
    `,
    [eventId, date]
  );

  return rows;
};

module.exports = {
  findUpcoming,
  findPast,
  findBySlug,
  findById,
  findByIdForViewer,
  slugExists,
  insertEvent,
  updateEvent,
  setStatus,
  softDelete,
  getMySmallGroupIds,
  findMinistry,
  findSmallGroup,
  findCampus,
  upsertRsvp,
  deleteRsvp,
  sumGoing,
  getRsvpSummary,
  getMyRsvps,
  listRsvps,
};