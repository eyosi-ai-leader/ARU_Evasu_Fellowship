const crypto = require("crypto");

const memberService = require("../services/memberService");
const memberAccessService = require("../services/memberAccessService");
const { deliverInvitation } = require("../services/invitationEmailService");
const { canManageFellowship } = require("../services/accessService");
const normalizeEmail = require("../utils/normalizeEmail");
const { TOKEN_TYPES } = require("../utils/accountToken");
const {
  pickProfileFields,
  ACADEMIC_STATUSES,
} = require("../utils/memberProfileFields");
const {
  MIN_ROLE_ID,
  MAX_ROLE_ID,
  MANAGER_ASSIGNABLE_ROLE_IDS,
  isPrivilegedRole,
} = require("../constants/roles");
const {
  deleteUnusedTokensByUserAndType,
} = require("../models/accountTokenModel");

const {
  successResponse,
  errorResponse,
} = require("../utils/response");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/* ------------------------------------------------------------------ */
/* Permission helpers                                                  */
/*                                                                     */
/* req.access is filled in by loadAccess (middleware/accessMiddleware) */
/* before any of these controllers run.                                */
/* ------------------------------------------------------------------ */

/**
 * Only a Super Admin may give out the Super Admin, Fellowship Admin and
 * Staff roles. Everyone else who manages members may give roles 2 to 5.
 */
const assertCanAssignRole = (access, roleId) => {
  if (access.isSuperAdmin) return;

  if (!MANAGER_ASSIGNABLE_ROLE_IDS.includes(Number(roleId))) {
    throw httpError(
      "Only a Super Admin can give the Super Admin, Fellowship Admin or Staff role.",
      403
    );
  }
};

/**
 * Load a member, but only if the signed-in person manages the member's
 * fellowship. A member of another fellowship is answered with "not found",
 * so nobody can find out who belongs to a fellowship they cannot see.
 */
const getMemberInScope = async (access, memberId) => {
  const member = await memberService.getMemberById(memberId);

  if (!canManageFellowship(access, member.fellowship_id)) {
    throw httpError("Member not found.", 404);
  }

  return member;
};

/**
 * Super Admin, Fellowship Admin and Staff accounts can only be edited or
 * deleted by a Super Admin.
 */
const assertNotPrivilegedTarget = (access, member) => {
  if (isPrivilegedRole(member.role_id) && !access.isSuperAdmin) {
    throw httpError(
      "Only a Super Admin can manage Super Admin, Fellowship Admin and Staff accounts.",
      403
    );
  }
};

/* ------------------------------------------------------------------ */
/* List query                                                          */
/* ------------------------------------------------------------------ */

/**
 * Read and check the list query (?page=&limit=&search=&...).
 * Throws a 400 error when something is not valid.
 */
