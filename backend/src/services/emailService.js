// Email service.
// Sends email over HTTPS (Brevo API) because Railway blocks outbound SMTP
// on the free plan.

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

function toEmailObject(value) {
  if (!value) return null;
  if (typeof value === "string") return { email: value };
  const email = value.address || value.email;
  if (!email) return null;
  return value.name ? { name: value.name, email } : { email };
}

function toEmailList(value) {
  const list = Array.isArray(value) ? value : [value];
  return list.map(toEmailObject).filter(Boolean);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Generic email sender used by registration, verification,
 * welcome, password-reset and announcement emails.
 */
async function sendEmail({ to, subject, text, html, replyTo }) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;

  if (!apiKey || !fromEmail) {
    throw new Error("Email is not configured.");
  }

  if (!to || !subject) {
    throw new Error("Email recipient and subject are required.");
  }

  const recipients = toEmailList(to);
  if (recipients.length === 0) {
    throw new Error("Email recipient and subject are required.");
  }

  const payload = {
    sender: {
      name: process.env.EMAIL_FROM_NAME || "Church Website",
      email: fromEmail,
    },
    to: recipients,
    subject,
  };

  if (html) payload.htmlContent = html;
  if (text) payload.textContent = text;
  if (!html && !text) payload.textContent = subject;

  const reply = toEmailObject(replyTo);
  if (reply) payload.replyTo = reply;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Brevo error ${res.status}: ${detail}`);
    }

    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function sendPrayerRequestNotification(request) {
  const to = process.env.PRAYER_REQUEST_RECIPIENT;

  if (!to) {
    throw new Error("Email is not configured.");
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
    replyTo: { name: request.name, address: request.email },
  });
}

module.exports = { sendEmail, sendPrayerRequestNotification };