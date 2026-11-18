const bcrypt = require("bcrypt");

const memberModel = require("../models/memberModel");
const fellowshipModel = require("../models/fellowshipModel");
const fellowshipAccessModel = require("../models/fellowshipAccessModel");

const {
  uploadImage,
  deleteImage,
} = require("./storageService");

const SALT_ROUNDS = 10;

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Check the campus (and department) chosen for a NEW member.
 *
 * - the campus must exist, be active, and be a regular campus fellowship
 *   (nobody is a direct member of the General Fellowship);
 * - the department must belong to that same campus;
 * - a student must pick a department when the campus has a department list.
 */
const assertCampusSelection = async ({
  fellowshipId,
  departmentId,
  academicStatus,
}) => {
  const fellowship = fellowshipId
    ? await fellowshipModel.getFellowshipById(fellowshipId)
    : null;

  if (!fellowship || fellowship.status !== "Active") {
    throw httpError(
      "Please select a valid campus fellowship.",
      400
    );
  }

  if (fellowship.fellowship_type !== "regular") {
    throw httpError(
      "Members belong to a campus fellowship, not to the General Fellowship.",
      400
    );
  }

  if (departmentId) {
    const belongs =
      await fellowshipModel.departmentBelongsToFellowship(
        departmentId,
        fellowship.id
      );

    if (!belongs) {
      throw httpError(
        "The selected department does not belong to the selected campus.",
        400
      );
    }
  } else if ((academicStatus || "Student") === "Student") {
    const departmentCount =
      await fellowshipModel.countActiveDepartments(
        fellowship.id
      );

    if (departmentCount > 0) {
      throw httpError(
        "Please select your department.",
        400
      );
    }
  }
};

/**
 * Create member
 *
 * Creates:
 * - User account
 * - Member record (in one campus fellowship)
 * - Optional profile image
 */
const createMember = async (
  memberData,
  profileImage = null
) => {
  /**
   * Check the campus and department BEFORE hashing the password
   * or uploading the image, so nothing is wasted on a bad request.
   */
  await assertCampusSelection(memberData);

  let uploadedImage = null;

  try {
    const hashedPassword =
      await bcrypt.hash(
        memberData.password,
        SALT_ROUNDS
      );

    /**
     * Upload profile image to Cloudinary
     * before creating the database records.
     */
    if (profileImage) {
      uploadedImage =
        await uploadImage(
          profileImage.buffer,
          {
            folder:
              "chms/member-profiles",
          }
        );
    }

    /**
     * Create user + member
     *
     * Profile image URL is stored
     * in the users table.
     */
    const result =
      await memberModel.createMember({
        ...memberData,
        password: hashedPassword,
        profileImage:
          uploadedImage?.secureUrl ||
          null,
      });

    return result;
  } catch (error) {
    /**
     * If Cloudinary upload succeeded
     * but database creation failed,
     * remove the uploaded image.
     */
    if (uploadedImage?.publicId) {
      try {
        await deleteImage(
          uploadedImage.publicId
        );
      } catch (cleanupError) {
        console.error(
          "Failed to clean up uploaded profile image:",
          cleanupError.message
        );
      }
    }

    /**
     * Handle duplicate email/member number.
     */
    if (error.code === "ER_DUP_ENTRY") {
      throw httpError(
        "Email or member number already exists.",
        409
      );
    }

    /**
     * Campus / department combination refused by the database.
     */
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      throw httpError(
        "The selected campus or department is not valid.",
        400
      );
    }

    throw error;
  }
};

/**
 * Get member by ID
 */
const getMemberById = async (
  memberId
) => {
  const member =
    await memberModel.getMemberById(
      memberId
    );

  if (!member) {
    throw httpError("Member not found.", 404);
  }

  return member;
};

/**
 * Extract Cloudinary public ID from a secure URL.
 *
 * Example:
 * https://res.cloudinary.com/demo/image/upload/v1234567890/chms/member-profiles/photo.jpg
 *
 * Returns:
 * chms/member-profiles/photo
 */
const getCloudinaryPublicId = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return null;
  }

  try {
    const url = new URL(imageUrl);

    const uploadPath = "/upload/";

    const uploadIndex =
      url.pathname.indexOf(uploadPath);

    if (uploadIndex === -1) {
      return null;
    }

    let publicPath =
      url.pathname.substring(
        uploadIndex + uploadPath.length
      );

    /**
     * Remove Cloudinary version:
     *
     * v1234567890/chms/member-profiles/photo.jpg
     *
     * becomes:
     * chms/member-profiles/photo.jpg
     */
    publicPath =
      publicPath.replace(
        /^v\d+\//,
        ""
      );

    /**
     * Remove file extension.
     */
    publicPath =
      publicPath.replace(
        /\.[^/.]+$/,
        ""
      );

    return decodeURIComponent(
      publicPath
    );
  } catch (error) {
    console.error(
      "Failed to extract Cloudinary public ID:",
      error.message
    );

    return null;
  }
};

