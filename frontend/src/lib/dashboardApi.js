import { getToken } from "@/lib/authToken";
import { endSession } from "@/lib/accountApi";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Dashboard numbers for the signed-in person.
 * fellowshipId (optional) narrows the view to one campus, but only a
 * campus the person manages (the server ignores any other).
 */
export async function getDashboardOverview({ fellowshipId } = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication token not found");
  }

  const query = fellowshipId
    ? `?fellowshipId=${encodeURIComponent(fellowshipId)}`
    : "";

  const response = await fetch(`${API_URL}/dashboard/overview${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);

    // The account was made inactive (or the session ended) while signed in.
    if (response.status === 401 || result?.code === "ACCOUNT_INACTIVE") {
      endSession({ inactive: result?.code === "ACCOUNT_INACTIVE" });
    }

    throw new Error(
      result?.message || "Failed to load dashboard overview"
    );
  }

  return response.json();
}