const crypto = require("crypto");

const memberService = require("../services/memberService");
const memberAccessService = require("../services/memberAccessService");
const { deliverInvitation } = require("../services/invitationEmailService");
const normalizeEmail = require("../utils/normalizeEmail");
const { TOKEN_TYPES } = require("../utils/accountToken");
const {
  pickProfileFields,
  ACADEMIC_STATUSES,
} = require("../utils/memberProfileFields");
const {
  deleteUnusedTokensByUserAndType,
} = require("../models/accountTokenModel");

const {
  successResponse,
  errorResponse,
} = require("../utils/response");

/**
 * Create member
 *
 * The admin chooses the member's campus fellowship (required).
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
      Number(roleId) < 1 ||
      Number(roleId) > 5
    ) {
      return errorResponse(
        res,
        "Role ID must be between 1 and 5",
        400
      );
    }

    // Only an administrator can create another administrator.
    if (
      Number(roleId) === 1 &&
      Number(req.user.roleId) !== 1
    ) {
      return errorResponse(
        res,
        "Only an administrator can create an administrator account.",
        403
      );
    }

    if (!profile.fellowshipId) {
      return errorResponse(
        res,
        "Please select the member's campus fellowship",
        400
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
 * Get member by ID
 */
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const member =
      await memberService.getMemberById(id);

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
 * Admin can edit everyone. A Pastor can edit everyone except
 * Administrator accounts.
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
     * Load the member as it is now. Used for the Administrator
     * protection, the campus check and to notice an email change.
     */
    const existing = await memberService.getMemberById(id);
    const requesterIsAdmin = Number(req.user.roleId) === 1;

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

    if (!requesterIsAdmin && Number(existing.role_id) === 1) {
      return errorResponse(
        res,
        "Only an administrator can edit an administrator account.",
        403
      );
    }

    if (
      !requesterIsAdmin &&
      roleId !== undefined &&
      Number(roleId) === 1
    ) {
      return errorResponse(
        res,
        "Only an administrator can assign the Admin role.",
        403
      );
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
 * Same safety rules as the Member Access page: removes the sign-in
 * account too, and refuses members who have signed in before.
 */
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

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
 * Supports:
 * - Pagination
 * - Search
 * - Status, role, campus, department and academic-status filters
 * - Sorting
 *
 * IMPORTANT:
 * The service expects ONE options object.
 */
const getAllMembers = async (req, res) => {
  try {
    const page =
      req.query.page !== undefined
        ? Number(req.query.page)
        : 1;

    const limit =
      req.query.limit !== undefined
        ? Number(req.query.limit)
        : 10;

    const search =
      req.query.search !== undefined
        ? req.query.search.trim()
        : "";

    const status =
      req.query.status !== undefined
        ? req.query.status.trim()
        : "";

    const roleId =
      req.query.roleId !== undefined
        ? Number(req.query.roleId)
        : "";

    const fellowshipId =
      req.query.fellowshipId !== undefined &&
      req.query.fellowshipId !== ""
        ? Number(req.query.fellowshipId)
        : "";

    const departmentId =
      req.query.departmentId !== undefined &&
      req.query.departmentId !== ""
        ? Number(req.query.departmentId)
        : "";

    const academicStatus =
      req.query.academicStatus !== undefined
        ? req.query.academicStatus.trim()
        : "";

    const sortBy =
      req.query.sortBy !== undefined
        ? req.query.sortBy.trim()
        : "created_at";

    const sortOrder =
      req.query.sortOrder !== undefined
        ? req.query.sortOrder.trim().toLowerCase()
        : "desc";

    /**
     * Validate page
     */
    if (
      !Number.isInteger(page) ||
      page < 1
    ) {
      return errorResponse(
        res,
        "Page must be greater than or equal to 1",
        400
      );
    }

    /**
     * Validate limit
     */
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return errorResponse(
        res,
        "Limit must be between 1 and 100",
        400
      );
    }

    /**
     * Validate status
     */
    if (
      status &&
      status !== "Active" &&
      status !== "Inactive"
    ) {
      return errorResponse(
        res,
        "Status must be either Active or Inactive",
        400
      );
    }

    /**
     * Validate role ID
     *
     * 1 = Admin
     * 2 = Pastor
     * 3 = Church Elder
     * 4 = Ministry Leader
     * 5 = Member
     */
    if (
      roleId !== "" &&
      (
        !Number.isInteger(roleId) ||
        roleId < 1 ||
        roleId > 5
      )
    ) {
      return errorResponse(
        res,
        "Role ID must be between 1 and 5",
        400
      );
    }

    /**
     * Validate campus and department filters
     */
    if (
      fellowshipId !== "" &&
      (
        !Number.isInteger(fellowshipId) ||
        fellowshipId < 1
      )
    ) {
      return errorResponse(
        res,
        "Fellowship ID must be a positive integer",
        400
      );
    }

    if (
      departmentId !== "" &&
      (
        !Number.isInteger(departmentId) ||
        departmentId < 1
      )
    ) {
      return errorResponse(
        res,
        "Department ID must be a positive integer",
        400
      );
    }

    if (
      academicStatus &&
      !ACADEMIC_STATUSES.includes(academicStatus)
    ) {
      return errorResponse(
        res,
        "Academic status must be either Student or Graduate",
        400
      );
    }

    /**
     * Validate sort field
     */
    const allowedSortFields = [
      "first_name",
      "last_name",
      "member_number",
      "email",
      "created_at",
      "graduation_year",
      "fellowship",
    ];

    if (
      !allowedSortFields.includes(sortBy)
    ) {
      return errorResponse(
        res,
        `Invalid sort field. Allowed fields are ${allowedSortFields.join(", ")}`,
        400
      );
    }

    /**
     * Validate sort order
     */
    if (
      sortOrder !== "asc" &&
      sortOrder !== "desc"
    ) {
      return errorResponse(
        res,
        "Sort order must be either asc or desc",
        400
      );
    }

    const result =
      await memberService.getAllMembers({
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

module.exports = {
  createMember,
  getMemberById,
  updateMember,
  deleteMember,
  getAllMembers,
};