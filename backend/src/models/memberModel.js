const db = require("../config/db");

const {
  ROLE_IDS,
  getAccessLevelForRole,
} = require("../constants/roles");

/**
 * Columns returned for a member.
 * Shared by every read query so they always match.
 */
const MEMBER_FIELDS = `
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

  m.fellowship_id,
  f.name AS fellowship_name,
  f.code AS fellowship_code,

  (
    SELECT COUNT(*) FROM small_group_members sgc
    WHERE sgc.member_id = m.id
  ) AS small_group_count,
  (
    SELECT GROUP_CONCAT(sgn.name ORDER BY sgn.name SEPARATOR ', ')
    FROM small_group_members sgm
    INNER JOIN small_groups sgn ON sgn.id = sgm.small_group_id
    WHERE sgm.member_id = m.id
  ) AS small_group_names,
  (
    SELECT COUNT(*) FROM family_members fmc
    WHERE fmc.member_id = m.id
  ) AS family_count,
  (
    SELECT GROUP_CONCAT(
      CONCAT(fan.name, ' (', fmn.family_role, ')')
      ORDER BY fan.name SEPARATOR ', '
    )
    FROM family_members fmn
    INNER JOIN families fan ON fan.id = fmn.family_id
    WHERE fmn.member_id = m.id
  ) AS family_names,

  EXISTS (
    SELECT 1 FROM small_group_leaders sgl
    WHERE sgl.member_id = m.id AND sgl.status = 'Active'
  ) AS is_small_group_leader,
  EXISTS (
    SELECT 1 FROM ministry_members mml
    WHERE mml.member_id = m.id
      AND mml.assignment_role = 'Ministry Leader'
      AND mml.status = 'Active'
  ) AS is_ministry_leader,
  EXISTS (
    SELECT 1 FROM fellowship_leaders fl
    WHERE fl.member_id = m.id AND fl.status = 'Active'
  ) AS is_main_leader,

  m.department_id,
  d.name AS department_name,
  d.duration_years AS department_duration_years,
  m.student_id,
  m.academic_status,
  m.entry_year,
  m.graduation_year,

  m.gender,
  m.phone,
  m.date_of_birth,
  m.baptism_date,
  m.address,

  m.home_region,
  m.home_town,
  m.residence_type,
  m.telegram_username,

  m.emergency_contact_name,
  m.emergency_contact_phone,
  m.emergency_contact_relation,

  m.new_christian,
  m.previous_church,
  m.high_school_ministry,
  m.high_school_ministry_role,
  m.church_ministry,
  m.church_ministry_role,
  m.spiritual_journey,
  m.alumni_contact_consent,

  m.status,
  m.created_at,
  m.updated_at
`;

const MEMBER_JOINS = `
  FROM members m

  INNER JOIN users u
    ON m.user_id = u.id

  LEFT JOIN roles r
    ON u.role_id = r.id

  LEFT JOIN fellowships f
    ON m.fellowship_id = f.id

  LEFT JOIN departments d
    ON m.department_id = d.id
`;

const toTinyInt = (value) =>
  value === null || value === undefined
    ? null
    : value
      ? 1
      : 0;

/**
 * Create User + Member
 * Member number is generated automatically from the campus code:
 * MAIN-2026-0001, HEALTH-2026-0001, AGRI-2026-0001 ...
 *
 * A Fellowship Admin or Staff account is also given access to the campus
 * it was created in (user_fellowship_access), in the same transaction.
 */
