import { getToken } from "@/lib/authToken";
import { endSession } from "@/lib/accountApi";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(path, { method = "GET", body, form } = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const headers = { Authorization: `Bearer ${token}` };
  let payload;

  if (form) {
    // The browser sets the multipart boundary itself.
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: payload,
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

  if (response.status === 401 || result?.code === "ACCOUNT_INACTIVE") {
    endSession({ inactive: result?.code === "ACCOUNT_INACTIVE" });
    throw new Error(result?.message || "Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(
      result?.message || `Request failed with status ${response.status}`
    );
  }

  return result?.data ?? null;
}

const enc = encodeURIComponent;

// scope: "upcoming" | "past"   fellowshipId: "" = every campus
export function listEvents({
  scope = "upcoming",
  search = "",
  page = 1,
  fellowshipId = "",
} = {}) {
  const params = new URLSearchParams({ scope, page: String(page) });

  if (search) params.set("search", search);
  if (fellowshipId) params.set("fellowshipId", String(fellowshipId));

  return request(`/events?${params.toString()}`);
}

// What the "add event" form can offer this person.
export const getEventOptions = () => request("/events/options");

export const getEventForEdit = (id) => request(`/events/${enc(id)}`);

// form: FormData (the image is optional)
export const createEvent = (form) =>
  request("/events", { method: "POST", form });

export const updateEvent = (id, form) =>
  request(`/events/${enc(id)}`, { method: "PUT", form });

// status: "published" | "cancelled"
export const setEventStatus = (id, status) =>
  request(`/events/${enc(id)}/status`, {
    method: "PATCH",
    body: { status },
  });

export const deleteEvent = (id) =>
  request(`/events/${enc(id)}`, { method: "DELETE" });

// RSVP: response is "going" | "maybe" | "not_going"
export const setRsvp = (id, { response, guests = 0 }) =>
  request(`/events/${enc(id)}/rsvp`, {
    method: "PUT",
    body: { response, guests },
  });

export const removeRsvp = (id) =>
  request(`/events/${enc(id)}/rsvp`, { method: "DELETE" });

// People who answered (for campus and ministry leaders).
export const listRsvps = (id) => request(`/events/${enc(id)}/rsvps`);