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