import { getRoleName } from "@/lib/roles";

/**
 * Role names as people see them in the fellowship dashboard.
 *
 * The names live in ONE place (ROLE_NAMES in lib/roles.js), so the sidebar,
 * the header and the member lists can never disagree.
 */
export const getFellowshipRoleName = (roleId) => getRoleName(roleId);
