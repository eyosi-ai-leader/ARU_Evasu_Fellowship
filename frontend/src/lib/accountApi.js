import { getToken } from "@/lib/authToken";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function changePassword({
  currentPassword,
  newPassword,
  confirmPassword,
}) {
  const token = getToken();

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  let response;

  try {
    response = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
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

  if (!response.ok) {
    throw new Error(
      result.message || "Something went wrong. Please try again."
    );
  }

  return result;
}

/**
 * Sign the person out and send them to the login page.
 * inactive: the account was made inactive, so the login page shows the
 * gentle "please contact your fellowship leaders" message.
 */
export function endSession({ inactive = false } = {}) {
  if (typeof window === "undefined") {
    return;
  }

  document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
  localStorage.removeItem("user");

  try {
    if (inactive) {
      sessionStorage.setItem("chms:inactive", "1");
    }
  } catch {
    /* storage can be blocked: ignore */
  }

  window.location.href = "/login";
}

/**
 * GET /api/me: who the signed-in person is and what they may do
 * (roles, campuses they manage, positions, capabilities).
 */
export async function getMyAccess() {
  const token = getToken();

  if (!token) {
    endSession();
    throw new Error("Please sign in again.");
  }

  let response;

  try {
    response = await fetch(`${API_URL}/me`, {
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
    throw new Error(result?.message || "Failed to load your access.");
  }

  const access = result?.data?.capabilities ? result.data : result;

  if (!access?.capabilities) {
    throw new Error("The server returned an invalid response.");
  }

  return access;
}