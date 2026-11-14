const fellowshipModel = require("../models/fellowshipmodel");

const {
  successResponse,
  errorResponse,
} = require("../utils/response");

/**
 * GET /api/fellowships
 *
 * Public. Used by the registration form to show the campus choices.
 */
const getFellowships = async (req, res) => {
  try {
    const fellowships =
      await fellowshipModel.listRegularFellowships();

    return successResponse(
      res,
      "Fellowships retrieved successfully",
      fellowships,
      200
    );
  } catch (error) {
    console.error("Get fellowships error:", error);

    return errorResponse(
      res,
      "Failed to retrieve fellowships",
      500
    );
  }
};

/**
 * GET /api/fellowships/:id/departments
 *
 * Public. Departments of one campus, for the department dropdown.
 */
const getFellowshipDepartments = async (req, res) => {
  try {
    const fellowshipId = Number(req.params.id);

    const fellowship =
      await fellowshipModel.getFellowshipById(fellowshipId);

    if (
      !fellowship ||
      fellowship.status !== "Active" ||
      fellowship.fellowship_type !== "regular"
    ) {
      return errorResponse(
        res,
        "Fellowship not found",
        404
      );
    }

    const departments =
      await fellowshipModel.listDepartments(fellowshipId);

    return successResponse(
      res,
      "Departments retrieved successfully",
      departments,
      200
    );
  } catch (error) {
    console.error("Get departments error:", error);

    return errorResponse(
      res,
      "Failed to retrieve departments",
      500
    );
  }
};

module.exports = {
  getFellowships,
  getFellowshipDepartments,
};