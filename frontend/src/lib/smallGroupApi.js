import { getToken } from "@/lib/authToken";
import { endSession } from "@/lib/accountApi";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
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
      result?.message || "Something went wrong. Please try again."
    );
  }

  return result?.data;
}

/* Small groups */
export const getSmallGroups = () => request("/small-groups");

export const createSmallGroup = (body) =>
  request("/small-groups", { method: "POST", body });

export const updateSmallGroup = (groupId, body) =>
  request(`/small-groups/${groupId}`, { method: "PUT", body });

/* Overseers (small group leaders) */
export const addOverseer = (groupId, memberId) =>
  request(`/small-groups/${groupId}/leaders`, {
    method: "POST",
    body: { memberId },
  });

export const removeOverseer = (groupId, memberId) =>
  request(`/small-groups/${groupId}/leaders/${memberId}`, {
    method: "DELETE",
  });

/* Families */
export const getFamilies = (groupId) =>
  request(`/small-groups/${groupId}/families`);

export const createFamily = (groupId, body) =>
  request(`/small-groups/${groupId}/families`, { method: "POST", body });

export const updateFamily = (familyId, body) =>
  request(`/small-groups/families/${familyId}`, { method: "PUT", body });

export const deleteFamily = (familyId) =>
  request(`/small-groups/families/${familyId}`, { method: "DELETE" });

// members: [{ memberId, familyRole: "Father" | "Mother" | "Child" }]
export const saveFamilyMembers = (familyId, members) =>
  request(`/small-groups/families/${familyId}/members`, {
    method: "PUT",
    body: { members },
  });

export const removeFamilyMember = (familyId, memberId) =>
  request(`/small-groups/families/${familyId}/members/${memberId}`, {
    method: "DELETE",
  });

// People who could be added to a family of this small group.
export const getCandidates = (groupId, search = "") =>
  request(
    `/small-groups/${groupId}/candidates?search=${encodeURIComponent(search)}`
  );