/**
 * Keep the existing value unless a new one (even null = "clear") was sent.
 */
const keep = (incoming, existing) =>
  incoming !== undefined ? incoming : existing;

/**
 * Update member
 *
 * Supports:
 * - Personal information
 * - Account information
 * - Fellowship information (department, graduation, hometown, ...)
 * - Spiritual background (ministries, roles, journey)
 * - Profile image upload
 * - Profile image replacement
 * - Profile image removal
 *
 * The campus itself cannot be changed here.
 *
 * When the person's role changes to or from Fellowship Admin / Staff, their
 * fellowship access is kept in step with it.
 */
const updateMember = async (
  memberId,
  memberData,
  profileImage = null
) => {
  /**
   * First retrieve the existing member.
   *
   * This gives us:
   * - user_id
   * - existing member information
   * - existing profile image
   */
  const existingMember =
    await memberModel.getMemberById(
      memberId
    );

  if (!existingMember) {
    throw httpError("Member not found.", 404);
  }

  /**
   * A department can only be one of the member's own campus.
   */
  if (memberData.departmentId) {
    const belongs =
      await fellowshipModel.departmentBelongsToFellowship(
        memberData.departmentId,
        existingMember.fellowship_id
      );

    if (!belongs) {
      throw httpError(
        "The selected department does not belong to this member's campus.",
        400
      );
    }
  }

  /**
   * Existing Cloudinary image.
   */
  const oldProfileImage =
    existingMember.profile_image || null;

  /**
   * Determine whether the user requested
   * profile image removal.
   */
  const removeProfileImage =
    memberData.removeProfileImage === true;

  /**
   * This will contain the newly uploaded
   * Cloudinary image if one is uploaded.
   */
  let uploadedImage = null;

  try {
    /**
     * Upload new profile image first.
     *
     * We do this BEFORE changing the database.
     */
    if (profileImage) {
      uploadedImage =
        await uploadImage(
          profileImage.buffer,
          {
            folder:
              "chms/member-profiles",
          }
        );
    }

    /**
     * Determine which profile image URL
     * should be stored in the database.
     *
     * Case 1: New image uploaded -> save new image URL
     * Case 2: Remove requested   -> save null
     * Case 3: Nothing changed    -> keep existing image URL
     */
    let profileImageUrl =
      oldProfileImage;

    if (uploadedImage) {
      profileImageUrl =
        uploadedImage.secureUrl;
    } else if (
      removeProfileImage
    ) {
      profileImageUrl = null;
    }

    /**
     * Merge incoming data with
     * existing member data.
     */
    const updatedData = {
      firstName:
        memberData.firstName ??
        existingMember.first_name,

      middleName:
        memberData.middleName !== undefined
          ? memberData.middleName
          : existingMember.middle_name,

      lastName:
        memberData.lastName ??
        existingMember.last_name,

      email:
        memberData.email ??
        existingMember.email,

      phone:
        memberData.phone ??
        existingMember.phone,

      roleId:
        memberData.roleId ??
        existingMember.role_id,

      profileImage:
        profileImageUrl,

      gender:
        memberData.gender ??
        existingMember.gender,

      dateOfBirth:
        memberData.dateOfBirth ??
        existingMember.date_of_birth,

      baptismDate:
        memberData.baptismDate ??
        existingMember.baptism_date,

      address:
        memberData.address ??
        existingMember.address,

      status:
        memberData.status ??
        existingMember.status,

      /**
       * Fellowship fields
       */
      departmentId: keep(
        memberData.departmentId,
        existingMember.department_id
      ),

      studentId: keep(
        memberData.studentId,
        existingMember.student_id
      ),

      academicStatus:
        memberData.academicStatus ??
        existingMember.academic_status,

      graduationYear: keep(
        memberData.graduationYear,
        existingMember.graduation_year
      ),

      homeRegion: keep(
        memberData.homeRegion,
        existingMember.home_region
      ),

      homeTown: keep(
        memberData.homeTown,
        existingMember.home_town
      ),

      residenceType: keep(
        memberData.residenceType,
        existingMember.residence_type
      ),

      telegramUsername: keep(
        memberData.telegramUsername,
        existingMember.telegram_username
      ),

      emergencyContactName: keep(
        memberData.emergencyContactName,
        existingMember.emergency_contact_name
      ),

      emergencyContactPhone: keep(
        memberData.emergencyContactPhone,
        existingMember.emergency_contact_phone
      ),

      emergencyContactRelation: keep(
        memberData.emergencyContactRelation,
        existingMember.emergency_contact_relation
      ),

      newChristian: keep(
        memberData.newChristian,
        existingMember.new_christian
      ),

      previousChurch: keep(
        memberData.previousChurch,
        existingMember.previous_church
      ),

      /**
       * Spiritual background
       */
      highSchoolMinistry: keep(
        memberData.highSchoolMinistry,
        existingMember.high_school_ministry
      ),

      highSchoolMinistryRole: keep(
        memberData.highSchoolMinistryRole,
        existingMember.high_school_ministry_role
      ),

      churchMinistry: keep(
        memberData.churchMinistry,
        existingMember.church_ministry
      ),

      churchMinistryRole: keep(
        memberData.churchMinistryRole,
        existingMember.church_ministry_role
      ),

      spiritualJourney: keep(
        memberData.spiritualJourney,
        existingMember.spiritual_journey
      ),

      alumniContactConsent:
        memberData.alumniContactConsent ??
        Boolean(existingMember.alumni_contact_consent),
    };

    /**
     * Update database.
     */
    const result =
      await memberModel.updateMember(
        memberId,
        existingMember.user_id,
        updatedData
      );

    /**
     * Keep fellowship access in step with the role
     * (Fellowship Admin and Staff only).
     */
    await fellowshipAccessModel.syncForRoleChange({
      userId: existingMember.user_id,
      fellowshipId: existingMember.fellowship_id,
      oldRoleId: existingMember.role_id,
      newRoleId: updatedData.roleId,
      createdBy: memberData.updatedBy ?? null,
    });

    /**
     * Database update succeeded.
     *
     * Now remove the old Cloudinary image
     * if it was replaced or removed.
     */
    if (
      oldProfileImage &&
      (
        uploadedImage ||
        removeProfileImage
      )
    ) {
      const oldPublicId =
        getCloudinaryPublicId(
          oldProfileImage
        );

      if (oldPublicId) {
        try {
          await deleteImage(
            oldPublicId
          );
        } catch (deleteError) {
          /**
           * Do not fail the member update
           * just because old Cloudinary
           * cleanup failed.
           */
          console.error(
            "Failed to delete old profile image:",
            deleteError.message
          );
        }
      }
    }

    return result;
  } catch (error) {
    /**
     * If a new image was uploaded to Cloudinary
     * but the database update failed,
     * remove the newly uploaded image.
     */
    if (uploadedImage?.publicId) {
      try {
        await deleteImage(
          uploadedImage.publicId
        );
      } catch (cleanupError) {
        console.error(
          "Failed to clean up uploaded profile image:",
          cleanupError.message
        );
      }
    }

    /**
     * Handle duplicate email.
     */
    if (error.code === "ER_DUP_ENTRY") {
      throw httpError("Email already exists.", 409);
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      throw httpError(
        "The selected department is not valid.",
        400
      );
    }

    throw error;
  }
};

