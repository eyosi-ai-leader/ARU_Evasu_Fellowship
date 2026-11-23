const db = require("../config/db");

const { idList } = require("../utils/reachScope");

const ACTIVE = `m.status = 'Active' AND (u.is_active IS NULL OR u.is_active = 1)`;

// "Email only" announcements need a verified address. Dashboard ones do not.
const activeFor = (delivery) =>
  delivery === "email" ? `${ACTIVE} AND u.email_verified_at IS NOT NULL` : ACTIVE;

/*
 * The audience is a union of parts (the members table is aliased m):
 * everyone, campuses, ministries, small groups, families, single members.
 */
const audienceCondition = (audience) => {
  const parts = [];
  const params = [];

  if (audience.everyone) parts.push("1 = 1");

  if (audience.campusIds?.length) {
    parts.push("m.fellowship_id IN (?)");
    params.push(audience.campusIds);
  }

  if (audience.ministryIds?.length) {
    parts.push(`
      m.id IN (
        SELECT mm.member_id FROM ministry_members mm
        WHERE mm.ministry_id IN (?) AND mm.status = 'Active'
      )
    `);
    params.push(audience.ministryIds);
  }

  if (audience.smallGroupIds?.length) {
    parts.push(`
      m.id IN (
        SELECT sgm.member_id FROM small_group_members sgm
        WHERE sgm.small_group_id IN (?)
      )
    `);
    params.push(audience.smallGroupIds);
  }

  if (audience.familyIds?.length) {
    parts.push(`
      m.id IN (
        SELECT fm.member_id FROM family_members fm
        WHERE fm.family_id IN (?)
      )
    `);
    params.push(audience.familyIds);
  }

  if (audience.memberIds?.length) {
    parts.push("m.id IN (?)");
    params.push(audience.memberIds);
  }

  return {
    sql: parts.length > 0 ? `(${parts.join(" OR ")})` : "1 = 0",
    params,
  };
};

const SUMMARY_SELECT = `
  SELECT
    a.id,
    a.subject,
    a.message,
    a.priority,
    a.category,
    a.pinned,
    DATE_FORMAT(a.expires_at, '%Y-%m-%d %H:%i:%s') AS expires_at,
    DATE_FORMAT(a.scheduled_at, '%Y-%m-%d %H:%i:%s') AS scheduled_at,
    a.action_label,
    a.action_url,
    a.audience_label,
    a.delivery,
    a.status,
    a.total_recipients,
    a.email_total,
    a.sent_count,
    a.failed_count,
    a.skipped_opted_out,
    a.fellowship_id,
    f.name AS campus_name,
    a.created_by,
    a.created_at,
    a.completed_at,
    (
      SELECT COUNT(*)
      FROM announcement_recipients rr
      WHERE rr.announcement_id = a.id
        AND rr.read_at IS NOT NULL
    ) AS read_count,
    u.first_name,
    u.last_name
  FROM announcements a
  INNER JOIN users u ON u.id = a.created_by
  LEFT JOIN fellowships f ON f.id = a.fellowship_id
`;

/* ------------------------------------------------------------------ */
/* Audience                                                             */
/* ------------------------------------------------------------------ */

const resolveRecipients = async ({ audience, delivery }) => {
  const condition = audienceCondition(audience);

  const [rows] = await db.query(
    `
      SELECT DISTINCT
        u.id AS user_id,
        u.email,
        u.first_name,
        u.announcement_emails,
        u.email_verified_at
      FROM members m
      INNER JOIN users u ON u.id = m.user_id
      WHERE ${activeFor(delivery)}
        AND ${condition.sql}
    `,
    condition.params
  );

  return rows;
};

/*
 * Browse or search the members the sender can reach, one page at a time.
 */