const createMember = async ({
  firstName,
  middleName,
  lastName,
  email,
  password,
  roleId,
  phone,
  profileImage,
  gender,
  dateOfBirth,
  baptismDate,
  address,
  status,

  fellowshipId,
  departmentId,
  studentId,
  academicStatus,
  entryYear,
  graduationYear,
  homeRegion,
  homeTown,
  residenceType,
  telegramUsername,
  emergencyContactName,
  emergencyContactPhone,
  emergencyContactRelation,
  newChristian,
  previousChurch,
  highSchoolMinistry,
  highSchoolMinistryRole,
  churchMinistry,
  churchMinistryRole,
  spiritualJourney,
  alumniContactConsent,

  // Who created this account (stored with the fellowship access row).
  createdBy,
}) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    /**
     * Create user
     */
    const userQuery = `
      INSERT INTO users (
        first_name,
        middle_name,
        last_name,
        email,
        password,
        role_id,
        phone,
        profile_image
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [userResult] =
      await connection.execute(
        userQuery,
        [
          firstName,
          middleName || null,
          lastName,
          email,
          password,
          roleId,
          phone || null,
          profileImage || null,
        ]
      );

    const userId =
      userResult.insertId;

    /**
     * Campus code for the member number.
     */
    const [fellowshipRows] =
      await connection.execute(
        "SELECT code FROM fellowships WHERE id = ? LIMIT 1",
        [fellowshipId]
      );

    const campusCode =
      fellowshipRows[0]?.code;

    if (
      !campusCode ||
      !/^[A-Z0-9]+$/.test(campusCode)
    ) {
      const error = new Error(
        "Selected campus fellowship was not found."
      );

      error.statusCode = 400;
      throw error;
    }

    /**
     * Generate next member number for this campus.
     *
     * Format: CODE-YEAR-0001 (the sequence keeps counting across years).
     */
    const [sequenceRows] =
      await connection.execute(
        `
          SELECT
            MAX(
              CAST(
                SUBSTRING_INDEX(member_number, '-', -1)
                AS UNSIGNED
              )
            ) AS max_sequence
          FROM members
          WHERE member_number REGEXP ?
        `,
        [`^${campusCode}-[0-9]{4}-[0-9]+$`]
      );

    const nextSequence =
      Number(
        sequenceRows[0]?.max_sequence || 0
      ) + 1;

    const currentYear =
      new Date().getFullYear();

    const memberNumber =
      `${campusCode}-${currentYear}-${String(
        nextSequence
      ).padStart(4, "0")}`;

    /**
     * Create member
     */
    const memberQuery = `
      INSERT INTO members (
        user_id,
        fellowship_id,
        department_id,
        student_id,
        academic_status,
        entry_year,
        graduation_year,
        member_number,
        gender,
        phone,
        date_of_birth,
        baptism_date,
        address,
        home_region,
        home_town,
        residence_type,
        telegram_username,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        new_christian,
        previous_church,
        high_school_ministry,
        high_school_ministry_role,
        church_ministry,
        church_ministry_role,
        spiritual_journey,
        alumni_contact_consent,
        status
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `;

    const [memberResult] =
      await connection.execute(
        memberQuery,
        [
          userId,
          fellowshipId,
          departmentId ?? null,
          studentId ?? null,
          academicStatus || "Student",
          entryYear ?? null,
          graduationYear ?? null,
          memberNumber,
          gender || null,
          phone || null,
          dateOfBirth || null,
          baptismDate || null,
          address || null,
          homeRegion ?? null,
          homeTown ?? null,
          residenceType ?? null,
          telegramUsername ?? null,
          emergencyContactName ?? null,
          emergencyContactPhone ?? null,
          emergencyContactRelation ?? null,
          toTinyInt(newChristian),
          previousChurch ?? null,
          highSchoolMinistry ?? null,
          highSchoolMinistryRole ?? null,
          churchMinistry ?? null,
          churchMinistryRole ?? null,
          spiritualJourney ?? null,
          alumniContactConsent ? 1 : 0,
          status || "Active",
        ]
      );

    /**
     * Fellowship Admin / Staff: give access to the campus they were
     * created in. A Super Admin can add more campuses later.
     */
    const accessLevel =
      getAccessLevelForRole(roleId);

    if (accessLevel) {
      await connection.execute(
        `
          INSERT INTO user_fellowship_access
            (user_id, fellowship_id, access_level, created_by)
          VALUES (?, ?, ?, ?)
        `,
        [
          userId,
          fellowshipId,
          accessLevel,
          createdBy ?? null,
        ]
      );
    }

    // A Main Leader is also listed in fellowship_leaders (campus leaders,
    // General Fellowship).
    if (Number(roleId) === ROLE_IDS.MAIN_LEADER) {
      await connection.execute(
        `
          INSERT INTO fellowship_leaders
            (fellowship_id, member_id, status, started_at)
          VALUES (?, ?, 'Active', CURDATE())
        `,
        [fellowshipId, memberResult.insertId]
      );
    }

    await connection.commit();

    return {
      userId,
      memberId:
        memberResult.insertId,
      memberNumber,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get member by ID
 */
const getMemberById = async (
  memberId
) => {
  const query = `
    SELECT
      ${MEMBER_FIELDS},

      u.last_login_at,
      u.email_verified_at,
      u.invited_at,
      u.invite_count

    ${MEMBER_JOINS}

    WHERE m.id = ?

    LIMIT 1
  `;

  const [rows] =
    await db.execute(
      query,
      [memberId]
    );

  return rows[0] || null;
};

/**
 * Get member by authenticated user ID
 *
 * Used by the Member dashboard.
 *
 * This is important because a Member should
 * only access their own member information.
 */
const getMemberByUserId = async (
  userId
) => {
  const query = `
    SELECT
      ${MEMBER_FIELDS}

    ${MEMBER_JOINS}

    WHERE m.user_id = ?

    LIMIT 1
  `;

  const [rows] =
    await db.execute(
      query,
      [userId]
    );

  return rows[0] || null;
};

/**
 * Update member
 *
 * Member number is NOT updated.
 * It is a permanent system-generated identity.
 *
 * The campus (fellowship_id) is NOT updated here either: moving a member
 * to another campus also affects their department and small group, so it
 * will be a separate, deliberate "transfer" action.
 */
const updateMember = async (
  memberId,
  userId,
  {
    firstName,
    middleName,
    lastName,
    email,
    roleId,
    phone,
    profileImage,
    gender,
    dateOfBirth,
    baptismDate,
    address,
    status,

    departmentId,
    studentId,
    academicStatus,
    entryYear,
    graduationYear,
    homeRegion,
    homeTown,
    residenceType,
    telegramUsername,
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelation,
    newChristian,
    previousChurch,
    highSchoolMinistry,
    highSchoolMinistryRole,
    churchMinistry,
    churchMinistryRole,
    spiritualJourney,
    alumniContactConsent,
  }
) => {
  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    /**
     * Update user
     *
     * profileImage can be:
     * - existing image URL
     * - new Cloudinary image URL
     * - null when image is removed
     */
    const userQuery = `
      UPDATE users
      SET
        first_name = ?,
        middle_name = ?,
        last_name = ?,
        email = ?,
        role_id = ?,
        phone = ?,
        profile_image = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await connection.execute(
      userQuery,
      [
        firstName,
        middleName || null,
        lastName,
        email,
        roleId,
        phone || null,
        profileImage || null,
        userId,
      ]
    );

    /**
     * Update member
     *
     * member_number and fellowship_id intentionally excluded.
     */
    const memberQuery = `
      UPDATE members
      SET
        gender = ?,
        phone = ?,
        date_of_birth = ?,
        baptism_date = ?,
        address = ?,
        status = ?,
        department_id = ?,
        student_id = ?,
        academic_status = ?,
        entry_year = ?,
        graduation_year = ?,
        home_region = ?,
        home_town = ?,
        residence_type = ?,
        telegram_username = ?,
        emergency_contact_name = ?,
        emergency_contact_phone = ?,
        emergency_contact_relation = ?,
        new_christian = ?,
        previous_church = ?,
        high_school_ministry = ?,
        high_school_ministry_role = ?,
        church_ministry = ?,
        church_ministry_role = ?,
        spiritual_journey = ?,
        alumni_contact_consent = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] =
      await connection.execute(
        memberQuery,
        [
          gender || null,
          phone || null,
          dateOfBirth || null,
          baptismDate || null,
          address || null,
          status || "Active",
          departmentId ?? null,
          studentId ?? null,
          academicStatus || "Student",
          entryYear ?? null,
          graduationYear ?? null,
          homeRegion ?? null,
          homeTown ?? null,
          residenceType ?? null,
          telegramUsername ?? null,
          emergencyContactName ?? null,
          emergencyContactPhone ?? null,
          emergencyContactRelation ?? null,
          toTinyInt(newChristian),
          previousChurch ?? null,
          highSchoolMinistry ?? null,
          highSchoolMinistryRole ?? null,
          churchMinistry ?? null,
          churchMinistryRole ?? null,
          spiritualJourney ?? null,
          alumniContactConsent ? 1 : 0,
          memberId,
        ]
      );

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Delete member
 */
const deleteMember = async (
  memberId
) => {
  const query = `
    DELETE FROM members
    WHERE id = ?
  `;

  const [result] =
    await db.execute(
      query,
      [memberId]
    );

  return result;
};

/**
 * "m.column IN (?, ?, ?)" for a list of ids.
 *
 * An EMPTY list matches nothing ("1 = 0"). This is deliberate: a person
 * with no access to any fellowship must get an empty list, never everyone.
 */
const inList = (column, ids, conditions, queryParams) => {
  if (ids.length === 0) {
    conditions.push("1 = 0");
    return;
  }

  conditions.push(
    `${column} IN (${ids.map(() => "?").join(", ")})`
  );

  queryParams.push(...ids);
};

/**
 * Build the WHERE part shared by the list and the count.
 *
 * fellowshipIds / smallGroupIds:
 *   undefined -> no restriction
 *   an array  -> only members of those fellowships / small groups
 *                (an empty array returns nobody)
 */
const buildMemberFilters = ({
  search,
  status,
  roleId,
  fellowshipId,
  fellowshipIds,
  smallGroupIds,
  departmentId,
  academicStatus,
  batch,
  position,
}) => {
  const conditions = [];
  const queryParams = [];

  if (search) {
    conditions.push(`
      (
        u.first_name LIKE ?
        OR u.middle_name LIKE ?
        OR u.last_name LIKE ?
        OR u.email LIKE ?
        OR m.member_number LIKE ?
        OR m.phone LIKE ?
        OR m.student_id LIKE ?
      )
    `);

    const searchTerm =
      `%${search}%`;

    for (let i = 0; i < 7; i += 1) {
      queryParams.push(searchTerm);
    }
  }

  if (status) {
    conditions.push("m.status = ?");
    queryParams.push(status);
  }

  if (roleId) {
    conditions.push("u.role_id = ?");
    queryParams.push(roleId);
  }

  if (fellowshipId) {
    conditions.push("m.fellowship_id = ?");
    queryParams.push(fellowshipId);
  }

  if (Array.isArray(fellowshipIds)) {
    inList("m.fellowship_id", fellowshipIds, conditions, queryParams);
  }

  if (Array.isArray(smallGroupIds)) {
    if (smallGroupIds.length === 0) {
      conditions.push("1 = 0");
    } else {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM small_group_members sgf
          WHERE sgf.member_id = m.id
            AND sgf.small_group_id IN (${smallGroupIds.map(() => "?").join(", ")})
        )
      `);
      queryParams.push(...smallGroupIds);
    }
  }

  if (departmentId) {
    conditions.push("m.department_id = ?");
    queryParams.push(departmentId);
  }

  if (academicStatus) {
    conditions.push("m.academic_status = ?");
    queryParams.push(academicStatus);
  }

  /*
   * Batch = the year the student started at the university, in E.C.
   * (for example 2016). It is stored as entry_year.
   */
  if (batch) {
    conditions.push("m.entry_year = ?");
    queryParams.push(batch);
  }

  if (position === "small_group_leader") {
    conditions.push(`
      EXISTS (
        SELECT 1 FROM small_group_leaders sgx
        WHERE sgx.member_id = m.id AND sgx.status = 'Active'
      )
    `);
  } else if (position === "ministry_leader") {
    conditions.push(`
      EXISTS (
        SELECT 1 FROM ministry_members mmx
        WHERE mmx.member_id = m.id
          AND mmx.assignment_role = 'Ministry Leader'
          AND mmx.status = 'Active'
      )
    `);
  } else if (position === "no_small_group") {
    conditions.push(`
      (
        m.fellowship_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM small_group_members sgn WHERE sgn.member_id = m.id
        )
      )
    `);
  } else if (position === "no_family") {
    if (Array.isArray(smallGroupIds) && smallGroupIds.length > 0) {
      // An overseer's list: not in any family of the small groups they lead.
      conditions.push(`
        NOT EXISTS (
          SELECT 1
          FROM family_members fmx
          INNER JOIN families fax ON fax.id = fmx.family_id
          WHERE fmx.member_id = m.id
            AND fax.small_group_id IN (${smallGroupIds.map(() => "?").join(", ")})
        )
      `);
      queryParams.push(...smallGroupIds);
    } else {
      conditions.push(`
        (
          m.fellowship_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM family_members fmx WHERE fmx.member_id = m.id
          )
        )
      `);
    }
  }

  return {
    whereClause:
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "",
    queryParams,
  };
};

