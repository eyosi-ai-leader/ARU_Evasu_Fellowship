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

/* ------------------------------------------------------------------ */
/* Composing                                                            */
/* ------------------------------------------------------------------ */

// The campuses, ministries and small groups this person can send to.
export const getAudienceOptions = () => request("/announcements/options");

// People this person can reach. Campus, ministry and small group are optional filters.
export const searchMembers = ({
  search = "",
  campusId = "",
  ministryId = "",
  smallGroupId = "",
  page = 1,
  delivery = "both",
} = {}) => {
  const params = new URLSearchParams();

  if (search) params.set("search", search);
  if (campusId) params.set("campusId", String(campusId));
  if (ministryId) params.set("ministryId", String(ministryId));
  if (smallGroupId) params.set("smallGroupId", String(smallGroupId));
  params.set("page", String(page));
  params.set("delivery", delivery);

  return request(`/announcements/members?${params.toString()}`);
};

// audience: { everyone } or { campusIds, ministryIds, smallGroupIds, memberIds }
export const previewAudience = (audience, delivery = "both") =>
  request("/announcements/preview", {
    method: "POST",
    body: { audience, delivery },
  });

// Sends a test email to the person who is writing the announcement.
export const sendTestAnnouncement = ({
  subject,
  message,
  priority,
  actionLabel,
  actionUrl,
}) =>
  request("/announcements/test", {
    method: "POST",
    body: { subject, message, priority, actionLabel, actionUrl },
  });

/*
 * Everything after "audience" is optional:
 *   priority      "normal" | "important" | "urgent"
 *   category      a label such as "Prayer"
 *   pinned        keep it at the top of the inbox
 *   expiresAt     "YYYY-MM-DDTHH:mm" hide it after this time
 *   scheduledAt   "YYYY-MM-DDTHH:mm" send it later
 *   actionLabel / actionUrl   an action button
 */
export const createAnnouncement = ({
  subject,
  message,
  audience,
  delivery = "both",
  priority,
  category,
  pinned,
  expiresAt,
  scheduledAt,
  actionLabel,
  actionUrl,
}) =>
  request("/announcements", {
    method: "POST",
    body: {
      subject,
      message,
      audience,
      delivery,
      priority,
      category,
      pinned,
      expiresAt,
      scheduledAt,
      actionLabel,
      actionUrl,
    },
  });

/* ------------------------------------------------------------------ */
/* Sent and scheduled                                                   */
/* ------------------------------------------------------------------ */

// status (optional): scheduled | sending | sent | partial | failed | cancelled
export const listAnnouncements = ({ search = "", page = 1, status = "" } = {}) => {
  const params = new URLSearchParams();

  if (search) params.set("search", search);
  if (status) params.set("status", status);
  params.set("page", String(page));

  return request(`/announcements?${params.toString()}`);
};

export const getAnnouncementDetails = (id) =>
  request(`/announcements/${id}`);

export const deleteAnnouncement = (id) =>
  request(`/announcements/${id}`, { method: "DELETE" });

export const retryAnnouncement = (id) =>
  request(`/announcements/${id}/retry`, { method: "POST" });

export const retryRecipient = (id, recipientId) =>
  request(`/announcements/${id}/recipients/${recipientId}/retry`, {
    method: "POST",
  });

// Stops an announcement that is scheduled but not sent yet.
export const cancelAnnouncement = (id) =>
  request(`/announcements/${id}/cancel`, { method: "POST" });

// Pins an announcement to the top of everyone's inbox, or unpins it.
export const pinAnnouncement = (id, pinned) =>
  request(`/announcements/${id}/pin`, {
    method: "PATCH",
    body: { pinned },
  });