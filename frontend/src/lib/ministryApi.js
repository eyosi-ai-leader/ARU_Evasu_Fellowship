import { getToken } from "@/lib/authToken";
import { endSession } from "@/lib/accountApi";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const enc = encodeURIComponent;

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  // A FormData body (a ministry with a cover image) is sent as it is, and the
  // browser adds the multipart header. Anything else is sent as JSON.
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined && !isForm
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: body !== undefined ? (isForm ? body : JSON.stringify(body)) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "We couldn't reach the server. Check your connection and try again."
    );
  }

  let result = null;

  try {
    result = await response.json();
  } catch {
    /* non-JSON response */
  }

  // The account was made inactive (or the session ended) while signed in.
  if (response.status === 401 || result?.code === "ACCOUNT_INACTIVE") {
    endSession({ inactive: result?.code === "ACCOUNT_INACTIVE" });
    throw new Error(result?.message || "Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(
      result?.message || `Request failed with status ${response.status}`
    );
  }

  return result;
}

/*
 * Ministry details travel as a form so a cover image can come with them.
 *   imageFile:   a File (new or replacement cover image)
 *   removeImage: true to delete the current cover image
 */
function toMinistryForm(data = {}) {
  const form = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (key === "imageFile") {
      if (value) form.append("image", value);
      return;
    }

    if (value === undefined || value === null) return;

    form.append(key, typeof value === "boolean" ? String(value) : value);
  });

  return form;
}

// =====================================================
// CAMPUS MANAGERS (Super Admin, Staff, Fellowship Admin, Main Leader)
// =====================================================

export function getMinistries({ search = "", status = "", fellowshipId = "" } = {}) {
  const params = new URLSearchParams();

  if (search.trim()) params.set("search", search.trim());
  if (status) params.set("status", status);
  if (fellowshipId) params.set("fellowshipId", String(fellowshipId));

  const query = params.toString();

  return request(`/ministries${query ? `?${query}` : ""}`);
}

// The campuses (and the General Fellowship) the person can manage.
export const getMinistryCampuses = () => request("/ministries/campuses");

export const getMinistryById = (id) => request(`/ministries/${enc(id)}`);

// data: { fellowshipId, name, purpose, verseReference, verseText,
//         meetingSchedule, meetingPlace, contactPhone, description,
//         imageFile?, removeImage? }
export const createMinistry = (data) =>
  request("/ministries", { method: "POST", body: toMinistryForm(data) });

export const updateMinistry = (id, data) =>
  request(`/ministries/${enc(id)}`, {
    method: "PUT",
    body: toMinistryForm(data),
  });

export const updateMinistryStatus = (id, status) =>
  request(`/ministries/${enc(id)}/status`, {
    method: "PATCH",
    body: { status },
  });

// Permanently deletes a ministry and its assignments.
export const deleteMinistry = (id) =>
  request(`/ministries/${enc(id)}`, { method: "DELETE" });

// role: "" | "Member" | "Ministry Leader"   status: "" | "Active" | "Inactive" | "All"
export function getMinistryMembers(id, role = "", status = "") {
  const params = new URLSearchParams();

  if (role) params.set("role", role);
  if (status) params.set("status", status);

  const query = params.toString();

  return request(
    `/ministries/${enc(id)}/members${query ? `?${query}` : ""}`
  );
}

// Active members of the ministry's campus who are not in it yet.
export const getMinistryCandidates = (id, search = "") =>
  request(`/ministries/${enc(id)}/candidates?search=${enc(search)}`);

// Add a member, appoint a leader, or promote / change a person's role.
export const assignMinistryMember = (
  ministryId,
  { memberId, assignmentRole = "Member" }
) =>
  request(`/ministries/${enc(ministryId)}/members`, {
    method: "POST",
    body: { memberId, assignmentRole },
  });

// Deactivate or reactivate a person's place in a ministry.
export const updateMinistryMemberStatus = (ministryId, memberId, status) =>
  request(`/ministries/${enc(ministryId)}/members/${enc(memberId)}/status`, {
    method: "PATCH",
    body: { status },
  });

// Removes the person from the ministry for good.
export const removeMinistryMember = (ministryId, memberId) =>
  request(`/ministries/${enc(ministryId)}/members/${enc(memberId)}`, {
    method: "DELETE",
  });

export const moveMinistryMember = (ministryId, memberId, toMinistryId) =>
  request(`/ministries/${enc(ministryId)}/members/${enc(memberId)}/move`, {
    method: "POST",
    body: { toMinistryId },
  });

// =====================================================
// MINISTRY LEADERS (only the ministries they lead)
// =====================================================

export const getMyMinistries = () => request("/ministries/my-ministries");

export const getLeaderMinistryMembers = (ministryId, status = "Active") =>
  request(
    `/ministries/${enc(ministryId)}/leader-members?status=${enc(status)}`
  );

export const updateLeaderMinistryDetails = (ministryId, data) =>
  request(`/ministries/${enc(ministryId)}/leader-details`, {
    method: "PATCH",
    body: toMinistryForm(data),
  });

export const addLeaderMinistryMember = (ministryId, memberId) =>
  request(`/ministries/${enc(ministryId)}/leader-members`, {
    method: "POST",
    body: { memberId },
  });

export const updateLeaderMemberAssignmentStatus = (
  ministryId,
  memberId,
  status
) =>
  request(
    `/ministries/${enc(ministryId)}/leader-members/${enc(memberId)}/status`,
    { method: "PATCH", body: { status } }
  );

export const removeLeaderMinistryMember = (ministryId, memberId) =>
  request(
    `/ministries/${enc(ministryId)}/leader-members/${enc(memberId)}`,
    { method: "DELETE" }
  );
