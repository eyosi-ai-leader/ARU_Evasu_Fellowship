const model = require("../models/memberAccessModel");
const { deliverInvitation } = require("./invitationEmailService");
const { ROLE_IDS, isPrivilegedRole } = require("../constants/roles");

const PAGE_SIZE = 20;
const BULK_LIMIT = 25;
const COOLDOWN_MINUTES = 10;
const BULK_DELAY_MS = Number(process.env.ANNOUNCEMENT_SEND_DELAY_MS) || 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const fullName = (first, last) => `${first || ""} ${last || ""}`.trim();

/*
 * "requester" is req.access (from loadAccess). removeAccount may still be
 * called with the old token user (id, roleId) by memberController, which
 * checks the campus itself, so both shapes are accepted.
 */
const actorId = (requester) =>
  requester.user ? requester.user.id : requester.id;

// null = every campus (Super Admin); otherwise the campuses this person manages.
const campusScope = (requester) =>
  requester.scope && !requester.scope.all
    ? requester.scope.memberFellowshipIds
    : null;

// A campus the person picked in the filter, limited to what they manage.
const narrowCampuses = (requester, fellowshipId) => {
  const scope = campusScope(requester);
  const id = Number(fellowshipId);

  if (!Number.isInteger(id) || id < 1) return scope;

  if (scope && !scope.includes(id)) {
    throw httpError("You can only see the campuses you manage.", 403);
  }

  return [id];
};

const assertCanManage = (requester, target, { allowSelf = false } = {}) => {
  if (!target) {
    throw httpError("Member not found.", 404);
  }

  if (
    isPrivilegedRole(target.role_id) &&
    Number(requester.roleId) !== ROLE_IDS.SUPER_ADMIN
  ) {
    throw httpError(
      "Only a Super Admin can manage Super Admin, Fellowship Admin and Staff accounts.",
      403
    );
  }

  const campuses = campusScope(requester);

  if (campuses && !campuses.includes(Number(target.fellowship_id))) {
    throw httpError("You can only manage members of your own campus.", 403);
  }

  if (!allowSelf && target.user_id === actorId(requester)) {
    throw httpError("You can't do this to your own account.", 400);
  }
};

const assertInvitable = (target) => {
  if (target.last_login_at) {
    throw httpError(
      'This member has already signed in. If they forgot their password, they can use "Forgot password".',
      400
    );
  }

  if (target.member_status !== "Active") {
    throw httpError("Activate this member before sending an invitation.", 400);
  }

  if (
    target.invited_at &&
    Number(target.invited_minutes_ago) < COOLDOWN_MINUTES
  ) {
    const wait = COOLDOWN_MINUTES - Number(target.invited_minutes_ago);

    throw httpError(
      `An invitation was sent a moment ago. Please wait ${wait} more ${
        wait === 1 ? "minute" : "minutes"
      } before sending another.`,
      429
    );
  }
};

const toItem = (row, requester) => ({
  memberId: row.member_id,
  userId: row.user_id,
  name: fullName(row.first_name, row.last_name),
  email: row.email,
  roleId: row.role_id,
  role: row.role_name || "",
  fellowshipId: row.fellowship_id,
  campusName: String(row.campus_name || "").replace(/\s+Fellowship$/i, ""),
  memberNumber: row.member_number || "",
  memberStatus: row.member_status,
  joinedAt: row.joined_at,
  lastLoginAt: row.last_login_at,
  invitedAt: row.invited_at,
  inviteCount: Number(row.invite_count || 0),
  state: row.access_state,
  isSelf: row.user_id === actorId(requester),
  canInvite: !row.last_login_at && row.member_status === "Active",
  canDelete: !row.last_login_at && row.user_id !== actorId(requester),
});

const toSummary = (counts) => {
  const signedIn = counts.active || 0;
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return {
    total,
    signedIn,
    neverSignedIn: total - signedIn,
    invited: counts.invited || 0,
    expired: counts.invite_expired || 0,
    unverified: counts.unverified || 0,
  };
};

const list = async (requester, { filter, search, page, fellowshipId }) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const offset = (pageNumber - 1) * PAGE_SIZE;
  const campusIds = narrowCampuses(requester, fellowshipId);

  const [{ rows, total }, counts] = await Promise.all([
    model.listAccess({
      filter: filter || "never",
      search: String(search || "").trim(),
      limit: PAGE_SIZE,
      offset,
      campusIds,
    }),
    // The tiles follow the chosen campus.
    model.getSummary(campusIds),
  ]);

  return {
    items: rows.map((row) => toItem(row, requester)),
    total,
    hasMore: offset + rows.length < total,
    summary: toSummary(counts),
  };
};

