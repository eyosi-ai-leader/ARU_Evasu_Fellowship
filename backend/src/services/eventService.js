const crypto = require("crypto");

const model = require("../models/eventModel");
const time = require("../utils/churchTime");
const reachScope = require("../utils/reachScope");
const { parseDateTime, parseDateOnly } = require("../utils/dateInput");
const { uploadImage, deleteImage } = require("./storageService");

const CATEGORIES = [
  "Worship",
  "Prayer",
  "Conference",
  "Youth",
  "Children",
  "Outreach",
  "Fellowship",
  "Training",
  "Other",
];

/*
 * public       the public website and every signed-in member
 * members      signed-in members of the event's campus
 *              (every campus when the event belongs to the whole fellowship)
 * ministry     the members of one ministry
 * small_group  the members of one small group
 */
const VISIBILITIES = ["public", "members", "ministry", "small_group"];

const RESPONSES = ["going", "maybe", "not_going"];
const PAGE_SIZE = 12;

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const clean = (value) => (typeof value === "string" ? value.trim() : "");

const fullName = (first, last) => `${first || ""} ${last || ""}`.trim();

const shortCampus = (name) => String(name || "").replace(/\s+Fellowship$/i, "");

const positiveId = (value, label) => {
  if (value === undefined || value === null || clean(String(value)) === "") {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    throw httpError(`Choose a valid ${label}.`, 400);
  }

  return id;
};

/* ---------------------------------------------------------------- */
/* Who can see and manage                                            */
/* ---------------------------------------------------------------- */

const canManage = (row, access, reach) =>
  reach.coversAll ||
  row.created_by === access.user.id ||
  (row.fellowship_id !== null && reach.campusIds.includes(row.fellowship_id)) ||
  (row.ministry_id !== null && reach.ledMinistryIds.includes(row.ministry_id)) ||
  (row.small_group_id !== null && reach.ledGroupIds.includes(row.small_group_id));

/* Which events this signed-in person is allowed to see. */
const viewerClause = async (access, reach) => {
  if (reach.coversAll) return { clauseSql: "1 = 1", clauseParams: [] };

  const parts = ["e.visibility = 'public'", "e.created_by = ?"];
  const params = [access.user.id];

  // Events for members: the whole fellowship, or my campus / campuses I manage.
  const campusIds = [
    ...new Set([
      ...(access.member?.fellowshipId ? [access.member.fellowshipId] : []),
      ...reach.campusIds,
    ]),
  ];

  if (campusIds.length > 0) {
    parts.push(
      "(e.visibility = 'members' AND (e.fellowship_id IS NULL OR e.fellowship_id IN (?)))"
    );
    params.push(campusIds);
  } else {
    parts.push("(e.visibility = 'members' AND e.fellowship_id IS NULL)");
  }

  // Campus leaders see everything of their campus.
  if (reach.campusIds.length > 0) {
    parts.push("e.fellowship_id IN (?)");
    params.push(reach.campusIds);
  }

  const ministryIds = [
    ...new Set(access.positions.ministries.map((item) => item.id)),
  ];

  if (ministryIds.length > 0) {
    parts.push("(e.visibility = 'ministry' AND e.ministry_id IN (?))");
    params.push(ministryIds);
  }

  const mine = access.member
    ? await model.getMySmallGroupIds(access.member.id)
    : [];

  const groupIds = [...new Set([...mine, ...reach.ledGroupIds])];

  if (groupIds.length > 0) {
    parts.push("(e.visibility = 'small_group' AND e.small_group_id IN (?))");
    params.push(groupIds);
  }

  return { clauseSql: `(${parts.join(" OR ")})`, clauseParams: params };
};

// Narrow a clause to one campus (events of the whole fellowship stay in).
const onlyCampus = (clause, fellowshipId) => {
  const id = Number(fellowshipId);

  if (!Number.isInteger(id) || id < 1) return clause;

  return {
    clauseSql: `(${clause.clauseSql}) AND (e.fellowship_id = ? OR e.fellowship_id IS NULL)`,
    clauseParams: [...clause.clauseParams, id],
  };
};

/* ---------------------------------------------------------------- */
/* Mapping                                                           */
/* ---------------------------------------------------------------- */

