// What a member can fill in themselves.
const ITEMS = [
  { key: "profileImage", label: "Add a profile photo" },
  { key: "dateOfBirth", label: "Add your date of birth" },
  { key: "phone", label: "Add your phone number" },
  { key: "address", label: "Add your address" },
];

export function getProfileCompleteness(profile) {
  const missing = ITEMS.filter((item) => !profile?.[item.key]);
  const done = ITEMS.length - missing.length;

  return {
    percent: Math.round((done / ITEMS.length) * 100),
    missing,
    complete: missing.length === 0,
  };
}