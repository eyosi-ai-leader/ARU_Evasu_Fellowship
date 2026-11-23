const model = require("../models/announcementModel");
const reachScope = require("../utils/reachScope");
const time = require("../utils/churchTime");
const { parseDateTime } = require("../utils/dateInput");
const { getAccessContext } = require("./accessService");
const { sendEmail } = require("./emailService");
const announcementEmail = require("../templates/emails/announcementEmail");
const env = require("../config/env");

const MAX_RECIPIENTS = Number(process.env.ANNOUNCEMENT_MAX_RECIPIENTS) || 300;
const DAILY_LIMIT = Number(process.env.ANNOUNCEMENT_DAILY_LIMIT) || 400;
const SEND_DELAY_MS = Number(process.env.ANNOUNCEMENT_SEND_DELAY_MS) || 1000;
const BATCH_SIZE = 10;
const MEMBER_PAGE_SIZE = 25;
const PAGE_SIZE = 20;
const MAX_PICKED_MEMBERS = 300;
const SCHEDULER_INTERVAL_MS = 60 * 1000;
const MINUTE = 60 * 1000;
const YEAR = 365 * 24 * 60 * MINUTE;

const CATEGORIES = [
  "General",
  "Reminder",
  "Event",
  "Prayer",
  "Update",
  "Opportunity",
  "Celebration",
];

const PRIORITIES = ["normal", "important", "urgent"];

const STATUSES = ["scheduled", "sending", "sent", "partial", "failed", "cancelled"];

// Announcements currently being sent by this server process.
const running = new Set();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const churchName = () => process.env.CHURCH_NAME || "our fellowship";

const fullName = (first, last) => `${first || ""} ${last || ""}`.trim();

const clean = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeDelivery = (value) =>
  ["both", "dashboard", "email"].includes(value) ? value : "both";

const toIds = (value) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.map(Number).filter((id) => Number.isInteger(id) && id > 0)
        ),
      ]
    : [];

const absoluteUrl = (url) =>
  url && url.startsWith("/") ? `${env.FRONTEND_URL}${url}` : url;

/*
 * Turns a raw mail-server error into a short, readable reason.
 * The raw error stays in the database for troubleshooting.
 */
const friendlyReason = (raw) => {
  const text = String(raw || "").toLowerCase();

  if (!text) return "";

  if (text.includes("not configured")) {
    return "Email sending is not set up on the server.";
  }

  if (/auth|535|credentials|invalid login|username and password/.test(text)) {
    return "The server could not sign in to the email account.";
  }

  if (/quota|rate limit|too many|452|421|daily/.test(text)) {
    return "The sending limit was reached. Try again later.";
  }

  if (/timeout|timed out|econn|enotfound|network|socket/.test(text)) {
    return "The connection to the mail server failed. Try again.";
  }

  if (/invalid|recipient|mailbox|550|553|user unknown|no such user|rejected/.test(text)) {
    return "The mail server rejected this address. It may be misspelled or no longer exist.";
  }

  return "The email could not be delivered.";
};

const skippedReason = (row, delivery) => {
  if (delivery === "dashboard") return "";

  if (!row.email_verified_at) {
    return "Email not verified, so they only see it in the dashboard.";
  }

  if (Number(row.announcement_emails) === 0) {
    return "Turned off announcement emails. They still see it in the dashboard.";
  }

  return "No email was sent.";
};

/* ---------------------------------------------------------------- */
/* Who may send to whom                                              */
/* ---------------------------------------------------------------- */

const senderReach = async (access) => {
  const reach = await reachScope.getReach(access);

  if (!reach.canSend) {
    throw httpError(
      "You don't manage a campus, ministry or small group, so you can't send announcements.",
      403
    );
  }

  return reach;
};

/*
 * The audience is a union of parts. Every part must be inside what the
 * sender can reach, so a ministry leader can never address another
 * ministry, and a campus leader can never address another campus.
 */
