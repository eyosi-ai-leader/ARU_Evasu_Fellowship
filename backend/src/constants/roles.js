/**
 * Role ids (users.role_id). The ONE place where they are defined.
 *
 * Every backend file imports from here, so a role id is never typed as a
 * bare number (1, 2, 5...) anywhere else.
 *
 * The frontend has the same list in lib/roles.js.
 */
const ROLE_IDS = {
  SUPER_ADMIN: 1,
  MAIN_LEADER: 2,
  SMALL_GROUP_LEADER: 3,
  MINISTRY_LEADER: 4,
  MEMBER: 5,
  FELLOWSHIP_ADMIN: 6,
  STAFF: 7,
};

/**
 * Names shown to people.
 */
const ROLE_LABELS = {
  [ROLE_IDS.SUPER_ADMIN]: "Super Admin",
  [ROLE_IDS.MAIN_LEADER]: "Main Leader",
  [ROLE_IDS.SMALL_GROUP_LEADER]: "Small Group Leader",
  [ROLE_IDS.MINISTRY_LEADER]: "Ministry Leader",
  [ROLE_IDS.MEMBER]: "Member",
  [ROLE_IDS.FELLOWSHIP_ADMIN]: "Fellowship Admin",
  [ROLE_IDS.STAFF]: "Staff",
};

/**
 * Smallest and largest valid role id (used by the validators).
 */
const MIN_ROLE_ID = 1;
const MAX_ROLE_ID = 7;

/**
 * Accounts that only a Super Admin may create, edit, delete or hand out:
 * they decide who can see and change what.
 */
const PRIVILEGED_ROLE_IDS = [
  ROLE_IDS.SUPER_ADMIN,
  ROLE_IDS.FELLOWSHIP_ADMIN,
  ROLE_IDS.STAFF,
];

/**
 * The roles a Fellowship Admin, Staff member or Main Leader may give to
 * someone in their own fellowship.
 */
const MANAGER_ASSIGNABLE_ROLE_IDS = [
  ROLE_IDS.MAIN_LEADER,
  ROLE_IDS.SMALL_GROUP_LEADER,
  ROLE_IDS.MINISTRY_LEADER,
  ROLE_IDS.MEMBER,
];

const isPrivilegedRole = (roleId) =>
  PRIVILEGED_ROLE_IDS.includes(Number(roleId));

/**
 * Fellowship Admin and Staff accounts get their fellowships from the
 * user_fellowship_access table. This is the access level stored there.
 */
const getAccessLevelForRole = (roleId) => {
  if (Number(roleId) === ROLE_IDS.FELLOWSHIP_ADMIN) return "admin";
  if (Number(roleId) === ROLE_IDS.STAFF) return "staff";
  return null;
};

module.exports = {
  ROLE_IDS,
  ROLE_LABELS,
  MIN_ROLE_ID,
  MAX_ROLE_ID,
  PRIVILEGED_ROLE_IDS,
  MANAGER_ASSIGNABLE_ROLE_IDS,
  isPrivilegedRole,
  getAccessLevelForRole,
};
