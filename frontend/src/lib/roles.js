/**
 * Role ids. They are the SAME numbers as users.role_id in the database and
 * as backend/constants/roles.js, so keep the three in step.
 */
export const ROLES = {
  ADMIN: 1, // shown as "Super Admin"
  PASTOR: 2, // shown as "Main Leader"
  SMALL_GROUP_LEADER: 3,
  MINISTRY_LEADER: 4,
  MEMBER: 5,
  FELLOWSHIP_ADMIN: 6,
  STAFF: 7,

  // Old name of role 3 (there are no elders in the fellowship).
  // Kept so existing files keep working: when you edit a file that uses
  // ROLES.CHURCH_ELDER, change it to ROLES.SMALL_GROUP_LEADER.
  CHURCH_ELDER: 3,
};

/**
 * Names shown to people.
 */
export const ROLE_NAMES = {
  [ROLES.ADMIN]: "Super Admin",
  [ROLES.FELLOWSHIP_ADMIN]: "Fellowship Admin",
  [ROLES.STAFF]: "Staff",
  [ROLES.PASTOR]: "Main Leader",
  [ROLES.SMALL_GROUP_LEADER]: "Small Group Leader",
  [ROLES.MINISTRY_LEADER]: "Ministry Leader",
  [ROLES.MEMBER]: "Member",
};

export function getRoleName(roleId) {
  return ROLE_NAMES[Number(roleId)] || "Member";
}

export function isAdmin(roleId) {
  return Number(roleId) === ROLES.ADMIN;
}

// Clearer name for the same check.
export const isSuperAdmin = isAdmin;

export function isPastor(roleId) {
  return Number(roleId) === ROLES.PASTOR;
}

// Clearer name for the same check.
export const isMainLeader = isPastor;

export function isSmallGroupLeader(roleId) {
  return Number(roleId) === ROLES.SMALL_GROUP_LEADER;
}

// Old name. Use isSmallGroupLeader in new code.
export const isChurchElder = isSmallGroupLeader;

export function isMinistryLeader(roleId) {
  return Number(roleId) === ROLES.MINISTRY_LEADER;
}

export function isMember(roleId) {
  return Number(roleId) === ROLES.MEMBER;
}

export function isFellowshipAdmin(roleId) {
  return Number(roleId) === ROLES.FELLOWSHIP_ADMIN;
}

export function isStaff(roleId) {
  return Number(roleId) === ROLES.STAFF;
}

/**
 * Accounts that only a Super Admin can create, edit or delete.
 */
export function isPrivilegedRole(roleId) {
  const role = Number(roleId);

  return (
    role === ROLES.ADMIN ||
    role === ROLES.FELLOWSHIP_ADMIN ||
    role === ROLES.STAFF
  );
}

/**
 * Roles that manage the members of a fellowship (the backend then limits
 * each person to the fellowships they manage).
 */
export function canManageMembers(roleId) {
  const role = Number(roleId);

  return (
    role === ROLES.ADMIN ||
    role === ROLES.PASTOR ||
    role === ROLES.FELLOWSHIP_ADMIN ||
    role === ROLES.STAFF
  );
}

/**
 * Same people as canManageMembers. A small group leader has no member list:
 * they open "My Small Group", which shows only their own group.
 */
export function canViewMembers(roleId) {
  return canManageMembers(roleId);
}