const normalizeAudience = async (reach, input) => {
  if (!input || typeof input !== "object") {
    throw httpError("Choose who should receive this announcement.", 400);
  }

  const audience = {
    everyone: input.everyone === true,
    campusIds: toIds(input.campusIds),
    ministryIds: toIds(input.ministryIds),
    smallGroupIds: toIds(input.smallGroupIds),
    familyIds: toIds(input.familyIds),
    memberIds: toIds(input.memberIds),
  };

  const empty =
    !audience.everyone &&
    [
      "campusIds",
      "ministryIds",
      "smallGroupIds",
      "familyIds",
      "memberIds",
    ].every((key) => audience[key].length === 0);

  if (empty) {
    throw httpError("Choose who should receive this announcement.", 400);
  }

  if (audience.everyone) {
    if (!reach.coversAll) {
      throw httpError(
        "Only people who serve every campus can send to the whole fellowship.",
        403
      );
    }

    return {
      everyone: true,
      campusIds: [],
      ministryIds: [],
      smallGroupIds: [],
      familyIds: [],
      memberIds: [],
    };
  }

  if (audience.memberIds.length > MAX_PICKED_MEMBERS) {
    throw httpError(
      `You can pick up to ${MAX_PICKED_MEMBERS} members at a time.`,
      400
    );
  }

  if (audience.campusIds.some((id) => !reach.campusIds.includes(id))) {
    throw httpError("You can only send to campuses you manage.", 403);
  }

  if (audience.ministryIds.length > 0) {
    const allowed = new Set(
      (await reachScope.listMinistries(reach)).map((item) => item.id)
    );

    if (audience.ministryIds.some((id) => !allowed.has(id))) {
      throw httpError("You can only send to ministries you manage or lead.", 403);
    }
  }

  const needsGroups =
    audience.smallGroupIds.length > 0 || audience.familyIds.length > 0;

  const groupIds = needsGroups
    ? (await reachScope.listSmallGroups(reach)).map((item) => item.id)
    : [];

  if (audience.smallGroupIds.some((id) => !groupIds.includes(id))) {
    throw httpError(
      "You can only send to small groups you manage or oversee.",
      403
    );
  }

  if (audience.familyIds.length > 0) {
    const count = await model.countFamiliesInGroups(
      audience.familyIds,
      groupIds
    );

    if (count !== audience.familyIds.length) {
      throw httpError(
        "You can only send to families of your own small groups.",
        403
      );
    }
  }

  if (audience.memberIds.length > 0) {
    const condition = reachScope.memberCondition(reach);

    const count = await model.countReachableMembers(
      audience.memberIds,
      condition.sql,
      condition.params
    );

    if (count !== audience.memberIds.length) {
      throw httpError(
        "Some of the selected members are outside the groups you can reach.",
        403
      );
    }
  }

  return audience;
};

const buildLabel = async (audience) => {
  if (audience.everyone) return "Whole fellowship";

  const parts = [];

  if (audience.campusIds.length > 0) {
    parts.push(`Campus: ${(await model.getCampusNames(audience.campusIds)).join(", ")}`);
  }

  if (audience.ministryIds.length > 0) {
    parts.push(
      `Ministries: ${(await model.getMinistryLabels(audience.ministryIds)).join(", ")}`
    );
  }

  if (audience.smallGroupIds.length > 0) {
    parts.push(
      `Small groups: ${(await model.getSmallGroupLabels(audience.smallGroupIds)).join(", ")}`
    );
  }

  if (audience.familyIds.length > 0) {
    parts.push(
      `Families: ${(await model.getFamilyLabels(audience.familyIds)).join(", ")}`
    );
  }

  if (audience.memberIds.length > 0) {
    const count = audience.memberIds.length;
    parts.push(`${count} selected member${count === 1 ? "" : "s"}`);
  }

  const label = parts.join(" · ");

  return label.length > 250 ? `${label.slice(0, 247)}...` : label;
};