const parseListQuery = (req) => {
  const text = (value, fallback = "") =>
    value !== undefined ? String(value).trim() : fallback;

  const number = (value) =>
    value !== undefined && value !== "" ? Number(value) : "";

  const page = req.query.page !== undefined ? Number(req.query.page) : 1;
  const limit = req.query.limit !== undefined ? Number(req.query.limit) : 10;
  const search = text(req.query.search);
  const status = text(req.query.status);
  const roleId = number(req.query.roleId);
  const fellowshipId = number(req.query.fellowshipId);
  const departmentId = number(req.query.departmentId);
  const academicStatus = text(req.query.academicStatus);
  const sortBy = text(req.query.sortBy, "created_at");
  const sortOrder = text(req.query.sortOrder, "desc").toLowerCase();

  if (!Number.isInteger(page) || page < 1) {
    throw httpError("Page must be greater than or equal to 1", 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw httpError("Limit must be between 1 and 100", 400);
  }

  if (status && status !== "Active" && status !== "Inactive") {
    throw httpError("Status must be either Active or Inactive", 400);
  }

  if (
    roleId !== "" &&
    (!Number.isInteger(roleId) || roleId < MIN_ROLE_ID || roleId > MAX_ROLE_ID)
  ) {
    throw httpError(
      `Role ID must be between ${MIN_ROLE_ID} and ${MAX_ROLE_ID}`,
      400
    );
  }

  if (
    fellowshipId !== "" &&
    (!Number.isInteger(fellowshipId) || fellowshipId < 1)
  ) {
    throw httpError("Fellowship ID must be a positive integer", 400);
  }

  if (
    departmentId !== "" &&
    (!Number.isInteger(departmentId) || departmentId < 1)
  ) {
    throw httpError("Department ID must be a positive integer", 400);
  }

  if (academicStatus && !ACADEMIC_STATUSES.includes(academicStatus)) {
    throw httpError(
      "Academic status must be either Student or Graduate",
      400
    );
  }

  const allowedSortFields = [
    "first_name",
    "last_name",
    "member_number",
    "email",
    "created_at",
    "graduation_year",
    "fellowship",
  ];

  if (!allowedSortFields.includes(sortBy)) {
    throw httpError(
      `Invalid sort field. Allowed fields are ${allowedSortFields.join(", ")}`,
      400
    );
  }

  if (sortOrder !== "asc" && sortOrder !== "desc") {
    throw httpError("Sort order must be either asc or desc", 400);
  }

  return {
    page,
    limit,
    search,
    status,
    roleId,
    fellowshipId,
    departmentId,
    academicStatus,
    sortBy,
    sortOrder,
  };
};

/* ------------------------------------------------------------------ */
/* Members (people who manage a fellowship)                            */
/* ------------------------------------------------------------------ */

/**
 * Create member
 *
 * The person creating the member must manage the chosen campus fellowship,
 * and may only give roles they are allowed to give.
 *
 * The admin does not choose a password. The account is created with a
 * random one nobody knows, and (if requested) an invitation email lets
 * the member set their own. Their email counts as verified once they do.
 *
 * Field checks (required fields, formats, graduation year...) are done by
 * createMemberValidator before this function runs.
 */
const createMember = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      phone,
      roleId,
      gender,
      dateOfBirth,
      baptismDate,
      address,
      status,
      sendInvitation,
    } = req.body;

    const profile = pickProfileFields(req.body);

    if (
      roleId === undefined ||
      roleId === null ||
      !Number.isInteger(Number(roleId)) ||
      Number(roleId) < MIN_ROLE_ID ||
      Number(roleId) > MAX_ROLE_ID
    ) {
      return errorResponse(
        res,
        `Role ID must be between ${MIN_ROLE_ID} and ${MAX_ROLE_ID}`,
        400
      );
    }

    assertCanAssignRole(req.access, roleId);

    if (!profile.fellowshipId) {
      return errorResponse(
        res,
        "Please select the member's campus fellowship",
        400
      );
    }

    if (!canManageFellowship(req.access, profile.fellowshipId)) {
      return errorResponse(
        res,
        "You can only add members to the fellowships you manage.",
        403
      );
    }

    /*
     * Same form the login page looks up, so the member can sign in
     * (for example, Gmail dots and capital letters are removed).
     */
    const normalizedEmail = normalizeEmail(email);

    const memberStatus =
      status !== undefined &&
      status !== ""
        ? status
        : "Active";

    /*
     * The admin decides whether to send the invitation now.
     * It defaults to "yes", and never applies to inactive members.
     */
    const wantsInvitation =
      sendInvitation === undefined ||
      sendInvitation === null ||
      sendInvitation === ""
        ? true
        : sendInvitation === true ||
          sendInvitation === "true";

    const invitationRequested =
      wantsInvitation &&
      memberStatus === "Active";

    const result =
      await memberService.createMember(
        {
          firstName: firstName.trim(),

          middleName:
            middleName !== undefined &&
            middleName !== null
              ? middleName.trim()
              : null,

          lastName: lastName.trim(),

          email: normalizedEmail,

          phone:
            phone !== undefined &&
            phone !== null &&
            phone !== ""
              ? phone.trim()
              : null,

          // Random and unknown to everyone: the member sets their own.
          password: crypto.randomBytes(32).toString("hex"),

          roleId: Number(roleId),

          gender:
            gender !== undefined &&
            gender !== ""
              ? gender
              : null,

          dateOfBirth:
            dateOfBirth || null,

          baptismDate:
            baptismDate || null,

          address:
            address !== undefined &&
            address !== null &&
            address !== ""
              ? address.trim()
              : null,

          status: memberStatus,

          // Campus, department, graduation, hometown, emergency contact...
          ...profile,

          // Stored with the fellowship access of Fellowship Admin / Staff.
          createdBy: req.user.id,
        },

        req.file || null
      );

    let invitationSent = false;

    if (invitationRequested) {
      try {
        await deliverInvitation({
          userId: result.userId,
          firstName: firstName.trim(),
          email: normalizedEmail,
          inviterId: req.user.id,
        });

        invitationSent = true;
      } catch (error) {
        console.error(
          "Failed to send invitation email:",
          error.message
        );
      }
    }

    let message;

    if (invitationSent) {
      message =
        "Member created. An invitation email was sent so they can set their password.";
    } else if (invitationRequested) {
      message =
        'Member created, but the invitation email could not be sent. Open "Member Access" to resend it.';
    } else if (memberStatus !== "Active") {
      message =
        "Member created as inactive. No invitation was sent.";
    } else {
      message =
        'Member created. No invitation was sent, so they can\'t sign in yet. Send one from "Member Access" when you are ready.';
    }

    return successResponse(
      res,
      message,
      {
        memberId: result.memberId,
        userId: result.userId,
        memberNumber: result.memberNumber,
        invitationRequested,
        invitationSent,
      },
      201
    );
  } catch (error) {
    console.error(
      "Create member error:",
      error
    );

    return errorResponse(
      res,
      error.message ||
        "Failed to create member",
      error.statusCode || 500
    );
  }
};

