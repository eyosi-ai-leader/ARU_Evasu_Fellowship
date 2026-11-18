const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function readJson(response, fallbackMessage) {
  try {
    return await response.json();
  } catch {
    throw new Error(fallbackMessage);
  }
}

/**
 * When the backend rejects a form, it sends the exact field messages in
 * "errors". Show those instead of only "Validation failed".
 */
function errorMessage(result, fallback) {
  if (Array.isArray(result?.errors) && result.errors.length > 0) {
    const messages = [
      ...new Set(result.errors.map((item) => item.msg).filter(Boolean)),
    ];

    if (messages.length > 0) {
      return messages.join("; ");
    }
  }

  return result?.message || fallback;
}

/**
 * Build an Error that also carries the HTTP status, the backend "code"
 * (for example ACCOUNT_INACTIVE) and any extra "data" (for example the
 * member's first name), so the UI can react to specific cases.
 */
function buildError(response, result, fallback) {
  const error = new Error(errorMessage(result, fallback));

  error.status = response.status;
  error.code = result?.code;
  error.data = result?.data;

  return error;
}

export async function loginUser(email, password) {
  let response;

  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
  } catch {
    throw new Error(
      "We couldn't reach the server. Check your connection and try again."
    );
  }

  const result = await readJson(
    response,
    "The server returned an invalid response."
  );

  if (!response.ok) {
    throw buildError(response, result, "Unable to sign in.");
  }

  return result;
}

/**
 * Public member registration.
 *
 * FormData is required because
 * registration supports profile images.
 */
export async function registerUser(formData) {
  let response;

  try {
    response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error(
      "We couldn't reach the server. Check your connection and try again."
    );
  }

  const result = await readJson(
    response,
    "The server returned an invalid response."
  );

  if (!response.ok) {
    throw buildError(response, result, "Unable to create your account.");
  }

  return result;
}