// The campus an announcement belongs to (null when it spans several).
const campusOf = async (audience) => {
  if (audience.everyone) return null;

  const ids = await model.getAudienceCampusIds(audience);

  return ids.length === 1 ? ids[0] : null;
};

/* ---------------------------------------------------------------- */
/* Optional settings                                                 */
/* ---------------------------------------------------------------- */

const parseAction = (labelInput, urlInput) => {
  const url = clean(urlInput);

  if (!url) return { actionLabel: null, actionUrl: null };

  if (url.length > 500) throw httpError("The link is too long.", 400);

  const internal = url.startsWith("/") && !url.startsWith("//");
  const external = /^https?:\/\/[^\s]+$/i.test(url);

  if (!internal && !external) {
    throw httpError(
      "The link must start with https:// (or / for a page of this portal).",
      400
    );
  }

  const label = clean(labelInput) || "Open";

  if (label.length > 40) {
    throw httpError("The button text must not exceed 40 characters.", 400);
  }

  return { actionLabel: label, actionUrl: url };
};

const parseExtras = (input) => {
  const priority = clean(input.priority) || "normal";

  if (!PRIORITIES.includes(priority)) {
    throw httpError("Choose a valid priority.", 400);
  }

  const category = clean(input.category) || null;

  if (category && !CATEGORIES.includes(category)) {
    throw httpError("Choose a valid category.", 400);
  }

  const nowStr = time.nowInChurch();
  const nowMs = time.parseNaive(nowStr).getTime();

  let scheduledAt = null;

  if (clean(input.scheduledAt)) {
    scheduledAt = parseDateTime(input.scheduledAt);

    if (!scheduledAt) throw httpError("Enter a valid date and time to send.", 400);

    const diff = time.parseNaive(scheduledAt).getTime() - nowMs;

    if (diff < MINUTE) {
      throw httpError("Choose a time at least a minute from now.", 400);
    }

    if (diff > YEAR) {
      throw httpError("You can schedule up to one year ahead.", 400);
    }
  }

  let expiresAt = null;

  if (clean(input.expiresAt)) {
    expiresAt = parseDateTime(input.expiresAt);

    if (!expiresAt) throw httpError("Enter a valid expiry date and time.", 400);

    if (expiresAt <= (scheduledAt || nowStr)) {
      throw httpError("The expiry must be after the time it is sent.", 400);
    }
  }

  return {
    priority,
    category,
    pinned: input.pinned === true || input.pinned === "true",
    scheduledAt,
    expiresAt,
    ...parseAction(input.actionLabel, input.actionUrl),
  };
};

/* ---------------------------------------------------------------- */
/* Audience, preview and options                                     */
/* ---------------------------------------------------------------- */

/*
 * Works out who is reached and who also gets an email.
 *  - "dashboard": everyone reached, no emails
 *  - "both": everyone reached, email only to verified members who opted in
 *  - "email": only verified members who opted in
 */
const prepare = async (audience, delivery) => {
  const rows = await model.resolveRecipients({ audience, delivery });

  const people = rows.map((row) => {
    const verified = Boolean(row.email_verified_at);
    const optedIn = Number(row.announcement_emails) === 1;

    return {
      userId: row.user_id,
      verified,
      optedIn,
      emailOk: verified && optedIn,
    };
  });

  const wantsEmail = delivery !== "dashboard";
  const emailPeople = wantsEmail ? people.filter((p) => p.emailOk) : [];

  const optedOut = wantsEmail
    ? people.filter((p) => p.verified && !p.optedIn).length
    : 0;

  const unverified =
    delivery === "both" ? people.filter((p) => !p.verified).length : 0;

  const reached = delivery === "email" ? emailPeople : people;

  return { delivery, people, reached, emailPeople, optedOut, unverified };
};