/**
 * Get member by ID (only inside the fellowships the person manages)
 */
const getMemberById = async (req, res) => {
  try {
    const member = await getMemberInScope(req.access, req.params.id);

    return successResponse(
      res,
      "Member retrieved successfully",
      member,
      200
    );
  } catch (error) {
    console.error(
      "Get member error:",
      error
    );

    return errorResponse(
      res,
      error.message ||
        "Failed to retrieve member",
      error.statusCode || 500
    );
  }
};

/**
 * Update member
 *
 * Only inside the fellowships the person manages. Super Admin, Fellowship
 * Admin and Staff accounts can only be edited by a Super Admin, and nobody
 * can change their own role here.
 *
 * Moving a member to another campus is not supported yet.
 *
 * Field checks are done by updateMemberValidator before this runs.
 */
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      firstName,
      middleName,
      lastName,
      email,
      phone,
      roleId,
      gender,
      dateOfBirth,
      baptismDate,
      address,
      status,
      removeProfileImage,
    } = req.body;

    // The campus is handled separately: it cannot be changed here.
    const { fellowshipId, ...profileFields } =
      pickProfileFields(req.body);

    /*
     * Load the member as it is now (and make sure the person may touch it).
     */
    const existing = await getMemberInScope(req.access, id);

    assertNotPrivilegedTarget(req.access, existing);

    if (
      fellowshipId !== undefined &&
      fellowshipId !== null &&
      Number(fellowshipId) !== Number(existing.fellowship_id)
    ) {
      return errorResponse(
        res,
        "Moving a member to another campus is not supported yet.",
        400
      );
    }

    if (
      roleId !== undefined &&
      Number(roleId) !== Number(existing.role_id)
    ) {
      if (Number(existing.user_id) === Number(req.user.id)) {
        return errorResponse(
          res,
          "You can't change your own role.",
          400
        );
      }

      assertCanAssignRole(req.access, roleId);
    }

    /*
     * Convert removeProfileImage from
     * FormData string to boolean.
     */
    const shouldRemoveProfileImage =
      removeProfileImage === true ||
      removeProfileImage === "true";

    await memberService.updateMember(
      id,
      {
        firstName:
          firstName !== undefined
            ? firstName.trim()
            : undefined,

        middleName:
          middleName !== undefined
            ? (
                middleName === null ||
                middleName === ""
                  ? null
                  : middleName.trim()
              )
            : undefined,

        lastName:
          lastName !== undefined
            ? lastName.trim()
            : undefined,

        email:
          email !== undefined
            ? normalizeEmail(email)
            : undefined,

        phone:
          phone !== undefined
            ? phone
            : undefined,

        roleId:
          roleId !== undefined
            ? Number(roleId)
            : undefined,

        gender,
        dateOfBirth,
        baptismDate,
        address,
        status,

        // Department, graduation, hometown, emergency contact...
        ...profileFields,

        removeProfileImage:
          shouldRemoveProfileImage,

        updatedBy: req.user.id,
      },

      /*
       * Uploaded profile image.
       *
       * Multer puts the uploaded file
       * inside req.file.
       */
      req.file || null
    );

    /*
     * If the email address changed, any invitation link or code that
     * was sent to the old address must stop working.
     */
    if (
      email !== undefined &&
      normalizeEmail(email) !== normalizeEmail(existing.email || "")
    ) {
      for (const type of Object.values(TOKEN_TYPES)) {
        await deleteUnusedTokensByUserAndType(existing.user_id, type);
      }
    }

    const updatedMember =
      await memberService.getMemberById(id);

    return successResponse(
      res,
      "Member updated successfully",
      updatedMember,
      200
    );
  } catch (error) {
    console.error(
      "Update member error:",
      error
    );

    return errorResponse(
      res,
      error.message ||
        "Failed to update member",
      error.statusCode || 500
    );
  }
};

