
const EMAIL_USER = process.env.EMAIL_USER;

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHeader(value = "") {
  return String(value).replace(/[\r\n]/g, " ").trim();
}

function encodeHeader(value = "") {
  return `=?UTF-8?B?${Buffer.from(String(value), "utf8").toString("base64")}?=`;
}

function base64Lines(value) {
  const encoded = Buffer.from(value, "utf8").toString("base64");
  return encoded.match(/.{1,76}/g)?.join("\r\n") || "";
}

function toBase64Url(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error("Gmail API credentials are not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    cachedToken = null;
    throw new Error(
      `Google token error: ${data.error_description || data.error || "Authentication failed"}`
    );
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return cachedToken;
}

function createRawEmail({ to, subject, text, html, replyTo }) {
  const senderName = encodeHeader(
    process.env.EMAIL_FROM_NAME || "ARU EvaSUE Fellowship"
  );

  const recipient = safeHeader(
    Array.isArray(to) ? to.join(", ") : to
  );

  const headers = [
    `From: ${senderName} <${EMAIL_USER}>`,
    `To: ${recipient}`,
    `Subject: ${encodeHeader(safeHeader(subject))}`,
    "MIME-Version: 1.0",
  ];

  if (replyTo) {
    const replyAddress =
      typeof replyTo === "string"
        ? replyTo
        : replyTo.name
          ? `${encodeHeader(replyTo.name)} <${safeHeader(replyTo.address)}>`
          : safeHeader(replyTo.address);

    headers.push(`Reply-To: ${replyAddress}`);
  }

  const boundary = `chms_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

  const parts = [];

  if (text) {
    parts.push([
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64Lines(text),
    ].join("\r\n"));
  }

  if (html) {
    parts.push([
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64Lines(html),
    ].join("\r\n"));
  }

  parts.push(`--${boundary}--`);

  return toBase64Url(
    headers.join("\r\n") + "\r\n\r\n" + parts.join("\r\n")
  );
}

/**
 * Generic email sender used by registration, verification,
 * welcome, password-reset and announcement emails.
 */
async function sendEmail({ to, subject, text, html, replyTo }) {
  if (!EMAIL_USER) {
    throw new Error("EMAIL_USER is not configured.");
  }

  if (!to || !subject) {
    throw new Error("Email recipient and subject are required.");
  }

  if (!text && !html) {
    throw new Error("Email text or HTML content is required.");
  }

  const accessToken = await getAccessToken();

  const raw = createRawEmail({
    to,
    subject,
    text,
    html,
    replyTo,
  });

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Gmail send error: ${data.error?.message || "Email delivery failed"}`
    );
  }

  return data;
}

async function sendPrayerRequestNotification(request) {
  const to = process.env.PRAYER_REQUEST_RECIPIENT;

  if (!to) {
    throw new Error("PRAYER_REQUEST_RECIPIENT is not configured.");
  }

  const text = [
    "A new prayer request was submitted on the church website.",
    "",
    `Name: ${request.name}`,
    `Email: ${request.email}`,
    `Phone: ${request.phone || "Not provided"}`,
    "",
    "Request:",
    request.message,
    "",
    `Reference: #${request.id}`,
  ].join("\n");

  const html = `
    <p>A new prayer request was submitted on the church website.</p>
    <p>
      <strong>Name:</strong> ${escapeHtml(request.name)}<br>
      <strong>Email:</strong> ${escapeHtml(request.email)}<br>
      <strong>Phone:</strong> ${escapeHtml(request.phone || "Not provided")}
    </p>
    <p><strong>Request:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(request.message)}</p>
    <p style="color:#666">Reference: #${request.id}</p>
  `;

  await sendEmail({
    to,
    subject: `New prayer request #${request.id}`,
    text,
    html,
    replyTo: {
      name: request.name,
      address: request.email,
    },
  });
}

module.exports = {
  sendEmail,
  sendPrayerRequestNotification,
};