const toEvent = (row, occurrence, extras = {}) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  theme: row.theme || "",
  speaker: row.speaker || "",
  category: row.category,
  description: row.description,
  verseReference: row.verse_reference || "",
  verseText: row.verse_text || "",
  location: row.location,
  onlineUrl: row.online_url || "",
  contactPhone: row.contact_phone || "",
  startAt: occurrence.start,
  endAt: occurrence.end,
  firstStartAt: row.start_at,
  firstEndAt: row.end_at,
  allDay: Boolean(row.all_day),
  imageUrl: row.image_url,
  visibility: row.visibility,
  fellowshipId: row.fellowship_id,
  campusName: shortCampus(row.campus_name),
  ministryId: row.ministry_id,
  ministryName: row.ministry_name || "",
  smallGroupId: row.small_group_id,
  smallGroupName: row.small_group_name || "",
  repeatType: row.repeat_type,
  repeatUntil: row.repeat_until,
  featured: Boolean(row.featured),
  rsvpEnabled: Boolean(row.rsvp_enabled),
  capacity: row.capacity,
  status: row.status,
  cancelled: row.status === "cancelled",
  ongoing: occurrence.ongoing,
  ended: occurrence.ended,
  ...extras,
});

/* What the public website is allowed to know about an event. */
const toPublic = (row, occurrence) => ({
  slug: row.slug,
  title: row.title,
  theme: row.theme || "",
  speaker: row.speaker || "",
  category: row.category,
  description: row.description,
  verseReference: row.verse_reference || "",
  verseText: row.verse_text || "",
  location: row.location,
  startAt: occurrence.start,
  endAt: occurrence.end,
  allDay: Boolean(row.all_day),
  imageUrl: row.image_url,
  campusName: shortCampus(row.campus_name),
  ministryName: row.ministry_name || "",
  repeatType: row.repeat_type,
  repeatUntil: row.repeat_until,
  featured: Boolean(row.featured),
  cancelled: row.status === "cancelled",
  ongoing: occurrence.ongoing,
  ended: occurrence.ended,
});

const withOccurrences = (rows, nowStr) =>
  rows
    .map((row) => ({ row, occurrence: time.computeOccurrence(row, nowStr) }))
    .filter((entry) => !entry.occurrence.ended)
    .sort((a, b) => a.occurrence.start.localeCompare(b.occurrence.start));

/* ---------------------------------------------------------------- */
/* Public website                                                    */
/* ---------------------------------------------------------------- */

const publicClause = (fellowshipId) =>
  onlyCampus({ clauseSql: "e.visibility = 'public'", clauseParams: [] }, fellowshipId);

const listPublic = async ({ limit, fellowshipId }) => {
  const size = Math.min(50, Math.max(1, Number(limit) || 12));
  const nowStr = time.nowInChurch();

  const rows = await model.findUpcoming({
    ...publicClause(fellowshipId),
    nowStr,
    search: "",
  });

  return withOccurrences(rows, nowStr)
    .slice(0, size)
    .map((entry) => toPublic(entry.row, entry.occurrence));
};

const getPublicFeatured = async () => {
  const nowStr = time.nowInChurch();

  const rows = await model.findUpcoming({
    ...publicClause(null),
    nowStr,
    search: "",
  });

  const upcoming = withOccurrences(
    rows.filter((row) => row.status === "published"),
    nowStr
  );

  const chosen =
    upcoming.find((entry) => entry.row.featured) || upcoming[0] || null;

  return chosen ? toPublic(chosen.row, chosen.occurrence) : null;
};

const getPublicBySlug = async (slug) => {
  const row = await model.findBySlug(String(slug || ""));

  if (!row || row.visibility !== "public") {
    throw httpError("Event not found.", 404);
  }

  return toPublic(row, time.computeOccurrence(row, time.nowInChurch()));
};

/* ---------------------------------------------------------------- */
/* RSVP                                                              */
/* ---------------------------------------------------------------- */

