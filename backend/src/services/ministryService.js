const db = require("../config/db");
const ministryModel = require("../models/ministryModel");
const cloudinary = require("../config/cloudinary");

const ASSIGNMENT_ROLES = ["Member", "Ministry Leader"];

const MINISTRY_IMAGE_FOLDER = "chms/ministries";

/* ------------------------------------------------------------------ */
/* Ministry cover image (Cloudinary)                                    */
/* ------------------------------------------------------------------ */

// ".../upload/v123/chms/ministries/abc.jpg" -> "chms/ministries/abc"
const publicIdFromUrl = (url) => {
  const match = String(url || "").match(
    /\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+?)\.[a-z0-9]+(?:\?.*)?$/i
  );

  return match ? match[1] : null;
};

// Best effort: a failed cleanup never breaks the request. Only images this
// feature uploaded (inside the ministries folder) are ever deleted.
const removeStoredImage = async (url) => {
  const publicId = publicIdFromUrl(url);

  if (!publicId || !publicId.startsWith(`${MINISTRY_IMAGE_FOLDER}/`)) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Ministry image cleanup failed:", error.message);
  }
};

const uploadMinistryImage = async (file) => {
  if (!file) return null;

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: MINISTRY_IMAGE_FOLDER, resource_type: "image" },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded))
      )
      .end(file.buffer);
  });

  return result.secure_url;
};

const httpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateId = (value, label = "ID") => {
  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    throw httpError(`${label} must be a positive integer.`);
  }

  return id;
};

/* ------------------------------------------------------------------ */
/* Campus scope                                                         */
/* ------------------------------------------------------------------ */

const getGeneralFellowshipId = async () => {
  const [rows] = await db.execute(
    `SELECT id FROM fellowships
     WHERE fellowship_type = 'general' AND status = 'Active'
     LIMIT 1`
  );

  return rows[0] ? Number(rows[0].id) : null;
};

// Fellowships whose ministries this person manages. null = all (Super Admin).
const manageableFellowshipIds = async (access) => {
  if (access.scope.all) return null;

  const ids = [...access.scope.memberFellowshipIds];

  if (access.capabilities.includes("general:manage")) {
    const generalId = await getGeneralFellowshipId();

    if (generalId && !ids.includes(generalId)) ids.push(generalId);
  }

  return ids;
};

const canManageMinistry = async (access, ministry) => {
  const ids = await manageableFellowshipIds(access);

  if (ids === null) return true;

  return Boolean(
    ministry.fellowship_id && ids.includes(Number(ministry.fellowship_id))
  );
};

const assertCanManageMinistry = async (access, ministry) => {
  if (!(await canManageMinistry(access, ministry))) {
    throw httpError("You can only manage ministries of your own campus.", 403);
  }
};

// A ministry accepts members of its own campus. The General Fellowship
// accepts members of any campus.
const assertMemberFitsMinistry = (ministry, member) => {
  if (!ministry.fellowship_id) {
    throw httpError(
      "This ministry has no campus yet. Ask a Super Admin to assign one."
    );
  }

  if (ministry.fellowship_type === "general") return;

  if (Number(member.fellowship_id) !== Number(ministry.fellowship_id)) {
    throw httpError(
      "This member belongs to a different campus. A ministry accepts members of its own campus."
    );
  }
};

/* ------------------------------------------------------------------ */
/* Input                                                                */
/* ------------------------------------------------------------------ */

const cleanText = (value, max, label) => {
  const text = typeof value === "string" ? value.trim() : "";

  if (text.length > max) {
    throw httpError(`${label} cannot exceed ${max} characters.`);
  }

  return text;
};

const readMinistryInput = (input = {}) => {
  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (!name) throw httpError("Ministry name is required.");

  if (name.length > 100) {
    throw httpError("Ministry name cannot exceed 100 characters.");
  }

  return {
    name,
    description: cleanText(input.description, 2000, "Notes"),
    purpose: cleanText(input.purpose, 255, "Purpose"),
    verseReference: cleanText(input.verseReference, 100, "Verse reference"),
    verseText: cleanText(input.verseText, 600, "Verse text"),
    imageUrl: input.imageUrl ? cleanText(input.imageUrl, 500, "Image link") : "",
    meetingSchedule: cleanText(input.meetingSchedule, 150, "Meeting schedule"),
    meetingPlace: cleanText(input.meetingPlace, 150, "Meeting place"),
    contactPhone: cleanText(input.contactPhone, 30, "Contact phone"),
  };
};