const exportRows = async (requester, { filter, search, fellowshipId }) => {
  const { rows } = await model.listAccess({
    filter: filter || "never",
    search: String(search || "").trim(),
    limit: 1000,
    offset: 0,
    campusIds: narrowCampuses(requester, fellowshipId),
  });

  return rows.map((row) => toItem(row, requester));
};

const sendInvite = async (requester, memberId) => {
  const target = await model.getTarget(memberId);

  assertCanManage(requester, target, { allowSelf: true });
  assertInvitable(target);

  try {
    await deliverInvitation({
      userId: target.user_id,
      firstName: target.first_name,
      email: target.email,
      inviterId: actorId(requester),
      reminder: Boolean(target.invited_at),
    });
  } catch (error) {
    console.error(
      `Invitation email failed for member ${memberId}:`,
      error.message
    );

    throw httpError(
      "We couldn't send the email. Please check the address and try again.",
      502
    );
  }
};

const sendInvites = async (requester, memberIdsInput) => {
  const memberIds = [
    ...new Set(
      (Array.isArray(memberIdsInput) ? memberIdsInput : [])
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];

  if (memberIds.length === 0) {
    throw httpError("Select at least one member.", 400);
  }

  if (memberIds.length > BULK_LIMIT) {
    throw httpError(
      `You can send up to ${BULK_LIMIT} invitations at a time.`,
      400
    );
  }

  const targets = await model.getTargets(memberIds);
  const byId = new Map(targets.map((target) => [target.member_id, target]));

  const result = { sent: 0, skipped: [], failed: [] };

  for (const memberId of memberIds) {
    const target = byId.get(memberId);
    const name = target
      ? fullName(target.first_name, target.last_name)
      : `Member #${memberId}`;

    try {
      assertCanManage(requester, target, { allowSelf: true });
      assertInvitable(target);
    } catch (error) {
      result.skipped.push({ memberId, name, reason: error.message });
      continue;
    }

    try {
      await deliverInvitation({
        userId: target.user_id,
        firstName: target.first_name,
        email: target.email,
        inviterId: actorId(requester),
        reminder: Boolean(target.invited_at),
      });

      result.sent += 1;
    } catch (error) {
      console.error(
        `Invitation email failed for member ${memberId}:`,
        error.message
      );

      result.failed.push({
        memberId,
        name,
        reason: "The email could not be sent. Check the address.",
      });
    }

    await sleep(BULK_DELAY_MS);
  }

  return result;
};

const setStatus = async (requester, memberId, status) => {
  const target = await model.getTarget(memberId);

  assertCanManage(requester, target);

  await model.setMemberStatus(memberId, status);
};

/**
 * Permanently delete a member and their sign-in account.
 *
 * allowSignedIn:
 *   false (default) - the Member Access page: only people who never signed in.
 *   true            - the Members page (memberController.deleteMember).
 */
const removeAccount = async (
  requester,
  memberId,
  { allowSignedIn = false } = {}
) => {
  const target = await model.getTarget(memberId);

  // Also stops people from deleting their own account, and (when called with
  // req.access) people from another campus.
  assertCanManage(requester, target);

  if (target.last_login_at && !allowSignedIn) {
    throw httpError(
      "This member has signed in before, so they can't be deleted here. Delete them from the Members page, or mark them inactive.",
      400
    );
  }

  if (await model.isMinistryLeader(memberId)) {
    throw httpError(
      "This member leads a ministry. Change the ministry leader first.",
      409
    );
  }

  if (await model.isSmallGroupLeader(memberId)) {
    throw httpError(
      "This member oversees a small group. Change the overseer first.",
      409
    );
  }

  try {
    await model.deleteAccount(memberId, target.user_id);
  } catch (error) {
    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.code === "ER_ROW_IS_REFERENCED"
    ) {
      throw httpError(
        "This member is linked to other records and can't be deleted. Mark them inactive instead.",
        409
      );
    }

    throw error;
  }
};

module.exports = {
  list,
  exportRows,
  sendInvite,
  sendInvites,
  setStatus,
  removeAccount,
};