const attachRsvp = async (items, userId) => {
  const ids = items.filter((item) => item.rsvpEnabled).map((item) => item.id);

  if (ids.length === 0) return items;

  const [summary, mine] = await Promise.all([
    model.getRsvpSummary(ids),
    model.getMyRsvps(ids, userId),
  ]);

  return items.map((item) => {
    if (!item.rsvpEnabled) return item;

    const date = item.startAt.slice(0, 10);
    const rows = summary.filter(
      (row) => row.event_id === item.id && row.date === date
    );

    const count = (response) => {
      const row = rows.find((entry) => entry.response === response);

      return row ? Number(row.people) + Number(row.guests) : 0;
    };

    const own = mine.find(
      (row) => row.event_id === item.id && row.date === date
    );

    return {
      ...item,
      rsvp: {
        going: count("going"),
        maybe: count("maybe"),
        notGoing: count("not_going"),
        mine: own ? own.response : null,
        myGuests: own ? Number(own.guests) : 0,
        full: Boolean(item.capacity) && count("going") >= item.capacity,
      },
    };
  });
};

const nextDate = (row) => {
  const occurrence = time.computeOccurrence(row, time.nowInChurch());

  return { occurrence, date: occurrence.start.slice(0, 10) };
};

const setRsvp = async (access, id, body) => {
  const reach = await reachScope.getReach(access);
  const clause = await viewerClause(access, reach);
  const row = await model.findByIdForViewer(id, clause.clauseSql, clause.clauseParams);

  if (!row) throw httpError("Event not found.", 404);

  if (!row.rsvp_enabled) {
    throw httpError("RSVP is not open for this event.", 400);
  }

  if (row.status === "cancelled") {
    throw httpError("This event was cancelled.", 400);
  }

  const { occurrence, date } = nextDate(row);

  if (occurrence.ended) {
    throw httpError("This event has already taken place.", 400);
  }

  const response = clean(body.response);

  if (!RESPONSES.includes(response)) {
    throw httpError("Choose going, maybe or not going.", 400);
  }

  const guests =
    response === "going"
      ? Math.min(5, Math.max(0, Number.parseInt(body.guests, 10) || 0))
      : 0;

  if (response === "going" && row.capacity) {
    const taken = await model.sumGoing(row.id, date, access.user.id);

    if (taken + 1 + guests > row.capacity) {
      throw httpError("This event is full.", 409);
    }
  }

  await model.upsertRsvp({
    eventId: row.id,
    userId: access.user.id,
    date,
    response,
    guests,
  });

  return { response, guests, date };
};

const removeRsvp = async (access, id) => {
  const reach = await reachScope.getReach(access);
  const clause = await viewerClause(access, reach);
  const row = await model.findByIdForViewer(id, clause.clauseSql, clause.clauseParams);

  if (!row) throw httpError("Event not found.", 404);

  await model.deleteRsvp({
    eventId: row.id,
    userId: access.user.id,
    date: nextDate(row).date,
  });
};

const listRsvps = async (access, id) => {
  const reach = await reachScope.getReach(access);
  const row = await model.findById(id);

  if (!row) throw httpError("Event not found.", 404);

  if (!canManage(row, access, reach)) {
    throw httpError("You can't see the answers for this event.", 403);
  }

  const { date } = nextDate(row);
  const people = await model.listRsvps(row.id, date);

  const total = (response) =>
    people
      .filter((person) => person.response === response)
      .reduce((sum, person) => sum + 1 + Number(person.guests), 0);

  return {
    date,
    capacity: row.capacity,
    going: total("going"),
    maybe: total("maybe"),
    notGoing: total("not_going"),
    people: people.map((person) => ({
      name: fullName(person.first_name, person.last_name),
      email: person.email,
      memberNumber: person.member_number || "",
      response: person.response,
      guests: Number(person.guests),
      answeredAt: person.updated_at,
    })),
  };
};

/* ---------------------------------------------------------------- */
/* Dashboard                                                         */
/* ---------------------------------------------------------------- */

const listForUser = async (access, { scope, search, page, fellowshipId }) => {
  const reach = await reachScope.getReach(access);
  const nowStr = time.nowInChurch();
  const clause = onlyCampus(await viewerClause(access, reach), fellowshipId);
  const term = String(search || "").trim();
  const pageNumber = Math.max(1, Number(page) || 1);
  const offset = (pageNumber - 1) * PAGE_SIZE;

  const extras = (row) => ({
    canManage: canManage(row, access, reach),
    createdBy: fullName(row.creator_first_name, row.creator_last_name),
  });

  if (scope === "past") {
    const { rows, total } = await model.findPast({
      ...clause,
      nowStr,
      search: term,
      limit: PAGE_SIZE,
      offset,
    });

    return {
      items: rows.map((row) =>
        toEvent(row, time.lastOccurrence(row), extras(row))
      ),
      total,
      hasMore: offset + rows.length < total,
    };
  }

  const rows = await model.findUpcoming({ ...clause, nowStr, search: term });
  const all = withOccurrences(rows, nowStr);
  const slice = all.slice(offset, offset + PAGE_SIZE);

  const items = await attachRsvp(
    slice.map((entry) =>
      toEvent(entry.row, entry.occurrence, extras(entry.row))
    ),
    access.user.id
  );

  return { items, total: all.length, hasMore: offset + slice.length < all.length };
};

