import {
  ecDateProblem,
  ecValueToIso,
  isoToEcValue,
} from "@/lib/ethiopianCalendar";
import { OTHER_OPTION, getCities } from "@/lib/ethiopiaLocations";
import {
  CHURCH_MINISTRIES,
  HIGH_SCHOOL_MINISTRIES,
  MINISTRY_ROLES,
} from "@/lib/ministryOptions";
import { ROLES, ROLE_NAMES } from "@/lib/roles";

/*
 * Everything the Add Member and Edit Member pages share, so the two forms
 * read, check and send the fields in exactly the same way as the public
 * registration form and the backend.
 */

export const ACADEMIC_STATUSES = ["Student", "Graduate"];

export { MINISTRY_ROLES };

const MINISTRY_PREFIXES = ["highSchoolMinistry", "churchMinistry"];

export const emptyMemberForm = {
  // Personal
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "", // E.C. "year-month-day"

  // Contact
  email: "",
  phone: "",
  telegramUsername: "",

  // Campus and studies
  fellowshipId: "",
  departmentId: "",
  studentId: "",
  academicStatus: "Student",
  entryYear: "", // E.C. year they started at the university
  alumniContactConsent: false,

  // Emergency contact
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",

  // Where they are from (same lists as the registration form)
  homeRegion: "",
  homeCity: "",
  homeTownOther: "",
  address: "", // "Specific place or area"

  // Spiritual background
  previousChurch: "",
  baptismDate: "", // E.C. "year-month-day"
  newChristian: "no",
  highSchoolMinistryName: "",
  highSchoolMinistryOther: "",
  highSchoolMinistryRole: "",
  churchMinistryName: "",
  churchMinistryOther: "",
  churchMinistryRole: "",
  spiritualJourney: "",

  // Role and account
  roleId: String(ROLES.MEMBER),
  status: "Active",
  sendInvitation: true,
};

/**
 * Roles the signed-in person may give when ADDING a member.
 *
 * Small group overseers and ministry leaders are positions (chosen on their
 * small group or ministry), so they are not roles here. Only a Super Admin
 * can give Super Admin and Fellowship Admin (the backend enforces the
 * same rule). Staff is not created here: it is made later with "Change Role"
 * in the members list, which removes the campus.
 */
export function getAssignableRoles(isSuperAdmin) {
  const ids = isSuperAdmin
    ? [ROLES.MEMBER, ROLES.PASTOR, ROLES.FELLOWSHIP_ADMIN, ROLES.ADMIN]
    : [ROLES.MEMBER, ROLES.PASTOR];

  return ids.map((id) => ({ value: String(id), label: ROLE_NAMES[id] }));
}

const ROLE_HELP = {
  [ROLES.PASTOR]:
    "A Main Leader leads the campus chosen above. Small group overseers and ministry leaders are chosen on their small group or ministry.",
  [ROLES.FELLOWSHIP_ADMIN]:
    "A Fellowship Admin administers the campus chosen above.",
  [ROLES.ADMIN]: "A Super Admin manages every campus and every account.",
};

// The short help line shown under the role dropdown.
export function getRoleHelp(roleId) {
  return ROLE_HELP[Number(roleId)] || "";
}

/**
 * The database date (a date-only value) as "YYYY-MM-DD" in Ethiopia's time
 * zone, so the day never shifts whatever time zone the server runs in.
 */
