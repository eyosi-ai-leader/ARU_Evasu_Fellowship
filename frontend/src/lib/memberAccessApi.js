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

  let result = {};

  try {
    result = await response.json();
  } catch {
    /* non-JSON response */
  }

  // The account was made inactive (or the session ended) while signed in.
  if (response.status === 401 || result.code === "ACCOUNT_INACTIVE") {
    endSession({ inactive: result.code === "ACCOUNT_INACTIVE" });
    throw new Error(result.message || "Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(
      result.message || "Something went wrong. Please try again."
    );
  }

  return result.data;
}

// fellowshipId (optional): only the members of this campus
const query = ({ filter = "never", search = "", page, fellowshipId } = {}) => {
  const params = new URLSearchParams();

  params.set("filter", filter);
  if (search) params.set("search", search);
  if (fellowshipId) params.set("fellowshipId", String(fellowshipId));
  if (page) params.set("page", String(page));

  return params.toString();
};

export const listMemberAccess = (options) =>
  request(`/member-access?${query(options)}`);

export const exportMemberAccess = (options) =>
  request(`/member-access/export?${query(options)}`);

export const inviteMember = (memberId) =>
  request(`/member-access/${memberId}/invite`, { method: "POST" });

export const inviteMembers = (memberIds) =>
  request("/member-access/invite-bulk", {
    method: "POST",
    body: { memberIds },
  });

export const setMemberStatus = (memberId, status) =>
  request(`/member-access/${memberId}/status`, {
    method: "PATCH",
    body: { status },
  });

export const deleteMemberAccount = (memberId) =>
  request(`/member-access/${memberId}`, { method: "DELETE" });