/*
 * What the "new event" form can offer this person. Each campus has its own
 * ministries and small groups, grouped by campus.
 */
const getOptions = async (access) => {
  const reach = await reachScope.getReach(access);

  if (!reach.canSend) throw httpError("Access denied.", 403);

  const [ministries, smallGroups] = await Promise.all([
    reachScope.listMinistries(reach),
    reachScope.listSmallGroups(reach),
  ]);

  const managesCampus = reach.coversAll || reach.campusIds.length > 0;

  const visibilities = managesCampus
    ? VISIBILITIES
    : [
        ...(reach.ledMinistryIds.length > 0 ? ["members", "ministry"] : []),
        ...(reach.ledGroupIds.length > 0 ? ["small_group"] : []),
      ];

  return {
    canWholeFellowship: reach.coversAll,
    canPublic: managesCampus,
    canFeature: reach.coversAll,
    visibilities,
    categories: CATEGORIES,
    campuses: reach.campuses,
    ministries,
    smallGroups,
  };
};

const getForEdit = async (access, id) => {
  const reach = await reachScope.getReach(access);
  const row = await model.findById(id);

  if (!row) throw httpError("Event not found.", 404);

  if (!canManage(row, access, reach)) {
    throw httpError("You can't edit this event.", 403);
  }

  return toEvent(row, time.computeOccurrence(row, time.nowInChurch()), {
    canManage: true,
  });
};

/* ---------------------------------------------------------------- */
/* Validation                                                        */
/* ---------------------------------------------------------------- */

/*
 * Where the event belongs and who sees it, checked against what this
 * person may do:
 *   whole fellowship      people who serve every campus
 *   a campus              its Main Leader, Fellowship Admin and Staff
 *   a ministry            leaders of that ministry (or the campus leaders)
 *   a small group         its overseers (or the campus leaders)
 */
const resolvePlacement = async (body, reach) => {
  const visibility = clean(body.visibility) || "members";

  if (!VISIBILITIES.includes(visibility)) {
    throw httpError("Choose who can see this event.", 400);
  }

  const managesCampus = (campusId) =>
    campusId === null ? reach.coversAll : reach.coversAll || reach.campusIds.includes(campusId);

  const ministryId = positiveId(body.ministryId, "ministry");
  const smallGroupId = positiveId(body.smallGroupId, "small group");
  let fellowshipId = positiveId(body.fellowshipId, "campus");
  let ministry = null;
  let group = null;

  if (visibility === "small_group") {
    if (!smallGroupId) throw httpError("Choose the small group.", 400);

    group = await model.findSmallGroup(smallGroupId);

    if (!group) throw httpError("That small group was not found.", 400);

    if (!managesCampus(group.fellowship_id) && !reach.ledGroupIds.includes(group.id)) {
      throw httpError("You can only add events for small groups you manage or oversee.", 403);
    }

    fellowshipId = group.fellowship_id;
  } else if (visibility === "ministry" || ministryId) {
    if (!ministryId) throw httpError("Choose the ministry.", 400);

    ministry = await model.findMinistry(ministryId);

    if (!ministry) throw httpError("That ministry was not found.", 400);

    if (
      !managesCampus(ministry.fellowship_id) &&
      !reach.ledMinistryIds.includes(ministry.id)
    ) {
      throw httpError("You can only add events for ministries you manage or lead.", 403);
    }

    fellowshipId = ministry.fellowship_id;
  } else {
    // The whole fellowship, or one campus: only campus leaders.
    if (fellowshipId === null && !reach.coversAll) {
      if (reach.campusIds.length === 1) {
        fellowshipId = reach.campusIds[0];
      } else {
        throw httpError("Choose the campus for this event.", 400);
      }
    }

    if (fellowshipId !== null && !(await model.findCampus(fellowshipId))) {
      throw httpError("That campus was not found.", 400);
    }

    if (!managesCampus(fellowshipId)) {
      throw httpError("You can only add events for campuses you manage.", 403);
    }
  }

  if (visibility === "public" && !managesCampus(fellowshipId)) {
    throw httpError(
      "Only campus leaders can publish events on the public website.",
      403
    );
  }

  return {
    visibility,
    fellowshipId,
    ministryId: ministry ? ministry.id : null,
    smallGroupId: group ? group.id : null,
  };
};

