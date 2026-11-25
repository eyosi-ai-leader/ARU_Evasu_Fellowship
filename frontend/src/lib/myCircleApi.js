import { getToken } from "@/lib/authToken";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// type: "small-groups" | "families" | "ministries"
export async function getMyCircles(type) {
  const token = getToken();

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  let response;

  try {
    response = await fetch(`${API_URL}/dashboard/my-circles/${type}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "We couldn't reach the server. Check your connection and try again."
    );
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || "Failed to load this page.");
  }

  return result?.data?.items ?? [];
}