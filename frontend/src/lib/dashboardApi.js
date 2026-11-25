import { getToken } from "@/lib/authToken";
import { endSession } from "@/lib/accountApi";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(path) {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication token not found");
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "We couldn't reach the server. Check your connection and try again."
    );
  }

  if (!response.ok) {
    const result = await response.json().catch(() => null);

    // The account was made inactive (or the session ended) while signed in.
    if (response.status === 401 || result?.code === "ACCOUNT_INACTIVE") {
      endSession({ inactive: result?.code === "ACCOUNT_INACTIVE" });
    }

    throw new Error(result?.message || "Failed to load the dashboard");
  }

  return response.json();
}

/**
 * Dashboard numbers for the signed-in person.
 * fellowshipId (optional) narrows the view to one campus, but only a
 * campus the person manages (the server ignores any other).
 */
export function getDashboardOverview({ fellowshipId } = {}) {
  const query = fellowshipId
    ? `?fellowshipId=${encodeURIComponent(fellowshipId)}`
    : "";

  return request(`/dashboard/overview${query}`);
}

// The person's own campus, studies, small groups, families and ministries.
export const getMyFellowshipProfile = () => request("/dashboard/my-fellowship");