const assertSendable = async (prepared, { checkDaily = true } = {}) => {
  if (prepared.reached.length === 0) {
    throw httpError(
      prepared.delivery === "email"
        ? "There are no eligible recipients. Members need a verified email and must not have opted out."
        : "There are no active members in this audience.",
      400
    );
  }

  if (prepared.emailPeople.length > MAX_RECIPIENTS) {
    throw httpError(
      `This would email ${prepared.emailPeople.length} people. The limit is ${MAX_RECIPIENTS} per announcement. Send it in smaller groups, or choose "Dashboard only".`,
      400
    );
  }

  if (checkDaily && prepared.emailPeople.length > 0) {
    const plannedToday = await model.countPlannedToday();

    if (plannedToday + prepared.emailPeople.length > DAILY_LIMIT) {
      const remaining = Math.max(0, DAILY_LIMIT - plannedToday);

      throw httpError(
        `The daily email limit would be exceeded. You can email about ${remaining} more people today. "Dashboard only" has no limit.`,
        429
      );
    }
  }
};

const buildRecipients = (prepared, senderUserId) => {
  const mode = prepared.delivery;

  const recipients =
    mode === "email"
      ? prepared.emailPeople.map((person) => ({
          userId: person.userId,
          emailStatus: "pending",
          read: false,
        }))
      : prepared.people.map((person) => ({
          userId: person.userId,
          emailStatus: mode === "both" && person.emailOk ? "pending" : "skipped",
          // The sender does not need to be notified about their own message.
          read: person.userId === senderUserId,
        }));

  const emailTotal = recipients.filter(
    (recipient) => recipient.emailStatus === "pending"
  ).length;

  return { recipients, emailTotal };
};

const getAudienceOptions = async (access) => {
  const reach = await senderReach(access);
  const condition = reachScope.memberCondition(reach);

  const [ministries, smallGroups, stats, plannedToday] = await Promise.all([
    reachScope.listMinistries(reach),
    reachScope.listSmallGroups(reach),
    model.getMemberStats({
      reachSql: condition.sql,
      reachParams: condition.params,
    }),
    model.countPlannedToday(),
  ]);

  return {
    canSendToEveryone: reach.coversAll,
    campuses: reach.campuses,
    // Each campus has its own ministries and small groups, grouped by campus.
    ministries,
    smallGroups,
    stats,
    categories: CATEGORIES,
    limits: {
      maxEmailRecipients: MAX_RECIPIENTS,
      dailyLimit: DAILY_LIMIT,
      emailsLeftToday: Math.max(0, DAILY_LIMIT - plannedToday),
      maxPickedMembers: MAX_PICKED_MEMBERS,
    },
  };
};

const unavailableReason = (row, delivery) => {
  if (row.member_status !== "Active") return "This member is marked inactive.";

  if (row.is_active !== null && Number(row.is_active) === 0) {
    return "This account is disabled.";
  }

  return delivery === "email"
    ? "Email not verified yet. They need to confirm their 6-digit code first."
    : "This member cannot be reached right now.";
};

const searchMembers = async (
  access,
  { search, campusId, ministryId, smallGroupId, page, delivery }
) => {
  const reach = await senderReach(access);
  const mode = normalizeDelivery(delivery);

  const campus = Number(campusId) || null;
  const ministry = Number(ministryId) || null;
  const group = Number(smallGroupId) || null;

  if (campus && !reach.campusIds.includes(campus)) {
    throw httpError("You can only browse campuses you manage.", 403);
  }

  if (ministry) {
    const allowed = (await reachScope.listMinistries(reach)).map((i) => i.id);

    if (!allowed.includes(ministry)) {
      throw httpError("You can only browse ministries you manage or lead.", 403);
    }
  }

  if (group) {
    const allowed = (await reachScope.listSmallGroups(reach)).map((i) => i.id);

    if (!allowed.includes(group)) {
      throw httpError("You can only browse your own small groups.", 403);
    }
  }

  const condition = reachScope.memberCondition(reach);
  const pageNumber = Math.max(1, Number(page) || 1);
  const offset = (pageNumber - 1) * MEMBER_PAGE_SIZE;
  const term = String(search || "").trim();

  const { rows, total } = await model.searchMembers({
    reachSql: condition.sql,
    reachParams: condition.params,
    search: term,
    campusId: campus,
    ministryId: ministry,
    smallGroupId: group,
    limit: MEMBER_PAGE_SIZE,
    offset,
    delivery: mode,
  });

  let unavailable = [];

  if (term && pageNumber === 1) {
    const blocked = await model.searchIneligibleMembers({
      reachSql: condition.sql,
      reachParams: condition.params,
      search: term,
      delivery: mode,
    });

    unavailable = blocked.map((row) => ({
      id: row.id,
      name: fullName(row.first_name, row.last_name),
      email: row.email,
      reason: unavailableReason(row, mode),
    }));
  }

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: fullName(row.first_name, row.last_name),
      memberNumber: row.member_number || "",
      email: row.email,
      campusName: String(row.campus_name || "").replace(/\s+Fellowship$/i, ""),
    })),
    total,
    hasMore: offset + rows.length < total,
    unavailable,
  };
};

