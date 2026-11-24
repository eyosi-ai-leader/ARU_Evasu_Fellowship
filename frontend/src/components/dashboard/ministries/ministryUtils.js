// "Main Campus Fellowship" -> "Main Campus"
export const shortCampus = (name) =>
  String(name || "").replace(/\s+Fellowship$/i, "");

const text = (value) =>
  value === null || value === undefined ? "" : String(value);

// "General Fellowship" keeps its full name; campuses drop "Fellowship".
export const campusLabel = (campus = {}) =>
  campus.fellowship_type === "general"
    ? text(campus.name) || "General Fellowship"
    : shortCampus(campus.name);

// Smaller, faster copy of a Cloudinary image (other links are left as they are).
export const optimizedImage = (url, width = 1200) => {
  const value = text(url);

  if (!value.includes("res.cloudinary.com") || !value.includes("/upload/")) {
    return value;
  }

  return value.replace("/upload/", `/upload/c_limit,w_${width},q_auto,f_auto/`);
};

// A soft brand colour for ministries that have no cover image yet.
const GRADIENTS = [
  "from-primary to-ink",
  "from-ember to-primary-dark",
  "from-accent to-primary",
  "from-primary-dark to-ink",
  "from-ember to-ink",
  "from-primary to-ember",
];

export const coverGradient = (name) => {
  let sum = 0;

  for (const character of String(name || "")) sum += character.charCodeAt(0);

  return GRADIENTS[sum % GRADIENTS.length];
};

/*
 * The server sends ministries in two shapes (the list uses snake_case, the
 * leader endpoint adds camelCase counts). Everything on screen reads this
 * one shape.
 */
export function normalizeMinistry(raw = {}) {
  return {
    id: raw.id,
    name: text(raw.name),
    description: text(raw.description),
    purpose: text(raw.purpose),
    imageUrl: text(raw.image_url ?? raw.imageUrl),
    verseReference: text(raw.verse_reference ?? raw.verseReference),
    verseText: text(raw.verse_text ?? raw.verseText),
    meetingSchedule: text(raw.meeting_schedule ?? raw.meetingSchedule),
    meetingPlace: text(raw.meeting_place ?? raw.meetingPlace),
    contactPhone: text(raw.contact_phone ?? raw.contactPhone),
    status: raw.status || "Active",
    fellowshipId: raw.fellowship_id ?? raw.fellowshipId ?? null,
    fellowshipName: text(raw.fellowship_name ?? raw.fellowshipName),
    isGeneral: (raw.fellowship_type ?? raw.fellowshipType) === "general",
    memberCount: Number(raw.member_count ?? raw.memberCount ?? 0),
    leaderCount: Number(raw.leader_count ?? raw.leaderCount ?? 0),
    leaderNames: text(raw.leader_names ?? raw.leaderNames),
  };
}

/*
 * One person's place in a ministry (a row of ministry_members).
 */
export function toAssignment(row = {}) {
  const name =
    [row.first_name, row.middle_name, row.last_name]
      .filter(Boolean)
      .join(" ") ||
    row.email ||
    "Unnamed member";

  return {
    key: row.assignment_id ?? `${row.ministry_id}-${row.member_id}`,
    memberId: row.member_id,
    name,
    email: text(row.email),
    phone: text(row.user_phone || row.member_phone || row.phone),
    memberNumber: text(row.member_number),
    gender: text(row.gender),
    age: row.age ?? null,
    profileImage: text(row.profile_image),
    role: row.assignment_role || "Member",
    status: row.assignment_status || "Active",
    memberStatus: text(row.member_status),
  };
}

export const LEADER_ROLE = "Ministry Leader";