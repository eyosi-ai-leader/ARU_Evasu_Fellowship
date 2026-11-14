const db = require("../config/db");

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

  m.small_group_id,
  sg.name AS small_group_name,

  m.department_id,
  d.name AS department_name,
  m.student_id,
  m.academic_status,
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

  LEFT JOIN small_groups sg
    ON m.small_group_id = sg.id

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
  alumniContactConsent,
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
        alumni_contact_consent,
        status
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?
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
          alumniContactConsent ? 1 : 0,
          status || "Active",
        ]
      );

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
 * Build the WHERE part shared by the list and the count.
 */
const buildMemberFilters = ({
  search,
  status,
  roleId,
  fellowshipId,
  departmentId,
  academicStatus,
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

  if (departmentId) {
    conditions.push("m.department_id = ?");
    queryParams.push(departmentId);
  }

  if (academicStatus) {
    conditions.push("m.academic_status = ?");
    queryParams.push(academicStatus);
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
  departmentId = "",
  academicStatus = "",
  sortBy = "created_at",
  sortOrder = "desc",
} = {}) => {
  const { whereClause, queryParams } =
    buildMemberFilters({
      search,
      status,
      roleId,
      fellowshipId,
      departmentId,
      academicStatus,
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
  departmentId = "",
  academicStatus = "",
} = {}) => {
  const { whereClause, queryParams } =
    buildMemberFilters({
      search,
      status,
      roleId,
      fellowshipId,
      departmentId,
      academicStatus,
    });

  const query = `
    SELECT COUNT(*) AS total

    FROM members m

    INNER JOIN users u
      ON m.user_id = u.id

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

module.exports = {
  createMember,
  getMemberById,
  getMemberByUserId,
  updateMember,
  deleteMember,
  getAllMembers,
  countMembers,
};