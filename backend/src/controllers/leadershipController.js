const { validationResult } = require("express-validator");

const {
  successResponse,
  errorResponse,
} = require("../utils/response");

const service = require("../services/leadershipService");

const fail = (res, error, fallback) => {
  if (error.statusCode) {
    return errorResponse(res, error.message, error.statusCode);
  }

  // Full detail in the server terminal.
  console.error(fallback, {
    code: error.code,
    message: error.message,
    sqlMessage: error.sqlMessage,
    stack: error.stack,
  });

  // While developing, the reason is also shown on screen.
  const detail =
    process.env.NODE_ENV === "production"
      ? ""
      : ` (${error.code || error.name}: ${error.sqlMessage || error.message})`;

  return errorResponse(res, `${fallback}${detail}`, 500);
};

const checkInput = (req, res) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return true;

  errorResponse(res, errors.array()[0].msg, 400, errors.array());

  return false;
};

const getOptions = async (req, res) => {
  try {
    const options = await service.getOptions(req.access);

    return successResponse(res, "Options retrieved successfully", options, 200);
  } catch (error) {
    return fail(res, error, "Failed to load the options.");
  }
};

const setRole = async (req, res) => {
  if (!checkInput(req, res)) return;

  try {
    const result = await service.assignRole(
      req.access,
      Number(req.params.memberId),
      req.body
    );

    return successResponse(res, "Role updated successfully", result, 200);
  } catch (error) {
    return fail(res, error, "Failed to update the role.");
  }
};

module.exports = {
  getOptions,
  setRole,
};