const previewAudience = async (access, audienceInput, deliveryInput) => {
  const reach = await senderReach(access);
  const audience = await normalizeAudience(reach, audienceInput);
  const mode = normalizeDelivery(deliveryInput);
  const prepared = await prepare(audience, mode);
  const plannedToday = await model.countPlannedToday();

  return {
    delivery: mode,
    reach: prepared.reached.length,
    emails: prepared.emailPeople.length,
    optedOut: prepared.optedOut,
    unverified: prepared.unverified,
    maxRecipients: MAX_RECIPIENTS,
    tooMany: prepared.emailPeople.length > MAX_RECIPIENTS,
    emailsLeftToday: Math.max(0, DAILY_LIMIT - plannedToday),
  };
};

const sendTest = async (access, payload) => {
  await senderReach(access);

  const me = await model.getUserContact(access.user.id);

  if (!me) throw httpError("Account not found.", 404);

  const extras = parseAction(payload.actionLabel, payload.actionUrl);
  const priority = PRIORITIES.includes(payload.priority) ? payload.priority : "normal";

  const content = announcementEmail({
    firstName: me.first_name,
    subject: `[Test] ${payload.subject}`,
    message: payload.message,
    senderName: fullName(me.first_name, me.last_name),
    senderRole: "",
    churchName: churchName(),
    settingsUrl: `${env.FRONTEND_URL}/dashboard/settings`,
    isTest: true,
    priority,
    actionLabel: extras.actionLabel || "",
    actionUrl: extras.actionUrl ? absoluteUrl(extras.actionUrl) : "",
  });

  try {
    await sendEmail({
      to: me.email,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
  } catch (error) {
    console.error("Announcement test email failed:", error.message);
    throw httpError("We couldn't send the test email. Please try again.", 502);
  }
};

/* ---------------------------------------------------------------- */
/* Sending the emails                                                */
/* ---------------------------------------------------------------- */

/*
 * Temporary problems (dropped connection, timeout, 4xx server reply)
 * are worth retrying. Permanent ones (rejected address) are not.
 */
const isTransient = (error) => {
  const code = String(error?.code || "").toUpperCase();
  const responseCode = Number(error?.responseCode || 0);

  if (
    [
      "ETIMEDOUT",
      "ECONNECTION",
      "ECONNRESET",
      "ESOCKET",
      "EDNS",
      "ENOTFOUND",
      "EAI_AGAIN",
    ].includes(code)
  ) {
    return true;
  }

  return responseCode >= 400 && responseCode < 500;
};

const sendWithRetry = async (payload, attempts = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await sendEmail(payload);
    } catch (error) {
      lastError = error;

      if (!isTransient(error) || attempt === attempts) break;

      await sleep(attempt * 3000);
    }
  }

  throw lastError;
};