const searchMembers = async ({
  reachSql,
  reachParams,
  search = "",
  campusId = null,
  ministryId = null,
  smallGroupId = null,
  limit = 25,
  offset = 0,
  delivery = "both",
}) => {
  let where = `${activeFor(delivery)} AND ${reachSql}`;
  const params = [...reachParams];

  if (campusId) {
    where += " AND m.fellowship_id = ?";
    params.push(campusId);
  }

  if (ministryId) {
    where += `
      AND m.id IN (
        SELECT mm.member_id FROM ministry_members mm
        WHERE mm.ministry_id = ? AND mm.status = 'Active'
      )
    `;
    params.push(ministryId);
  }

  if (smallGroupId) {
    where += `
      AND m.id IN (
        SELECT sgm.member_id FROM small_group_members sgm
        WHERE sgm.small_group_id = ?
      )
    `;
    params.push(smallGroupId);
  }

  if (search) {
    where += `
      AND (
        u.first_name LIKE ?
        OR u.last_name LIKE ?
        OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
        OR u.email LIKE ?
        OR m.member_number LIKE ?
      )
    `;

    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }

  const from = `
    FROM members m
    INNER JOIN users u ON u.id = m.user_id
    LEFT JOIN fellowships f ON f.id = m.fellowship_id
  `;

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total ${from} WHERE ${where}`,
    params
  );

  const [rows] = await db.query(
    `
      SELECT
        m.id,
        m.member_number,
        u.first_name,
        u.last_name,
        u.email,
        f.name AS campus_name
      ${from}
      WHERE ${where}
      ORDER BY u.first_name, u.last_name, m.id
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `,
    params
  );

  return { rows, total: Number(countRows[0]?.total || 0) };
};

/* Totals that explain why fewer people can be reached than are members. */
const getMemberStats = async ({ reachSql, reachParams }) => {
  const [rows] = await db.query(
    `
      SELECT
        COUNT(*) AS total,
        SUM(m.status <> 'Active' OR COALESCE(u.is_active, 1) = 0) AS inactive,
        SUM(m.status = 'Active' AND COALESCE(u.is_active, 1) = 1) AS active,
        SUM(
          m.status = 'Active'
          AND COALESCE(u.is_active, 1) = 1
          AND u.email_verified_at IS NULL
        ) AS not_verified
      FROM members m
      INNER JOIN users u ON u.id = m.user_id
      WHERE ${reachSql}
    `,
    reachParams
  );

  const row = rows[0] || {};

  return {
    total: Number(row.total || 0),
    inactive: Number(row.inactive || 0),
    active: Number(row.active || 0),
    notVerified: Number(row.not_verified || 0),
  };
};

/* Members that match a search but cannot be reached, with the reason. */
const searchIneligibleMembers = async ({
  reachSql,
  reachParams,
  search,
  limit = 5,
  delivery = "both",
}) => {
  const term = `%${search}%`;

  const [rows] = await db.query(
    `
      SELECT
        m.id,
        m.member_number,
        m.status AS member_status,
        u.first_name,
        u.last_name,
        u.email,
        u.is_active,
        u.email_verified_at
      FROM members m
      INNER JOIN users u ON u.id = m.user_id
      WHERE NOT (${activeFor(delivery)})
        AND ${reachSql}
        AND (
          u.first_name LIKE ?
          OR u.last_name LIKE ?
          OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
          OR u.email LIKE ?
          OR m.member_number LIKE ?
        )
      ORDER BY u.first_name, u.last_name
      LIMIT ${Number(limit)}
    `,
    [...reachParams, term, term, term, term, term]
  );

  return rows;
};

const countReachableMembers = async (ids, reachSql, reachParams) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total FROM members m WHERE m.id IN (?) AND ${reachSql}`,
    [ids, ...reachParams]
  );

  return Number(rows[0]?.total || 0);
};

const countFamiliesInGroups = async (familyIds, groupIds) => {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS total FROM families WHERE id IN (?) AND small_group_id IN (?)",
    [familyIds, idList(groupIds)]
  );

  return Number(rows[0]?.total || 0);
};

/* ------------------------------------------------------------------ */
/* Labels                                                               */
/* ------------------------------------------------------------------ */

const campusSql = "REPLACE(f.name, ' Fellowship', '')";

const getCampusNames = async (ids) => {
  const [rows] = await db.query(
    `SELECT ${campusSql} AS label FROM fellowships f WHERE f.id IN (?) ORDER BY f.id`,
    [ids]
  );

  return rows.map((row) => row.label);
};

const getMinistryLabels = async (ids) => {
  const [rows] = await db.query(
    `
      SELECT CONCAT(mi.name, IF(f.id IS NULL, '', CONCAT(' (', ${campusSql}, ')'))) AS label
      FROM ministries mi
      LEFT JOIN fellowships f ON f.id = mi.fellowship_id
      WHERE mi.id IN (?)
      ORDER BY label
    `,
    [ids]
  );

  return rows.map((row) => row.label);
};

