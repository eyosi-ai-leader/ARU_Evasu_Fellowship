const { body, param, query } = require("express-validator");

const FAMILY_ROLES = ["Father", "Mother", "Child"];

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

const optionalText = (field, max, label) =>
  body(field)
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max })
    .withMessage(`${label} must not exceed ${max} characters`);

const purpose = optionalText("purpose", 255, "Purpose");
const meetingSchedule = optionalText("meetingSchedule", 150, "Meeting schedule");
const meetingPlace = optionalText("meetingPlace", 150, "Meeting place");

const capacity = body("capacity")
  .optional({ values: "falsy" })
  .isInt({ min: 1, max: 1000 })
  .withMessage("Capacity must be a number between 1 and 1000");

const familyRole = body("familyRole")
  .optional({ values: "falsy" })
  .isIn(FAMILY_ROLES)
  .withMessage("Choose Father, Mother or Child");

const groupIdValidator = [groupId];

const createGroupValidator = [
  body("fellowshipId").isInt({ min: 1 }).withMessage("Choose a campus"),
  name(false),
  description,
  purpose,
  meetingSchedule,
  meetingPlace,
  capacity,
];

const updateGroupValidator = [
  groupId,
  name(true),
  description,
  purpose,
  meetingSchedule,
  meetingPlace,
  capacity,
  status,
];

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
    .isIn(FAMILY_ROLES)
    .withMessage("Choose Father, Mother or Child"),
];

const removeFamilyMemberValidator = [familyId, memberIdParam];

const moveFamilyMemberValidator = [
  familyId,
  memberIdParam,
  body("toFamilyId").isInt({ min: 1 }).withMessage("Choose a family"),
  familyRole,
];

const candidatesValidator = [
  groupId,
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search is too long"),
  query("familyId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Invalid family"),
  query("scope")
    .optional({ values: "falsy" })
    .isIn(["group", "family"])
    .withMessage("Invalid scope"),
];

const addGroupMembersValidator = [
  groupId,
  body("memberIds")
    .isArray({ min: 1, max: 50 })
    .withMessage("Choose between 1 and 50 members"),
  body("memberIds.*").isInt({ min: 1 }).withMessage("Invalid member"),
];

const removeFromGroupValidator = [groupId, memberIdParam];

const transferValidator = [
  groupId,
  memberIdParam,
  body("toGroupId").isInt({ min: 1 }).withMessage("Choose a small group"),
  body("toFamilyId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Invalid family"),
  familyRole,
];

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
  moveFamilyMemberValidator,
  candidatesValidator,
  addGroupMembersValidator,
  removeFromGroupValidator,
  transferValidator,
};