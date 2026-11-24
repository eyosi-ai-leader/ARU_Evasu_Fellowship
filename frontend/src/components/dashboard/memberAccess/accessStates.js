export const ACCESS_STATES = {
  invited: {
    label: "Invitation pending",
    className: "bg-primary/10 text-primary",
  },
  invite_expired: {
    label: "Invitation expired",
    className: "bg-accent/20 text-ink ring-1 ring-accent/40",
  },
  unverified: {
    label: "Email not verified",
    className: "bg-accent/20 text-ink ring-1 ring-accent/40",
  },
  never_signed_in: {
    label: "Never signed in",
    className: "bg-surface-muted text-body ring-1 ring-line",
  },
  active: {
    label: "Signed in",
    className: "bg-success/10 text-success",
  },
};

// `count` tells the page which number from the summary to show.
// `hint` explains the group in one sentence.
export const FILTERS = [
  {
    id: "never",
    label: "Never signed in",
    count: "neverSignedIn",
    hint: "Members who have not signed in yet. Invite them to set a password.",
  },
  {
    id: "invited",
    label: "Invitation pending",
    count: "invited",
    hint: "An invitation was sent and is still valid.",
  },
  {
    id: "expired",
    label: "Invitation expired",
    count: "expired",
    hint: "The invitation link ran out. Send a new one.",
  },
  {
    id: "unverified",
    label: "Email not verified",
    count: "unverified",
    hint: "They registered but have not confirmed their email.",
  },
  {
    id: "signed_in",
    label: "Signed in",
    count: "signedIn",
    hint: "Members who have signed in at least once.",
  },
  {
    id: "all",
    label: "All members",
    count: "total",
    hint: "Everyone in the list.",
  },
];

// Stops spreadsheet programs from running a cell as a formula.
export const csvCell = (value) => {
  let text = String(value ?? "");

  if (/^[=+\-@]/.test(text)) text = `'${text}`;

  return `"${text.replace(/"/g, '""')}"`;
};