const getSmallGroupLabels = async (ids) => {
  const [rows] = await db.query(
    `
      SELECT CONCAT(sg.name, ' (', ${campusSql}, ')') AS label
      FROM small_groups sg
      INNER JOIN fellowships f ON f.id = sg.fellowship_id
      WHERE sg.id IN (?)
      ORDER BY label
    `,
    [ids]
  );

  return rows.map((row) => row.label);
};

const getFamilyLabels = async (ids) => {
  const [rows] = await db.query(
    `
      SELECT CONCAT(fa.name, ' · ', sg.name) AS label
      FROM families fa
      INNER JOIN small_groups sg ON sg.id = fa.small_group_id
      WHERE fa.id IN (?)
      ORDER BY label
    `,
    [ids]
  );

  return rows.map((row) => row.label);
};

/* The one campus an announcement belongs to (null when it spans several). */
const getAudienceCampusIds = async (audience) => {
  const [rows] = await db.query(
    `
      SELECT fellowship_id FROM ministries WHERE id IN (?)
      UNION SELECT fellowship_id FROM small_groups WHERE id IN (?)
      UNION SELECT fellowship_id FROM families WHERE id IN (?)
      UNION SELECT fellowship_id FROM members WHERE id IN (?)
    `,
    [
      idList(audience.ministryIds),
      idList(audience.smallGroupIds),
      idList(audience.familyIds),
      idList(audience.memberIds),
    ]
  );

  return [
    ...new Set(
      [...audience.campusIds, ...rows.map((row) => row.fellowship_id)].filter(
        Boolean
      )
    ),
  ];
};

/* ------------------------------------------------------------------ */
/* Sending                                                              */
/* ------------------------------------------------------------------ */

/*
 * Emails already planned or sent today (counts toward the daily cap).
 * Dashboard-only recipients are "skipped" and are not counted.
 */
const countPlannedToday = async () => {
  const [rows] = await db.execute(
    `
      SELECT COUNT(*) AS total
      FROM announcement_recipients ar
      INNER JOIN announcements a ON a.id = ar.announcement_id
      WHERE a.created_at >= CURDATE()
        AND ar.status IN ('sent', 'pending')
    `
  );

  return Number(rows[0]?.total || 0);
};

const INSERT_COLUMNS = `
  fellowship_id, created_by, subject, message, priority, category, pinned,
  expires_at, scheduled_at, action_label, action_url, audience_label,
  audience_json, delivery, total_recipients, email_total, skipped_opted_out,
  status, completed_at
`;

const baseValues = (data) => [
  data.fellowshipId,
  data.createdBy,
  data.subject,
  data.message,
  data.priority,
  data.category,
  data.pinned ? 1 : 0,
  data.expiresAt,
  data.scheduledAt,
  data.actionLabel,
  data.actionUrl,
  data.audienceLabel,
  JSON.stringify(data.audience),
  data.delivery,
];

/*
 * recipients: [{ userId, emailStatus: 'pending' | 'skipped', read: boolean }]
 */