/* ------------------------------------------------------------------ */
/* Ministries (campus managers)                                         */
/* ------------------------------------------------------------------ */

const loadMinistry = async (id) => {
  id = validateId(id, "Ministry ID");

  const ministry = await ministryModel.getMinistryById(id);

  if (!ministry) throw httpError("Ministry not found.", 404);

  return ministry;
};

const listMinistries = async (
  access,
  { search = "", status = "", fellowshipId = "" } = {}
) => {
  if (status && !["Active", "Inactive"].includes(status)) {
    throw httpError("Status must be Active or Inactive.");
  }

  const allowed = await manageableFellowshipIds(access);
  let fellowshipIds = allowed;

  // A campus picked in the filter narrows the list, but only to a campus
  // the person really manages.
  const requested = Number(fellowshipId);

  if (
    Number.isInteger(requested) &&
    requested > 0 &&
    (allowed === null || allowed.includes(requested))
  ) {
    fellowshipIds = [requested];
  }

  return ministryModel.listMinistries({ search, status, fellowshipIds });
};

const getMinistry = async (access, id) => {
  const ministry = await loadMinistry(id);

  await assertCanManageMinistry(access, ministry);

  return ministry;
};

const createMinistry = async (access, input = {}, file = null) => {
  const fellowshipId = validateId(input.fellowshipId, "Campus");
  const data = readMinistryInput(input);

  const allowed = await manageableFellowshipIds(access);

  if (allowed !== null && !allowed.includes(fellowshipId)) {
    throw httpError("You can only create ministries in your own campus.", 403);
  }

  const [rows] = await db.execute(
    "SELECT id FROM fellowships WHERE id = ? AND status = 'Active' LIMIT 1",
    [fellowshipId]
  );

  if (!rows[0]) throw httpError("Campus not found.", 404);

  const uploadedUrl = await uploadMinistryImage(file);

  try {
    return await ministryModel.createMinistry({
      fellowshipId,
      ...data,
      imageUrl: uploadedUrl || data.imageUrl,
    });
  } catch (error) {
    await removeStoredImage(uploadedUrl);
    throw error;
  }
};

// Saves the details and, when asked, replaces or removes the cover image.
const updateWithImage = async (ministry, input, file, saveDetails) => {
  const newUrl = await uploadMinistryImage(file);
  const clearImage = !newUrl && String(input.removeImage) === "true";

  try {
    await saveDetails();

    if (newUrl || clearImage) {
      await ministryModel.updateMinistryImage(ministry.id, newUrl);
    }
  } catch (error) {
    await removeStoredImage(newUrl);
    throw error;
  }

  if ((newUrl || clearImage) && ministry.image_url) {
    await removeStoredImage(ministry.image_url);
  }

  return ministryModel.getMinistryById(ministry.id);
};

const updateMinistry = async (access, id, input = {}, file = null) => {
  const ministry = await getMinistry(access, id);
  const data = readMinistryInput(input);

  return updateWithImage(ministry, input, file, () =>
    ministryModel.updateMinistry(ministry.id, data)
  );
};

const updateStatus = async (access, id, status) => {
  const ministry = await getMinistry(access, id);

  if (!["Active", "Inactive"].includes(status)) {
    throw httpError("Status must be Active or Inactive.");
  }

  return ministryModel.updateMinistryStatus(ministry.id, status);
};

const getMembers = async (access, id, role = "", status = "Active") => {
  const ministry = await getMinistry(access, id);

  if (role && !ASSIGNMENT_ROLES.includes(role)) {
    throw httpError("Invalid assignment role.");
  }

  if (!["Active", "Inactive", "All"].includes(status)) {
    throw httpError("Status must be Active, Inactive, or All.");
  }

  return ministryModel.getMinistryMembers(ministry.id, role, status);
};

/* ------------------------------------------------------------------ */
/* Assignments                                                          */
/* ------------------------------------------------------------------ */