/**
 * Delete member
 */
const deleteMember = async (
  memberId
) => {
  /**
   * Verify that the member exists
   * before deleting.
   */
  const existingMember =
    await memberModel.getMemberById(
      memberId
    );

  if (!existingMember) {
    throw httpError("Member not found.", 404);
  }

  return memberModel.deleteMember(
    memberId
  );
};

/**
 * Get all members
 *
 * Supports:
 * - Pagination
 * - Search
 * - Status, role, campus, department, academic-status and batch filters
 * - fellowshipIds: only members of these fellowships
 *   (an empty list returns nobody; leave it out for no restriction)
 * - smallGroupIds: only members of these small groups (same rule)
 * - Sorting
 *
 * IMPORTANT:
 * This function expects ONE options object.
 */
const getAllMembers = async (
  options = {}
) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = "",
    roleId = "",
    fellowshipId = "",
    fellowshipIds,
    smallGroupIds,
    departmentId = "",
    academicStatus = "",
    batch = "",
    sortBy = "created_at",
    sortOrder = "desc",
  } = options;

  /**
   * Calculate database offset.
   */
  const offset =
    (page - 1) * limit;

  /**
   * Get members and total count
   * at the same time.
   */
  const [
    members,
    total,
  ] = await Promise.all([
    memberModel.getAllMembers({
      limit,
      offset,
      search,
      status,
      roleId,
      fellowshipId,
      fellowshipIds,
      smallGroupIds,
      departmentId,
      academicStatus,
      batch,
      sortBy,
      sortOrder,
    }),

    memberModel.countMembers({
      search,
      status,
      roleId,
      fellowshipId,
      fellowshipIds,
      smallGroupIds,
      departmentId,
      academicStatus,
      batch,
    }),
  ]);

  return {
    members,

    pagination: {
      page,
      limit,
      total,

      totalPages:
        Math.ceil(
          total / limit
        ),
    },
  };
};

module.exports = {
  createMember,
  getMemberById,
  updateMember,
  deleteMember,
  getAllMembers,
};