const parseWhen = (body) => {
  const allDay = body.allDay === true || body.allDay === "true";

  if (allDay) {
    const day = parseDateOnly(clean(body.startAt).slice(0, 10));

    if (!day) throw httpError("Enter a valid date.", 400);

    const endDay = clean(body.endAt)
      ? parseDateOnly(clean(body.endAt).slice(0, 10))
      : day;

    if (!endDay) throw httpError("Enter a valid end date.", 400);

    if (endDay < day) throw httpError("The end date can't be before the start date.", 400);

    return { allDay, startAt: `${day} 00:00:00`, endAt: `${endDay} 23:59:00` };
  }

  const startAt = parseDateTime(body.startAt);

  if (!startAt) throw httpError("Enter a valid start date and time.", 400);

  let endAt = null;

  if (clean(body.endAt)) {
    endAt = parseDateTime(body.endAt);

    if (!endAt) throw httpError("Enter a valid end date and time.", 400);

    if (endAt <= startAt) {
      throw httpError("The end time must be after the start time.", 400);
    }
  }

  return { allDay, startAt, endAt };
};

const parseOnlineUrl = (value) => {
  const url = clean(value);

  if (!url) return "";

  if (url.length > 500 || !/^https?:\/\/[^\s]+$/i.test(url)) {
    throw httpError("The online link must start with https://", 400);
  }

  return url;
};

const parseInput = async (body, reach) => {
  const title = clean(body.title);

  if (title.length < 3 || title.length > 150) {
    throw httpError("The title must be between 3 and 150 characters.", 400);
  }

  // Everything else is optional.
  const description = clean(body.description);

  if (description.length > 5000) {
    throw httpError("The description must not exceed 5000 characters.", 400);
  }

  const category = clean(body.category) || "Other";

  if (!CATEGORIES.includes(category)) {
    throw httpError("Choose a valid category.", 400);
  }

  const optional = (value, max, label) => {
    const text = clean(value);

    if (text.length > max) {
      throw httpError(`${label} must not exceed ${max} characters.`, 400);
    }

    return text || null;
  };

  const contactPhone = clean(body.contactPhone);

  if (contactPhone && !/^[0-9+\-\s()]{6,30}$/.test(contactPhone)) {
    throw httpError("Enter a valid contact phone number.", 400);
  }

  const onlineUrl = parseOnlineUrl(body.onlineUrl);
  const when = parseWhen(body);

  const place = clean(body.location);

  if (place.length > 255) {
    throw httpError("The location must not exceed 255 characters.", 400);
  }

  const location = place || (onlineUrl ? "Online" : "To be announced");

  const repeatType = clean(body.repeatType) === "weekly" ? "weekly" : "none";

  let repeatUntil = null;

  if (repeatType === "weekly" && clean(body.repeatUntil)) {
    repeatUntil = parseDateOnly(body.repeatUntil);

    if (!repeatUntil) {
      throw httpError("Enter a valid date for the last repeat.", 400);
    }

    if (repeatUntil < when.startAt.slice(0, 10)) {
      throw httpError("The last repeat can't be before the first date.", 400);
    }
  }

  const rsvpEnabled = body.rsvpEnabled === true || body.rsvpEnabled === "true";

  let capacity = null;

  if (clean(String(body.capacity ?? ""))) {
    capacity = Number(body.capacity);

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 5000) {
      throw httpError("The capacity must be a number between 1 and 5000.", 400);
    }
  }

  const placement = await resolvePlacement(body, reach);
  const wantsFeatured = body.featured === true || body.featured === "true";

  return {
    title,
    theme: optional(body.theme, 150, "The theme"),
    speaker: optional(body.speaker, 150, "The speaker"),
    category,
    description,
    verseReference: optional(body.verseReference, 100, "The verse reference"),
    verseText: optional(body.verseText, 600, "The verse text"),
    location,
    onlineUrl: onlineUrl || null,
    contactPhone: contactPhone || null,
    ...when,
    ...placement,
    repeatType,
    repeatUntil,
    rsvpEnabled,
    capacity: rsvpEnabled ? capacity : null,
    // Only people who serve every campus can feature a public event.
    featured: Boolean(reach.coversAll && wantsFeatured && placement.visibility === "public"),
  };
};