const processAnnouncement = async (announcementId) => {
  if (running.has(announcementId)) return;

  running.add(announcementId);

  try {
    const announcement = await model.getAnnouncementForSend(announcementId);

    if (!announcement) return;

    const senderName = fullName(
      announcement.sender_first_name,
      announcement.sender_last_name
    );

    const settingsUrl = `${env.FRONTEND_URL}/dashboard/settings`;
    const actionUrl = announcement.action_url
      ? absoluteUrl(announcement.action_url)
      : "";

    let batch = await model.getPendingBatch(announcementId, BATCH_SIZE);

    while (batch.length > 0) {
      for (const recipient of batch) {
        try {
          const content = announcementEmail({
            firstName: recipient.first_name,
            subject: announcement.subject,
            message: announcement.message,
            senderName,
            senderRole: announcement.sender_role,
            churchName: churchName(),
            settingsUrl,
            priority: announcement.priority,
            actionLabel: announcement.action_label || "",
            actionUrl,
          });

          await sendWithRetry({
            to: recipient.email,
            subject: content.subject,
            text: content.text,
            html: content.html,
            replyTo: announcement.sender_email
              ? { name: senderName, address: announcement.sender_email }
              : undefined,
          });

          await model.markRecipient(recipient.id, true);
        } catch (error) {
          const detail = `${error.code ? `${error.code}: ` : ""}${error.message}`;

          await model.markRecipient(recipient.id, false, detail);

          console.error(
            `Announcement #${announcementId} failed for recipient ${recipient.id}:`,
            detail
          );
        }

        await sleep(SEND_DELAY_MS);
      }

      await model.refreshCounts(announcementId);

      batch = await model.getPendingBatch(announcementId, BATCH_SIZE);
    }

    const counts = await model.refreshCounts(announcementId);

    const status =
      counts.failed === 0 ? "sent" : counts.sent === 0 ? "failed" : "partial";

    await model.finishAnnouncement(announcementId, status);
  } catch (error) {
    console.error(
      `Announcement #${announcementId} processing error:`,
      error.message
    );
  } finally {
    running.delete(announcementId);
  }
};

/* ---------------------------------------------------------------- */
/* Creating and scheduling                                           */
/* ---------------------------------------------------------------- */

const createAnnouncement = async (access, payload) => {
  const reach = await senderReach(access);
  const audience = await normalizeAudience(reach, payload.audience);
  const mode = normalizeDelivery(payload.delivery);
  const extras = parseExtras(payload);

  const prepared = await prepare(audience, mode);

  await assertSendable(prepared, { checkDaily: !extras.scheduledAt });

  const common = {
    createdBy: access.user.id,
    fellowshipId: await campusOf(audience),
    subject: payload.subject,
    message: payload.message,
    priority: extras.priority,
    category: extras.category,
    pinned: extras.pinned,
    expiresAt: extras.expiresAt,
    actionLabel: extras.actionLabel,
    actionUrl: extras.actionUrl,
    audienceLabel: await buildLabel(audience),
    audience,
    delivery: mode,
  };

  // Later: the people are worked out at the moment it is sent.
  if (extras.scheduledAt) {
    const id = await model.createScheduledAnnouncement({
      ...common,
      scheduledAt: extras.scheduledAt,
    });

    return {
      id,
      scheduled: true,
      scheduledAt: extras.scheduledAt,
      delivery: mode,
      total: prepared.reached.length,
      emails: prepared.emailPeople.length,
    };
  }

  const { recipients, emailTotal } = buildRecipients(prepared, access.user.id);

  const id = await model.createAnnouncementWithRecipients({
    ...common,
    recipients,
    emailTotal,
    skippedOptedOut: prepared.optedOut,
  });

  // Emails continue in the background. The dashboard copy is already live.
  if (emailTotal > 0) processAnnouncement(id);

  return {
    id,
    scheduled: false,
    delivery: mode,
    total: prepared.reached.length,
    emails: emailTotal,
    optedOut: prepared.optedOut,
  };
};

/*
 * Sends one scheduled announcement. The sender's rights are checked again
 * now, so a person who lost their role cannot send in the name of an old one.
 */