/**
 * Put a member in a ministry.
 *
 * allowRoleChange (campus managers only): an active member can be promoted
 * to Ministry Leader, or a leader changed back to Member.
 */
const assignMemberToMinistry = async (
  ministry,
  memberId,
  assignmentRole,
  { allowRoleChange = false } = {}
) => {
  memberId = validateId(memberId, "Member ID");

  if (!ASSIGNMENT_ROLES.includes(assignmentRole)) {
    throw httpError("Assignment role must be Member or Ministry Leader.");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [ministries] = await connection.execute(
      "SELECT id, status FROM ministries WHERE id = ? FOR UPDATE",
      [ministry.id]
    );

    if (!ministries[0]) throw httpError("Ministry not found.", 404);

    if (ministries[0].status !== "Active") {
      throw httpError("Cannot assign people to an inactive ministry.");
    }

    const member = await ministryModel.getEligibleMember(
      memberId,
      connection
    );

    if (!member) throw httpError("Active member not found.", 404);

    assertMemberFitsMinistry(ministry, member);

    await connection.execute(
      "SELECT id FROM members WHERE id = ? FOR UPDATE",
      [memberId]
    );

    const [existing] = await connection.execute(
      `SELECT id, status, assignment_role
       FROM ministry_members
       WHERE ministry_id = ? AND member_id = ?
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [ministry.id, memberId]
    );

    if (existing[0]?.status === "Active") {
      if (
        allowRoleChange &&
        existing[0].assignment_role !== assignmentRole
      ) {
        await connection.execute(
          "UPDATE ministry_members SET assignment_role = ? WHERE id = ?",
          [assignmentRole, existing[0].id]
        );
      } else {
        throw httpError("This person is already assigned to this ministry.");
      }
    } else if (existing[0]) {
      await connection.execute(
        `UPDATE ministry_members
         SET assignment_role = ?, status = 'Active',
             assigned_at = CURRENT_TIMESTAMP, ended_at = NULL
         WHERE id = ?`,
        [assignmentRole, existing[0].id]
      );
    } else {
      await connection.execute(
        `INSERT INTO ministry_members
           (ministry_id, member_id, assignment_role, status)
         VALUES (?, ?, ?, 'Active')`,
        [ministry.id, memberId, assignmentRole]
      );
    }

    await connection.commit();

    return { ministryId: ministry.id, memberId, assignmentRole };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Permanently removes a person from a ministry (their place is deleted).
const deleteAssignment = async (ministryId, memberId) => {
  memberId = validateId(memberId, "Member ID");

  const removed = await ministryModel.deleteAssignment(ministryId, memberId);

  if (!removed) throw httpError("Ministry assignment not found.", 404);

  return { ministryId, memberId };
};

const endAssignment = async (ministryId, memberId) => {
  memberId = validateId(memberId, "Member ID");

  const [result] = await db.execute(
    `UPDATE ministry_members
     SET status = 'Inactive', ended_at = CURRENT_TIMESTAMP
     WHERE ministry_id = ? AND member_id = ? AND status = 'Active'`,
    [ministryId, memberId]
  );

  if (!result.affectedRows) {
    throw httpError("Active ministry assignment not found.", 404);
  }

  return { ministryId, memberId };
};

// Campus managers: add a member or appoint / change a Ministry Leader.
const assignMember = async (
  access,
  ministryId,
  memberId,
  assignmentRole = "Member"
) => {
  const ministry = await getMinistry(access, ministryId);

  return assignMemberToMinistry(ministry, memberId, assignmentRole, {
    allowRoleChange: true,
  });
};

const removeAssignment = async (access, ministryId, memberId) => {
  const ministry = await getMinistry(access, ministryId);

  return deleteAssignment(ministry.id, memberId);
};

// Campus managers: deactivate or reactivate a person's place (keeps the role).
const updateMemberStatus = async (access, ministryId, memberId, status) => {
  const ministry = await getMinistry(access, ministryId);
  memberId = validateId(memberId, "Member ID");

  if (!["Active", "Inactive"].includes(status)) {
    throw httpError("Status must be Active or Inactive.");
  }

  const assignment = await ministryModel.getMinistryAssignment(
    ministry.id,
    memberId
  );

  if (!assignment) throw httpError("Ministry assignment not found.", 404);

  if (assignment.status === status) {
    throw httpError(`This assignment is already ${status.toLowerCase()}.`);
  }

  if (status === "Active") {
    return assignMemberToMinistry(
      ministry,
      memberId,
      assignment.assignment_role
    );
  }

  return endAssignment(ministry.id, memberId);
};

// Permanently deletes a ministry together with its assignments.
const deleteMinistry = async (access, id) => {
  const ministry = await getMinistry(access, id);

  try {
    await ministryModel.deleteMinistry(ministry.id);
  } catch (error) {
    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.code === "ER_ROW_IS_REFERENCED"
    ) {
      throw httpError(
        "This ministry is still used elsewhere and cannot be deleted. Deactivate it instead.",
        409
      );
    }

    throw error;
  }

  await removeStoredImage(ministry.image_url);

  return { id: ministry.id };
};

const moveMember = async (access, fromMinistryId, toMinistryId, memberId) => {
  fromMinistryId = validateId(fromMinistryId, "Source ministry ID");
  toMinistryId = validateId(toMinistryId, "Target ministry ID");
  memberId = validateId(memberId, "Member ID");

  if (fromMinistryId === toMinistryId) {
    throw httpError("Source and target ministries must be different.");
  }

  const fromMinistry = await getMinistry(access, fromMinistryId);
  const toMinistry = await getMinistry(access, toMinistryId);

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [memberRows] = await connection.execute(
      "SELECT id, status, fellowship_id FROM members WHERE id = ? FOR UPDATE",
      [memberId]
    );

    if (!memberRows[0] || memberRows[0].status !== "Active") {
      throw httpError("Active member not found.", 404);
    }

    if (toMinistry.status !== "Active") {
      throw httpError("Cannot move a member to an inactive ministry.");
    }

    assertMemberFitsMinistry(toMinistry, memberRows[0]);

    const [sourceRows] = await connection.execute(
      `SELECT id, assignment_role FROM ministry_members
       WHERE ministry_id = ? AND member_id = ? AND status = 'Active'
       LIMIT 1 FOR UPDATE`,
      [fromMinistry.id, memberId]
    );

    if (!sourceRows[0]) {
      throw httpError("Active source assignment not found.", 404);
    }

    if (sourceRows[0].assignment_role === "Ministry Leader") {
      throw httpError(
        "End or change the leadership assignment separately before moving this person."
      );
    }

    const [targetRows] = await connection.execute(
      `SELECT id, status FROM ministry_members
       WHERE ministry_id = ? AND member_id = ?
       ORDER BY id DESC LIMIT 1 FOR UPDATE`,
      [toMinistry.id, memberId]
    );

    if (targetRows[0]?.status === "Active") {
      throw httpError("This person is already assigned to the target ministry.");
    }

    await connection.execute(
      `UPDATE ministry_members
       SET status = 'Inactive', ended_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [sourceRows[0].id]
    );

    if (targetRows[0]) {
      await connection.execute(
        `UPDATE ministry_members
         SET assignment_role = 'Member', status = 'Active',
             assigned_at = CURRENT_TIMESTAMP, ended_at = NULL
         WHERE id = ?`,
        [targetRows[0].id]
      );
    } else {
      await connection.execute(
        `INSERT INTO ministry_members
           (ministry_id, member_id, assignment_role, status)
         VALUES (?, ?, 'Member', 'Active')`,
        [toMinistry.id, memberId]
      );
    }

    await connection.commit();

    return {
      memberId,
      fromMinistryId: fromMinistry.id,
      toMinistryId: toMinistry.id,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Members who could be added: a campus manager of the ministry or its leader.
const getCandidates = async (access, ministryId, search = "") => {
  const ministry = await loadMinistry(ministryId);

  const allowed =
    (await canManageMinistry(access, ministry)) ||
    (await ministryModel.isLeaderOfMinistry(access.user.id, ministry.id));

  if (!allowed) {
    throw httpError("You are not authorized to manage this ministry.", 403);
  }

  const campusIds =
    ministry.fellowship_type === "general"
      ? await ministryModel.getRegularFellowshipIds()
      : [ministry.fellowship_id];

  return ministryModel.getCandidates({
    ministryId: ministry.id,
    campusIds,
    search: String(search || "").trim(),
  });
};

/* ------------------------------------------------------------------ */
/* Ministry Leaders: only the ministries they lead                      */
/* ------------------------------------------------------------------ */

const assertLeaderAccess = async (access, ministryId) => {
  ministryId = validateId(ministryId, "Ministry ID");

  const isLeader = await ministryModel.isLeaderOfMinistry(
    access.user.id,
    ministryId
  );

  if (!isLeader) {
    throw httpError("You are not authorized to manage this ministry.", 403);
  }

  return ministryId;
};

const getLeaderMinistries = async (access) =>
  ministryModel.getLeaderMinistries(access.user.id);

const getLeaderMembers = async (ministryId, access, status = "Active") => {
  const id = await assertLeaderAccess(access, ministryId);

  if (!["Active", "Inactive", "All"].includes(status)) {
    throw httpError("Status must be Active, Inactive, or All.");
  }

  return ministryModel.getMinistryMembers(id, "", status);
};

const updateLeaderMinistry = async (
  ministryId,
  access,
  input = {},
  file = null
) => {
  const id = await assertLeaderAccess(access, ministryId);
  const ministry = await loadMinistry(id);
  const data = readMinistryInput(input);

  return updateWithImage(ministry, input, file, () =>
    ministryModel.updateLeaderMinistry(id, data)
  );
};

// Leaders add existing members only; they cannot appoint other leaders.
const assignLeaderMember = async (ministryId, access, memberId) => {
  const id = await assertLeaderAccess(access, ministryId);
  const ministry = await loadMinistry(id);

  return assignMemberToMinistry(ministry, memberId, "Member");
};

const removeLeaderAssignment = async (ministryId, access, memberId) => {
  const id = await assertLeaderAccess(access, ministryId);
  memberId = validateId(memberId, "Member ID");

  const assignment = await ministryModel.getMinistryAssignment(id, memberId);

  if (!assignment) throw httpError("Ministry assignment not found.", 404);

  if (assignment.assignment_role !== "Member") {
    throw httpError(
      "Ministry Leaders cannot remove another person's leadership assignment.",
      403
    );
  }

  return deleteAssignment(id, memberId);
};

const updateLeaderAssignmentStatus = async (
  ministryId,
  access,
  memberId,
  status
) => {
  const id = await assertLeaderAccess(access, ministryId);
  memberId = validateId(memberId, "Member ID");

  if (!["Active", "Inactive"].includes(status)) {
    throw httpError("Status must be Active or Inactive.");
  }

  const assignment = await ministryModel.getMinistryAssignment(id, memberId);

  if (!assignment) throw httpError("Ministry assignment not found.", 404);

  if (assignment.assignment_role !== "Member") {
    throw httpError(
      "Ministry Leaders cannot change another person's leadership assignment.",
      403
    );
  }

  if (assignment.status === status) {
    throw httpError(`This assignment is already ${status.toLowerCase()}.`);
  }

  if (status === "Active") {
    const ministry = await loadMinistry(id);

    return assignMemberToMinistry(ministry, memberId, "Member");
  }

  return endAssignment(id, memberId);
};

// Campuses the person can manage (all four for a Super Admin).
const listCampuses = async (access) => {
  const ids = await manageableFellowshipIds(access);

  let query =
    "SELECT id, name, code, fellowship_type FROM fellowships WHERE status = 'Active'";
  const params = [];

  if (ids !== null) {
    query += " AND id IN (?)";
    params.push(ids.length > 0 ? ids : [0]);
  }

  query += " ORDER BY (fellowship_type = 'general') ASC, name ASC";

  const [rows] = await db.query(query, params);
  return rows;
};

module.exports = {
  listCampuses,
  listMinistries,
  getMinistry,
  createMinistry,
  updateMinistry,
  updateStatus,
  getMembers,
  assignMember,
  removeAssignment,
  updateMemberStatus,
  deleteMinistry,
  moveMember,
  getCandidates,
  getLeaderMinistries,
  getLeaderMembers,
  updateLeaderMinistry,
  assignLeaderMember,
  removeLeaderAssignment,
  updateLeaderAssignmentStatus,
};
