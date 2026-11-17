const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const toList = (json, keys) => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;

  for (const key of keys) {
    if (Array.isArray(json?.data?.[key])) return json.data[key];
  }

  return [];
};

const request = async (path) => {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
  });

  let json = null;

  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || "Request failed.");
  }

  return json;
};

/**
 * All regular campus fellowships (the General Fellowship is left out,
 * because nobody registers directly into it).
 */
export const getFellowships = async () => {
  const json = await request("/fellowships");

  return toList(json, ["fellowships"])
    .map((item) => ({
      id: item.id,
      name:
        item.name ??
        item.fellowship_name ??
        item.title ??
        `Campus ${item.id}`,
      type: item.fellowship_type ?? item.fellowshipType ?? "regular",
    }))
    .filter((item) => item.type === "regular");
};

/**
 * Departments of one campus fellowship.
 */
export const getDepartments = async (fellowshipId) => {
  const json = await request(`/fellowships/${fellowshipId}/departments`);

  return toList(json, ["departments"]).map((item) => ({
    id: item.id,
    name: item.name ?? item.department_name ?? `Department ${item.id}`,
  }));
};

/* ------------------------------------------------------------------ */
/* Signed-in calls (these send the login token)                        */
/*                                                                     */
/* Everything above is public and is used by the registration form.    */
/* Everything below needs a signed-in person.                          */
/* ------------------------------------------------------------------ */

function getToken() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));

  if (cookie) {
    return decodeURIComponent(cookie.slice("token=".length));
  }

  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

const authRequest = async (path, { method = "GET", params } = {}) => {
  const query = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();

  const headers = {};
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${path}${queryString ? `?${queryString}` : ""}`,
    {
      method,
      headers,
      cache: "no-store",
    }
  );

  let json = null;

  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok || json?.success === false) {
    const error = new Error(json?.message || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return json;
};

/**
 * Who the signed-in person is and what they may do:
 * roleId, isSuperAdmin, scope, positions, capabilities...
 */
export const getMyAccess = async () => {
  const json = await authRequest("/me");

  return json.data;
};

/**
 * The members of the small group(s) the signed-in person leads.
 * Returns { data, pagination } like getMembers().
 */
export const getMySmallGroupMembers = async (options = {}) =>
  authRequest("/members/my-small-group", {
    params: {
      page: options.page,
      limit: options.limit,
      search: options.search,
      status: options.status,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
    },
  });

/**
 * One member of the small group the signed-in person leads.
 * Returns the member (limited fields).
 */
export const getMySmallGroupMemberById = async (memberId) => {
  const json = await authRequest(`/members/my-small-group/${memberId}`);

  return json.data;
};