export function toDateOnly(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const toEcDate = (value) => {
  const dateOnly = toDateOnly(value);

  return dateOnly ? isoToEcValue(dateOnly) : "";
};

const text = (value) =>
  value === null || value === undefined ? "" : String(value);

// A saved ministry is either one of the listed ones, or "Other" + the typed name.
function splitMinistry(saved, list) {
  const value = text(saved);

  if (!value) return { name: "", other: "" };

  return list.includes(value)
    ? { name: value, other: "" }
    : { name: OTHER_OPTION, other: value };
}

/**
 * Member from the backend -> form values.
 */
export function memberToForm(member) {
  const region = text(member.home_region);
  const town = text(member.home_town);

  let homeCity = "";
  let homeTownOther = "";

  if (town) {
    if (region && getCities(region).includes(town)) {
      homeCity = town;
    } else {
      homeCity = OTHER_OPTION;
      homeTownOther = town;
    }
  }

  const highSchool = splitMinistry(
    member.high_school_ministry,
    HIGH_SCHOOL_MINISTRIES
  );

  const church = splitMinistry(member.church_ministry, CHURCH_MINISTRIES);

  return {
    firstName: text(member.first_name),
    middleName: text(member.middle_name),
    lastName: text(member.last_name),
    gender: text(member.gender),
    dateOfBirth: toEcDate(member.date_of_birth),

    email: text(member.email),
    phone: text(member.user_phone || member.phone),
    telegramUsername: text(member.telegram_username),

    fellowshipId: text(member.fellowship_id),
    departmentId: text(member.department_id),
    studentId: text(member.student_id),
    academicStatus: member.academic_status || "Student",
    entryYear: text(member.entry_year),
    alumniContactConsent: Boolean(member.alumni_contact_consent),

    emergencyContactName: text(member.emergency_contact_name),
    emergencyContactPhone: text(member.emergency_contact_phone),
    emergencyContactRelation: text(member.emergency_contact_relation),

    homeRegion: region,
    homeCity,
    homeTownOther,
    address: text(member.address),

    previousChurch: text(member.previous_church),
    baptismDate: toEcDate(member.baptism_date),
    newChristian: member.new_christian ? "yes" : "no",
    highSchoolMinistryName: highSchool.name,
    highSchoolMinistryOther: highSchool.other,
    highSchoolMinistryRole: text(member.high_school_ministry_role),
    churchMinistryName: church.name,
    churchMinistryOther: church.other,
    churchMinistryRole: text(member.church_ministry_role),
    spiritualJourney: text(member.spiritual_journey),

    roleId: text(member.role_id),
    status: member.status || "Active",
    sendInvitation: false,
  };
}

/**
 * Returns { fieldName: "message" } (empty object when everything is fine).
 *   mode = "create" | "edit"
 *   student = false skips the entry year check (for people without a campus)
 */
export function validateMemberForm(
  form,
  { mode, hasDepartments = false, student = true }
) {
  const create = mode === "create";
  const errors = {};

  if (!form.firstName.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (create && !form.gender) {
    errors.gender = "Please select the gender.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Please enter a valid email.";
  }

  // Same rule as the registration form (old records may have no phone yet).
  if (create && !form.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (
    form.phone.trim() &&
    form.phone.replace(/\D/g, "").length < 9
  ) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (
    form.telegramUsername.trim() &&
    !/^@?[A-Za-z0-9_]{5,32}$/.test(form.telegramUsername.trim())
  ) {
    errors.telegramUsername =
      "Use 5-32 letters, numbers or underscores (for example @abebe_k).";
  }

  if (
    form.emergencyContactPhone.trim() &&
    !/^[0-9+\-\s()]{6,30}$/.test(form.emergencyContactPhone.trim())
  ) {
    errors.emergencyContactPhone = "Please enter a valid phone number.";
  }

  if (!form.roleId) {
    errors.roleId = "Role is required.";
  }

  if (create && !form.fellowshipId) {
    errors.fellowshipId = "Please select the campus fellowship.";
  }

  if (
    create &&
    form.academicStatus === "Student" &&
    hasDepartments &&
    !form.departmentId
  ) {
    errors.departmentId = "Please select the department.";
  }

  if (student && form.academicStatus === "Student" && !form.entryYear) {
    errors.entryYear = "Please select the year they started (entry year).";
  }

  const dobProblem = ecDateProblem(form.dateOfBirth, "Date of birth");

  if (dobProblem) errors.dateOfBirth = dobProblem;

  const baptismProblem = ecDateProblem(form.baptismDate, "Baptism date");

  if (baptismProblem) errors.baptismDate = baptismProblem;

  if (form.homeCity === OTHER_OPTION && !form.homeTownOther.trim()) {
    errors.homeTownOther = "Please write the city or town.";
  }

  MINISTRY_PREFIXES.forEach((prefix) => {
    const ministry = form[`${prefix}Name`];

    if (ministry === OTHER_OPTION && !form[`${prefix}Other`].trim()) {
      errors[`${prefix}Other`] = "Please write the ministry name.";
    }

    if (ministry && !form[`${prefix}Role`]) {
      errors[`${prefix}Role`] = "Please choose the role.";
    }
  });

  return errors;
}

/**
 * Form values -> FormData for POST /members (create) or PUT /members/:id (edit).
 *
 * Dates go out as normal (G.C.) dates. The entry year goes out as the E.C.
 * year, which is what the database keeps in entry_year.
 *
 * On create, empty fields are left out. On edit, an empty text field is sent
 * empty so the old value is cleared.
 */
export function buildMemberFormData(form, { mode }) {
  const create = mode === "create";
  const data = new FormData();

  const put = (name, value) => {
    const clean = String(value ?? "").trim();

    if (create) {
      if (clean) data.append(name, clean);
    } else {
      data.append(name, clean);
    }
  };

  data.append("firstName", form.firstName.trim());
  put("middleName", form.middleName);
  data.append("lastName", form.lastName.trim());
  data.append("email", form.email.trim());
  put("phone", form.phone);
  put("telegramUsername", form.telegramUsername);
  put("address", form.address);

  if (form.gender) {
    data.append("gender", form.gender);
  }

  const dateOfBirth = ecValueToIso(form.dateOfBirth);

  if (dateOfBirth) data.append("dateOfBirth", dateOfBirth);

  const baptismDate = ecValueToIso(form.baptismDate);

  if (baptismDate) data.append("baptismDate", baptismDate);

  data.append("roleId", String(form.roleId));
  data.append("status", form.status || "Active");

  // Campus and studies
  if (create) {
    data.append("fellowshipId", String(form.fellowshipId));
  }

  put("departmentId", form.departmentId);
  put("studentId", form.studentId);
  data.append("academicStatus", form.academicStatus || "Student");
  put("entryYear", form.entryYear);
  data.append(
    "alumniContactConsent",
    String(Boolean(form.alumniContactConsent))
  );

  // Emergency contact
  put("emergencyContactName", form.emergencyContactName);
  put("emergencyContactPhone", form.emergencyContactPhone);
  put("emergencyContactRelation", form.emergencyContactRelation);

  // Where they are from: the chosen city or town, or the one they typed.
  put("homeRegion", form.homeRegion);

  put(
    "homeTown",
    form.homeCity === OTHER_OPTION ? form.homeTownOther : form.homeCity
  );

  // Spiritual background
  put("previousChurch", form.previousChurch);
  data.append("newChristian", String(form.newChristian === "yes"));
  put("spiritualJourney", form.spiritualJourney);

  MINISTRY_PREFIXES.forEach((prefix) => {
    const chosen = form[`${prefix}Name`];

    const name =
      chosen === OTHER_OPTION ? form[`${prefix}Other`] : chosen;

    put(prefix, name);
    put(`${prefix}Role`, name ? form[`${prefix}Role`] : "");
  });

  return data;
}