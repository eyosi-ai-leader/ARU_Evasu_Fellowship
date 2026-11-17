import { ROLES } from "@/lib/roles";

/**
 * Role names as people see them in the fellowship dashboard.
 *
 * Needs these keys in ROLES (lib/roles.js):
 *   ADMIN: 1, PASTOR: 2, SMALL_GROUP_LEADER: 3, MINISTRY_LEADER: 4,
 *   MEMBER: 5, FELLOWSHIP_ADMIN: 6, STAFF: 7
 */
const LABELS = {
  [ROLES.ADMIN]: "Super Admin",
  [ROLES.FELLOWSHIP_ADMIN]: "Fellowship Admin",
  [ROLES.STAFF]: "Staff",
  [ROLES.PASTOR]: "Main Leader",
  [ROLES.SMALL_GROUP_LEADER]: "Small Group Leader",
  [ROLES.MINISTRY_LEADER]: "Ministry Leader",
  [ROLES.MEMBER]: "Member",
};

export const getFellowshipRoleName = (roleId) =>
  LABELS[Number(roleId)] ?? "Member";