/* ---------------------------------------------------------------- */
/* Images and slugs                                                  */
/* ---------------------------------------------------------------- */

const getCloudinaryPublicId = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") return null;

  try {
    const url = new URL(imageUrl);
    const marker = "/upload/";
    const index = url.pathname.indexOf(marker);

    if (index === -1) return null;

    const path = url.pathname
      .substring(index + marker.length)
      .replace(/^v\d+\//, "")
      .replace(/\.[^/.]+$/, "");

    return decodeURIComponent(path);
  } catch {
    return null;
  }
};

const removeStoredImage = async (imageUrl) => {
  const publicId = getCloudinaryPublicId(imageUrl);

  if (!publicId) return;

  try {
    await deleteImage(publicId);
  } catch (error) {
    console.error("Failed to delete old event image:", error.message);
  }
};

const slugify = (text) =>
  String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "event";

const makeSlug = async (title) => {
  const base = slugify(title);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = `${base}-${crypto.randomBytes(3).toString("hex")}`;

    if (!(await model.slugExists(slug))) return slug;
  }

  return `${base}-${crypto.randomBytes(6).toString("hex")}`;
};

/* ---------------------------------------------------------------- */
/* Changes                                                           */
/* ---------------------------------------------------------------- */

const createEvent = async (access, body, file) => {
  const reach = await reachScope.getReach(access);

  if (!reach.canSend) throw httpError("Access denied.", 403);

  const data = await parseInput(body, reach);

  let uploaded = null;

  if (file) {
    uploaded = await uploadImage(file.buffer, { folder: "chms/events" });
  }

  try {
    const slug = await makeSlug(data.title);

    const id = await model.insertEvent({
      ...data,
      slug,
      imageUrl: uploaded?.secureUrl || null,
      createdBy: access.user.id,
    });

    return { id, slug };
  } catch (error) {
    if (uploaded?.publicId) {
      await deleteImage(uploaded.publicId).catch(() => {});
    }

    throw error;
  }
};

const updateEvent = async (access, id, body, file) => {
  const reach = await reachScope.getReach(access);
  const existing = await model.findById(id);

  if (!existing) throw httpError("Event not found.", 404);

  if (!canManage(existing, access, reach)) {
    throw httpError("You can't edit this event.", 403);
  }

  const data = await parseInput(body, reach);

  const removeRequested =
    body.removeImage === true || body.removeImage === "true";

  let imageUrl = existing.image_url;
  let uploaded = null;

  if (file) {
    uploaded = await uploadImage(file.buffer, { folder: "chms/events" });
    imageUrl = uploaded.secureUrl;
  } else if (removeRequested) {
    imageUrl = null;
  }

  try {
    await model.updateEvent(id, { ...data, imageUrl });
  } catch (error) {
    if (uploaded?.publicId) {
      await deleteImage(uploaded.publicId).catch(() => {});
    }

    throw error;
  }

  if (existing.image_url && (uploaded || removeRequested)) {
    await removeStoredImage(existing.image_url);
  }

  return { id, slug: existing.slug };
};

const changeStatus = async (access, id, status) => {
  const reach = await reachScope.getReach(access);
  const existing = await model.findById(id);

  if (!existing) throw httpError("Event not found.", 404);

  if (!canManage(existing, access, reach)) {
    throw httpError("You can't change this event.", 403);
  }

  await model.setStatus(id, status);
};

const deleteEvent = async (access, id) => {
  const reach = await reachScope.getReach(access);
  const existing = await model.findById(id);

  if (!existing) throw httpError("Event not found.", 404);

  if (!canManage(existing, access, reach)) {
    throw httpError("You can't delete this event.", 403);
  }

  await model.softDelete(id);
};

module.exports = {
  listPublic,
  getPublicFeatured,
  getPublicBySlug,
  listForUser,
  getOptions,
  getForEdit,
  createEvent,
  updateEvent,
  changeStatus,
  deleteEvent,
  setRsvp,
  removeRsvp,
  listRsvps,
};