const createAnnouncementWithRecipients = async (data) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const noEmails = data.emailTotal === 0;

    const [result] = await connection.execute(
      `INSERT INTO announcements (${INSERT_COLUMNS})
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ...baseValues({ ...data, scheduledAt: null }),
        data.recipients.length,
        data.emailTotal,
        data.skippedOptedOut,
        noEmails ? "sent" : "sending",
        noEmails ? new Date() : null,
      ]
    );

    const announcementId = result.insertId;

    await connection.query(
      "INSERT INTO announcement_recipients (announcement_id, user_id, status, read_at) VALUES ?",
      [
        data.recipients.map((recipient) => [
          announcementId,
          recipient.userId,
          recipient.emailStatus,
          recipient.read ? new Date() : null,
        ]),
      ]
    );

    await connection.commit();

    return announcementId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// An announcement for later: no recipients yet. They are worked out when it is sent.
const createScheduledAnnouncement = async (data) => {
  const [result] = await db.execute(
    `INSERT INTO announcements (${INSERT_COLUMNS})
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 'scheduled', NULL)`,
    baseValues(data)
  );

  return result.insertId;
};

const findDueScheduled = async (nowStr) => {
  const [rows] = await db.execute(
    `
      SELECT id, created_by, audience_json, delivery
      FROM announcements
      WHERE status = 'scheduled'
        AND deleted_at IS NULL
        AND scheduled_at <= ?
      ORDER BY scheduled_at ASC
      LIMIT 20
    `,
    [nowStr]
  );

  return rows;
};

// True for the one server that wins the race to send it.
const claimScheduled = async (id) => {
  const [result] = await db.execute(
    "UPDATE announcements SET status = 'sending' WHERE id = ? AND status = 'scheduled'",
    [id]
  );

  return result.affectedRows > 0;
};

const endAnnouncement = async (id, status) => {
  await db.execute(
    "UPDATE announcements SET status = ?, completed_at = NOW() WHERE id = ?",
    [status, id]
  );
};

const finalizeScheduled = async (
  id,
  { recipients, emailTotal, skippedOptedOut }
) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      "INSERT INTO announcement_recipients (announcement_id, user_id, status, read_at) VALUES ?",
      [
        recipients.map((recipient) => [
          id,
          recipient.userId,
          recipient.emailStatus,
          recipient.read ? new Date() : null,
        ]),
      ]
    );

    const noEmails = emailTotal === 0;

    await connection.execute(
      `
        UPDATE announcements
        SET total_recipients = ?,
            email_total = ?,
            skipped_opted_out = ?,
            status = ?,
            completed_at = ?
        WHERE id = ?
      `,
      [
        recipients.length,
        emailTotal,
        skippedOptedOut,
        noEmails ? "sent" : "sending",
        noEmails ? new Date() : null,
        id,
      ]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const cancelScheduled = async (id) => {
  const [result] = await db.execute(
    `
      UPDATE announcements
      SET status = 'cancelled', completed_at = NOW()
      WHERE id = ? AND status = 'scheduled'
    `,
    [id]
  );

  return result.affectedRows > 0;
};

const setPinned = async (id, pinned) => {
  await db.execute("UPDATE announcements SET pinned = ? WHERE id = ?", [
    pinned ? 1 : 0,
    id,
  ]);
};

const findStuckSending = async () => {
  const [rows] = await db.execute(
    `
      SELECT a.id
      FROM announcements a
      WHERE a.status = 'sending'
        AND a.deleted_at IS NULL
        AND EXISTS (
          SELECT 1 FROM announcement_recipients ar
          WHERE ar.announcement_id = a.id AND ar.status = 'pending'
        )
    `
  );

  return rows.map((row) => row.id);
};

/* ------------------------------------------------------------------ */
/* Reading                                                              */
/* ------------------------------------------------------------------ */

const getAnnouncementForSend = async (id) => {
  const [rows] = await db.execute(
    `
      SELECT
        a.id,
        a.subject,
        a.message,
        a.priority,
        a.action_label,
        a.action_url,
        u.first_name AS sender_first_name,
        u.last_name AS sender_last_name,
        u.email AS sender_email,
        r.name AS sender_role
      FROM announcements a
      INNER JOIN users u ON u.id = a.created_by
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE a.id = ?
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
};

