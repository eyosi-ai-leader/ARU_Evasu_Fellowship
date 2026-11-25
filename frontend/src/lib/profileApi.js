import { getToken } from "@/lib/authToken";
import { endSession } from "@/lib/accountApi";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
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

  return result;
}

export async function getMyProfile() {
  const result = await request("/profile/me");
  return result.data;
}

export async function updateMyProfile(formData) {
  const result = await request("/profile/me", {
    method: "PUT",
    body: formData,
  });

  return result.data;
}