/**
 * Get all members
 *
 * IMPORTANT:
 * This function accepts ONE options object.
 *
 * This matches memberService.getAllMembers().
 */
const getAllMembers = async ({
  limit = 10,
  offset = 0,
  search = "",
  status = "",
  roleId = "",
  fellowshipId = "",
  fellowshipIds,
  smallGroupIds,
  departmentId = "",
  academicStatus = "",
  batch = "",
  position = "",
  sortBy = "created_at",
  sortOrder = "desc",
} = {}) => {
  const { whereClause, queryParams } =
    buildMemberFilters({
      search,
      status,
      roleId,
      fellowshipId,
      fellowshipIds,
      smallGroupIds,
      departmentId,
      academicStatus,
      batch,
      position,
    });

  /**
   * Sorting whitelist
   *
   * Only these values can reach
   * the SQL ORDER BY clause.
   */
  const allowedSortFields = {
    first_name: "u.first_name",
    last_name: "u.last_name",
    member_number: "m.member_number",
    email: "u.email",
    created_at: "m.created_at",
    entry_year: "m.entry_year",
    graduation_year: "m.graduation_year",
    fellowship: "f.name",
  };

  const sortColumn =
    allowedSortFields[sortBy] ||
    allowedSortFields.created_at;

  const sortDirection =
    sortOrder === "desc"
      ? "DESC"
      : "ASC";

  const safeLimit = Number.parseInt(limit, 10);
  const safeOffset = Number.parseInt(offset, 10);

  if (
    !Number.isSafeInteger(safeLimit) ||
    safeLimit < 1 ||
    !Number.isSafeInteger(safeOffset) ||
    safeOffset < 0
  ) {
    const error = new Error("Invalid pagination parameters.");
    error.statusCode = 400;
    throw error;
  }

  const query = `
    SELECT
      ${MEMBER_FIELDS},

      u.last_login_at,
      u.email_verified_at,
      u.invited_at

    ${MEMBER_JOINS}

    ${whereClause}

    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `;

  const [rows] = await db.query(query, queryParams);

  return rows;
};