const sendScheduled = async (row) => {
  try {
    const access = await getAccessContext(row.created_by);

    if (!access || !access.isActive) {
      await model.endAnnouncement(row.id, "cancelled");
      return;
    }

    const reach = await reachScope.getReach(access);

    if (!reach.canSend) {
      await model.endAnnouncement(row.id, "cancelled");
      return;
    }

    const raw =
      typeof row.audience_json === "string"
        ? JSON.parse(row.audience_json)
        : row.audience_json;

    let audience;

    try {
      audience = await normalizeAudience(reach, raw);
    } catch {
      await model.endAnnouncement(row.id, "cancelled");
      return;
    }

    const prepared = await prepare(audience, row.delivery);

    try {
      await assertSendable(prepared, { checkDaily: true });
    } catch (error) {
      console.error(`Scheduled announcement #${row.id} not sent:`, error.message);
      await model.endAnnouncement(row.id, "failed");
      return;
    }

    const { recipients, emailTotal } = buildRecipients(prepared, row.created_by);

    await model.finalizeScheduled(row.id, {
      recipients,
      emailTotal,
      skippedOptedOut: prepared.optedOut,
    });

    if (emailTotal > 0) processAnnouncement(row.id);
  } catch (error) {
    console.error(`Scheduled announcement #${row.id} error:`, error.message);
    await model.endAnnouncement(row.id, "failed").catch(() => {});
  }
};

const processDueAnnouncements = async () => {
  const due = await model.findDueScheduled(time.nowInChurch());

  for (const row of due) {
    // Only one server wins this.
    if (await model.claimScheduled(row.id)) {
      await sendScheduled(row);
    }
  }
};

let schedulerTimer = null;

/*
 * Starts the timer that sends scheduled announcements, and finishes any
 * that were interrupted by a restart. Call it once when the server starts.
 */
const startAnnouncementScheduler = () => {
  if (schedulerTimer) return;

  const tick = () =>
    processDueAnnouncements().catch((error) =>
      console.error("Announcement scheduler error:", error.message)
    );

  model
    .findStuckSending()
    .then((ids) => ids.forEach((id) => processAnnouncement(id)))
    .catch((error) =>
      console.error("Announcement resume error:", error.message)
    );

  schedulerTimer = setInterval(tick, SCHEDULER_INTERVAL_MS);

  if (schedulerTimer.unref) schedulerTimer.unref();

  setTimeout(tick, 10 * 1000);
};

/* ---------------------------------------------------------------- */
/* Managing                                                          */
/* ---------------------------------------------------------------- */

/*
 * People who cover all campuses manage everything. Everyone else manages
 * their own announcements and those of the campuses they manage.
 */
const loadManaged = async (access, id) => {
  const reach = await senderReach(access);
  const row = await model.getAnnouncementBasic(id);

  if (!row) throw httpError("Announcement not found.", 404);

  const allowed =
    reach.coversAll ||
    row.created_by === access.user.id ||
    (row.fellowship_id && reach.campusIds.includes(row.fellowship_id));

  if (!allowed) throw httpError("Access denied.", 403);

  return { row, reach };
};

const retryAnnouncement = async (access, id) => {
  await loadManaged(access, id);

  if (running.has(id)) {
    throw httpError("This announcement is still being sent.", 409);
  }

  await model.resetFailedToPending(id);

  processAnnouncement(id);
};

const retryRecipient = async (access, id, recipientId) => {
  await loadManaged(access, id);

  if (running.has(id)) {
    throw httpError("This announcement is still being sent.", 409);
  }

  const changed = await model.resetRecipientToPending(id, recipientId);

  if (!changed) throw httpError("This email is not waiting for a retry.", 400);

  processAnnouncement(id);
};

const cancelScheduled = async (access, id) => {
  const { row } = await loadManaged(access, id);

  if (row.status !== "scheduled") {
    throw httpError("Only an announcement that has not been sent can be cancelled.", 400);
  }

  const changed = await model.cancelScheduled(id);

  if (!changed) {
    throw httpError("This announcement has just been sent.", 409);
  }
};