/**
 * Delete member
 *
 * Only inside the fellowships the person manages, and never a Super Admin,
 * Fellowship Admin or Staff account unless the person is a Super Admin.
 *
 * Same safety rules as the Member Access page: removes the sign-in
 * account too, and refuses members who have signed in before.
 */
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getMemberInScope(req.access, id);

    assertNotPrivilegedTarget(req.access, existing);

    await memberAccessService.removeAccount(req.user, Number(id));

    return successResponse(
      res,
      "Member deleted successfully",
      null,
      200
    );
  } catch (error) {
    console.error(
      "Delete member error:",
      error
    );

    return errorResponse(
      res,
      error.message ||
        "Failed to delete member",
      error.statusCode || 500
    );
  }
};

/**
 * Get all members
 *
 * A Super Admin sees every fellowship. Everyone else sees only the
 * fellowships they manage. Asking for a fellowship outside that list is
 * refused.
 *
 * Supports: pagination, search, status / role / campus / department /
 * academic-status filters and sorting.
 */
const getAllMembers = async (req, res) => {
  try {
    const query = parseListQuery(req);

    if (
      query.fellowshipId !== "" &&
      !canManageFellowship(req.access, query.fellowshipId)
    ) {
      return errorResponse(
        res,
        "You don't have access to that fellowship.",
        403
      );
    }

    const result =
      await memberService.getAllMembers({
        ...query,

        // undefined = no restriction (Super Admin only)
        fellowshipIds: req.access.scope.all
          ? undefined
          : req.access.scope.memberFellowshipIds,
      });

    return res.status(200).json({
      success: true,
      message:
        "Members retrieved successfully",
      data: result.members,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error(
      "Get all members error:",
      error
    );

    return errorResponse(
      res,
      error.message ||
        "Failed to retrieve members",
      error.statusCode || 500
    );
  }
};

/* ------------------------------------------------------------------ */
/* Small group leader (works for ANY person who leads a small group)   */
/* ------------------------------------------------------------------ */

/**
 * What a small group leader may see about the members of their group:
 * who they are and how to reach them. Not the spiritual background,
 * emergency contacts, address or date of birth.
 */
const SMALL_GROUP_VIEW_FIELDS = [
  "id",
  "member_number",
  "first_name",
  "middle_name",
  "last_name",
  "email",
  "phone",
  "profile_image",
  "gender",
  "telegram_username",
  "fellowship_name",
  "small_group_id",
  "small_group_name",
  "department_name",
  "academic_status",
  "graduation_year",
  "status",
];

const toSmallGroupView = (member) =>
  Object.fromEntries(
    SMALL_GROUP_VIEW_FIELDS.map((field) => [field, member[field] ?? null])
  );

const getLedSmallGroupIds = (access) =>
  access.positions.smallGroups.map((group) => group.id);

/**
 * GET /api/members/my-small-group
 * The members of the small group(s) the signed-in person leads.
 */
const getMySmallGroupMembers = async (req, res) => {
  try {
    const query = parseListQuery(req);

    const result =
      await memberService.getAllMembers({
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: query.status,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,

        smallGroupIds: getLedSmallGroupIds(req.access),
      });

    return res.status(200).json({
      success: true,
      message: "Small group members retrieved successfully",
      data: result.members.map(toSmallGroupView),
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get small group members error:", error);

    return errorResponse(
      res,
      error.message || "Failed to retrieve small group members",
      error.statusCode || 500
    );
  }
};

/**
 * GET /api/members/my-small-group/:id
 * One member, only if they are in a small group the person leads.
 */
const getMySmallGroupMemberById = async (req, res) => {
  try {
    const member = await memberService.getMemberById(req.params.id);

    if (!getLedSmallGroupIds(req.access).includes(Number(member.small_group_id))) {
      throw httpError("Member not found.", 404);
    }

    return successResponse(
      res,
      "Member retrieved successfully",
      toSmallGroupView(member),
      200
    );
  } catch (error) {
    console.error("Get small group member error:", error);

    return errorResponse(
      res,
      error.message || "Failed to retrieve member",
      error.statusCode || 500
    );
  }
};

module.exports = {
  createMember,
  getMemberById,
  updateMember,
  deleteMember,
  getAllMembers,
  getMySmallGroupMembers,
  getMySmallGroupMemberById,
};
