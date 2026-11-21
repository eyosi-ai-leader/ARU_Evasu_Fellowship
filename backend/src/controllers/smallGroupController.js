const { validationResult } = require("express-validator");

const { successResponse, errorResponse } = require("../utils/response");

const service = require("../services/familyService");

const run = async (req, res, { message, fallback, status = 200 }, work) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return errorResponse(res, errors.array()[0].msg, 400, errors.array());
  }

  try {
    const data = await work();

    return successResponse(res, message, data, status);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }

    console.error(fallback, error.message);

    return errorResponse(res, fallback, 500);
  }
};

const groupId = (req) => Number(req.params.groupId);
const familyId = (req) => Number(req.params.familyId);

const listGroups = (req, res) =>
  run(
    req,
    res,
    { message: "Small groups retrieved successfully", fallback: "Failed to load the small groups." },
    () => service.listSmallGroups(req.access)
  );

const createGroup = (req, res) =>
  run(
    req,
    res,
    { message: "Small group created successfully", fallback: "Failed to create the small group.", status: 201 },
    () => service.createSmallGroup(req.access, req.body)
  );

const updateGroup = (req, res) =>
  run(
    req,
    res,
    { message: "Small group updated successfully", fallback: "Failed to update the small group." },
    () => service.updateSmallGroup(req.access, groupId(req), req.body)
  );

const addLeader = (req, res) =>
  run(
    req,
    res,
    { message: "Overseer added successfully", fallback: "Failed to add the overseer." },
    () => service.addLeader(req.access, groupId(req), Number(req.body.memberId))
  );

const removeLeader = (req, res) =>
  run(
    req,
    res,
    { message: "Overseer removed successfully", fallback: "Failed to remove the overseer." },
    () =>
      service.removeLeader(
        req.access,
        groupId(req),
        Number(req.params.memberId)
      )
  );

const listFamilies = (req, res) =>
  run(
    req,
    res,
    { message: "Families retrieved successfully", fallback: "Failed to load the families." },
    () => service.listFamilies(req.access, groupId(req))
  );

const listCandidates = (req, res) =>
  run(
    req,
    res,
    { message: "Members retrieved successfully", fallback: "Failed to load the members." },
    () =>
      service.listCandidates(
        req.access,
        groupId(req),
        String(req.query.search || "")
      )
  );

const createFamily = (req, res) =>
  run(
    req,
    res,
    { message: "Family created successfully", fallback: "Failed to create the family.", status: 201 },
    () => service.createFamily(req.access, groupId(req), req.body)
  );

const updateFamily = (req, res) =>
  run(
    req,
    res,
    { message: "Family updated successfully", fallback: "Failed to update the family." },
    () => service.updateFamily(req.access, familyId(req), req.body)
  );

const deleteFamily = (req, res) =>
  run(
    req,
    res,
    { message: "Family deleted successfully", fallback: "Failed to delete the family." },
    () => service.deleteFamily(req.access, familyId(req))
  );

const saveFamilyMembers = (req, res) =>
  run(
    req,
    res,
    { message: "Family members saved successfully", fallback: "Failed to save the family members." },
    () => service.saveFamilyMembers(req.access, familyId(req), req.body.members)
  );

const removeFamilyMember = (req, res) =>
  run(
    req,
    res,
    { message: "Member removed from the family", fallback: "Failed to remove the member." },
    () =>
      service.removeFamilyMember(
        req.access,
        familyId(req),
        Number(req.params.memberId)
      )
  );

module.exports = {
  listGroups,
  createGroup,
  updateGroup,
  addLeader,
  removeLeader,
  listFamilies,
  listCandidates,
  createFamily,
  updateFamily,
  deleteFamily,
  saveFamilyMembers,
  removeFamilyMember,
};