const getAnnouncementBasic = async (id) => {
  const [rows] = await db.execute(
    `
      SELECT id, created_by, fellowship_id, status
      FROM announcements
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
};

const getAnnouncementById = async (id) => {
  const [rows] = await db.query(
    `${SUMMARY_SELECT} WHERE a.id = ? AND a.deleted_at IS NULL LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const getRecipients = async (announcementId) => {
  const [rows] = await db.query(
    `
      SELECT
        ar.id,
        ar.status,
        ar.error,
        ar.sent_at,
        ar.read_at,
        u.first_name,
        u.last_name,
        u.email,
        u.announcement_emails,
        u.email_verified_at
      FROM announcement_recipients ar
      INNER JOIN users u ON u.id = ar.user_id
      WHERE ar.announcement_id = ?
      ORDER BY
        FIELD(ar.status, 'failed', 'pending', 'sent', 'skipped'),
        u.first_name,
        u.last_name
    `,
    [announcementId]
  );

  return rows;
};

const getPendingBatch = async (announcementId, limit) => {
  const [rows] = await db.query(
    `
      SELECT ar.id, ar.user_id, u.email, u.first_name
      FROM announcement_recipients ar
      INNER JOIN users u ON u.id = ar.user_id
      WHERE ar.announcement_id = ?
        AND ar.status = 'pending'
      ORDER BY ar.id
      LIMIT ${Number(limit)}
    `,
    [announcementId]
  );

  return rows;
};

const markRecipient = async (recipientId, ok, error = "") => {
  await db.execute(
    `
      UPDATE announcement_recipients
      SET status = ?, error = ?, sent_at = ?
      WHERE id = ?
    `,
    [
      ok ? "sent" : "failed",
      ok ? null : String(error).slice(0, 255),
      ok ? new Date() : null,
      recipientId,
    ]
  );
};

const refreshCounts = async (announcementId) => {
  const [rows] = await db.execute(
    `
      SELECT
        SUM(status = 'sent') AS sent,
        SUM(status = 'failed') AS failed,
        SUM(status = 'pending') AS pending
      FROM announcement_recipients
      WHERE announcement_id = ?
    `,
    [announcementId]
  );

  const counts = {
    sent: Number(rows[0]?.sent || 0),
    failed: Number(rows[0]?.failed || 0),
    pending: Number(rows[0]?.pending || 0),
  };

  await db.execute(
    "UPDATE announcements SET sent_count = ?, failed_count = ? WHERE id = ?",
    [counts.sent, counts.failed, announcementId]
  );

  return counts;
};

const finishAnnouncement = (announcementId, status) =>
  endAnnouncement(announcementId, status);

const markAnnouncementSending = async (announcementId) => {
  await db.execute(
    "UPDATE announcements SET status = 'sending', completed_at = NULL WHERE id = ?",
    [announcementId]
  );
};

const resetFailedToPending = async (announcementId) => {
  await db.execute(
    `
      UPDATE announcement_recipients
      SET status = 'pending', error = NULL
      WHERE announcement_id = ? AND status = 'failed'
    `,
    [announcementId]
  );

  await markAnnouncementSending(announcementId);
};

// Retry one person. Returns true if a failed recipient was reset.
const resetRecipientToPending = async (announcementId, recipientId) => {
  const [result] = await db.execute(
    `
      UPDATE announcement_recipients
      SET status = 'pending', error = NULL
      WHERE id = ? AND announcement_id = ? AND status = 'failed'
    `,
    [recipientId, announcementId]
  );

  if (result.affectedRows === 0) return false;

  await markAnnouncementSending(announcementId);

  return true;
};

/*
 * all:       every announcement (people who cover all campuses)
 * createdBy: always their own
 * campusIds: plus the announcements of campuses they manage
 */
const listAnnouncements = async ({
  all = false,
  createdBy,
  campusIds = [],
  search = "",
  status = "",
  limit = 20,
  offset = 0,
} = {}) => {
  let where =
    " WHERE a.deleted_at IS NULL AND (? = 1 OR a.created_by = ? OR a.fellowship_id IN (?))";
  const params = [all ? 1 : 0, createdBy, idList(campusIds)];

  if (search) {
    where += " AND (a.subject LIKE ? OR a.audience_label LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    where += " AND a.status = ?";
    params.push(status);
  }

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM announcements a${where}`,
    params
  );

  const [rows] = await db.query(
    `${SUMMARY_SELECT}${where}
     ORDER BY (a.status = 'scheduled') DESC, a.id DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  return { rows, total: Number(countRows[0]?.total || 0) };
};

const softDeleteAnnouncement = async (id) => {
  await db.execute(
    "UPDATE announcements SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL",
    [id]
  );
};

const getUserContact = async (userId) => {
  const [rows] = await db.execute(
    "SELECT first_name, last_name, email FROM users WHERE id = ? LIMIT 1",
    [userId]
  );

  return rows[0] || null;
};

module.exports = {
  resolveRecipients,
  searchMembers,
  getMemberStats,
  searchIneligibleMembers,
  countReachableMembers,
  countFamiliesInGroups,
  getCampusNames,
  getMinistryLabels,
  getSmallGroupLabels,
  getFamilyLabels,
  getAudienceCampusIds,
  countPlannedToday,
  createAnnouncementWithRecipients,
  createScheduledAnnouncement,
  findDueScheduled,
  claimScheduled,
  endAnnouncement,
  finalizeScheduled,
  cancelScheduled,
  setPinned,
  findStuckSending,
  getAnnouncementForSend,
  getAnnouncementBasic,
  getAnnouncementById,
  getRecipients,
  getPendingBatch,
  markRecipient,
  refreshCounts,
  finishAnnouncement,
  resetFailedToPending,
  resetRecipientToPending,
  listAnnouncements,
  softDeleteAnnouncement,
  getUserContact,
};