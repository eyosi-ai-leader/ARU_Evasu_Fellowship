const { body, param } = require("express-validator");

const groupId = param("groupId").isInt({ min: 1 }).withMessage("Invalid small group");
const familyId = param("familyId").isInt({ min: 1 }).withMessage("Invalid family");
const memberIdParam = param("memberId").isInt({ min: 1 }).withMessage("Invalid member");

const name = (optional) => {
  const rule = body("name");

  return (optional ? rule.optional({ values: "falsy" }) : rule.exists())
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must not exceed 100 characters");
};

const description = body("description")
  .optional({ values: "falsy" })
  .trim()
  .isLength({ max: 1000 })
  .withMessage("Description is too long");

const status = body("status")
  .optional({ values: "falsy" })
  .isIn(["Active", "Inactive"])
  .withMessage("Status must be Active or Inactive");

const groupIdValidator = [groupId];

const createGroupValidator = [
  body("fellowshipId").isInt({ min: 1 }).withMessage("Choose a campus"),
  name(false),
  description,
];

const updateGroupValidator = [groupId, name(true), description, status];

const addLeaderValidator = [
  groupId,
  body("memberId").isInt({ min: 1 }).withMessage("Choose a member"),
];

const removeLeaderValidator = [groupId, memberIdParam];

const createFamilyValidator = [groupId, name(false), description];

const familyIdValidator = [familyId];

const updateFamilyValidator = [familyId, name(true), description, status];

const familyMembersValidator = [
  familyId,
  body("members")
    .isArray({ min: 1, max: 50 })
    .withMessage("Choose between 1 and 50 members"),
  body("members.*.memberId").isInt({ min: 1 }).withMessage("Invalid member"),
  body("members.*.familyRole")
    .isIn(["Father", "Mother", "Child"])
    .withMessage("Choose Father, Mother or Child"),
];

const removeFamilyMemberValidator = [familyId, memberIdParam];

module.exports = {
  groupIdValidator,
  createGroupValidator,
  updateGroupValidator,
  addLeaderValidator,
  removeLeaderValidator,
  createFamilyValidator,
  familyIdValidator,
  updateFamilyValidator,
  familyMembersValidator,
  removeFamilyMemberValidator,
};