/**
 * Count members
 *
 * IMPORTANT:
 * This function accepts ONE options object.
 *
 * This matches memberService.countMembers().
 */
const countMembers = async ({
  search = "",
  status = "",
  roleId = "",
  fellowshipId = "",
  fellowshipIds,
  smallGroupIds,
  departmentId = "",
  academicStatus = "",
  batch = "",
  position = "",
} = {}) => {
  const { whereClause, queryParams } =
    buildMemberFilters({
      search,
      status,
      roleId,
      fellowshipId,
      fellowshipIds,
      smallGroupIds,
      departmentId,
      academicStatus,
      batch,
      position,
    });

  const query = `
    SELECT COUNT(*) AS total

    FROM members m

    INNER JOIN users u
      ON m.user_id = u.id

    LEFT JOIN departments d
      ON m.department_id = d.id

    ${whereClause}
  `;

  const [rows] =
    await db.execute(
      query,
      queryParams
    );

  return Number(
    rows[0]?.total || 0
  );
};

/**
 * Is this member in at least one of the given small groups?
 */
const isInSmallGroups = async (memberId, groupIds) => {
  if (!Array.isArray(groupIds) || groupIds.length === 0) return false;

  const [rows] = await db.query(
    `
      SELECT 1 FROM small_group_members
      WHERE member_id = ? AND small_group_id IN (?)
      LIMIT 1
    `,
    [memberId, groupIds]
  );

  return rows.length > 0;
};

module.exports = {
  createMember,
  getMemberById,
  getMemberByUserId,
  updateMember,
  deleteMember,
  getAllMembers,
  countMembers,
  isInSmallGroups,
};