const setPinned = async (access, id, pinned) => {
  await loadManaged(access, id);
  await model.setPinned(id, pinned === true || pinned === "true");
};

const toSummary = (row) => {
  const emailTotal = Number(row.email_total || 0);
  const pending = Math.max(0, emailTotal - row.sent_count - row.failed_count);
  const open = !["scheduled", "cancelled"].includes(row.status);

  return {
    id: row.id,
    subject: row.subject,
    message: row.message,
    priority: row.priority,
    category: row.category,
    pinned: Boolean(row.pinned),
    expiresAt: row.expires_at,
    scheduledAt: row.scheduled_at,
    actionLabel: row.action_label,
    actionUrl: row.action_url,
    audience: row.audience_label,
    campusName: String(row.campus_name || "").replace(/\s+Fellowship$/i, ""),
    delivery: row.delivery,
    status: row.status,
    total: row.total_recipients,
    emailTotal,
    sent: row.sent_count,
    failed: row.failed_count,
    pending,
    optedOut: row.skipped_opted_out,
    readCount: Number(row.read_count || 0),
    sender: fullName(row.first_name, row.last_name),
    createdAt: row.created_at,
    completedAt: row.completed_at,
    canRetry: open && !running.has(row.id) && pending + row.failed_count > 0,
    canCancel: row.status === "scheduled",
  };
};

const listAnnouncements = async (access, { search, page, status } = {}) => {
  const reach = await senderReach(access);

  const pageNumber = Math.max(1, Number(page) || 1);
  const offset = (pageNumber - 1) * PAGE_SIZE;

  const { rows, total } = await model.listAnnouncements({
    all: reach.coversAll,
    createdBy: access.user.id,
    campusIds: reach.campusIds,
    search: String(search || "").trim(),
    status: STATUSES.includes(status) ? status : "",
    limit: PAGE_SIZE,
    offset,
  });

  return {
    items: rows.map(toSummary),
    total,
    hasMore: offset + rows.length < total,
  };
};

const getAnnouncementDetails = async (access, id) => {
  await loadManaged(access, id);

  const row = await model.getAnnouncementById(id);

  if (!row) throw httpError("Announcement not found.", 404);

  const recipientRows = await model.getRecipients(id);

  const recipients = recipientRows.map((recipient) => ({
    id: recipient.id,
    name: fullName(recipient.first_name, recipient.last_name),
    email: recipient.email,
    status: recipient.status,
    reason:
      recipient.status === "failed"
        ? friendlyReason(recipient.error)
        : recipient.status === "skipped"
          ? skippedReason(recipient, row.delivery)
          : "",
    sentAt: recipient.sent_at,
    read: Boolean(recipient.read_at),
    readAt: recipient.read_at,
  }));

  const count = (status) =>
    recipients.filter((recipient) => recipient.status === status).length;

  const sent = count("sent");
  const failed = count("failed");
  const pending = count("pending");
  const skipped = count("skipped");
  const readCount = recipients.filter((recipient) => recipient.read).length;
  const isRunning = running.has(id);

  return {
    ...toSummary(row),
    sent,
    failed,
    pending,
    skipped,
    readCount,
    isRunning,
    canRetry:
      !["scheduled", "cancelled"].includes(row.status) &&
      !isRunning &&
      failed + pending > 0,
    recipients,
  };
};

const deleteAnnouncement = async (access, id) => {
  await loadManaged(access, id);

  if (running.has(id)) {
    throw httpError(
      "This announcement is still being sent. Please wait until it finishes.",
      409
    );
  }

  await model.softDeleteAnnouncement(id);
};

module.exports = {
  getAudienceOptions,
  searchMembers,
  previewAudience,
  sendTest,
  createAnnouncement,
  cancelScheduled,
  setPinned,
  retryAnnouncement,
  retryRecipient,
  listAnnouncements,
  getAnnouncementDetails,
  deleteAnnouncement,
  startAnnouncementScheduler,
};