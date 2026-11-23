function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const singleLine = (value) =>
  String(value || "").replace(/[\r\n]+/g, " ").trim();

const BANNERS = {
  urgent: { label: "Urgent", background: "#fee2e2", color: "#991b1b" },
  important: { label: "Important", background: "#fef3c7", color: "#92400e" },
};

const announcementEmail = ({
  firstName,
  subject,
  message,
  senderName,
  senderRole,
  churchName,
  settingsUrl,
  isTest = false,
  priority = "normal",
  actionLabel = "",
  actionUrl = "",
}) => {
  // The caller still sends this as "churchName"; it is the fellowship name.
  const fellowshipName = churchName || "Arsi University Evasu Fellowship";

  const banner = BANNERS[priority] || null;
  const safeSubject = singleLine(subject);
  const emailSubject =
    priority === "urgent" ? `Urgent: ${safeSubject}` : safeSubject;
  const greeting = `Hello ${firstName || "friend"},`;
  const signature = `${senderName}${senderRole ? `, ${senderRole}` : ""}`;

  const text = [
    isTest ? "[TEST] This is a preview. Only you received it." : null,
    banner ? `[${banner.label.toUpperCase()}]` : null,
    greeting,
    "",
    message,
    actionUrl ? "" : null,
    actionUrl ? `${actionLabel || "Open"}: ${actionUrl}` : null,
    "",
    `- ${signature}`,
    fellowshipName,
    "",
    "-----",
    `You receive this because you are a member of ${fellowshipName}.`,
    `To stop announcement emails, open Settings in your member account: ${settingsUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b">
    ${
      isTest
        ? `<p style="background:#e0e7ff;color:#3730a3;padding:10px 14px;border-radius:8px;font-size:13px">This is a test preview. Only you received it.</p>`
        : ""
    }
    ${
      banner
        ? `<p style="background:${banner.background};color:${banner.color};padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;display:inline-block">${banner.label}</p>`
        : ""
    }
    <h2 style="margin:0 0 16px;color:#0f172a">${escapeHtml(safeSubject)}</h2>
    <p style="line-height:1.6">${escapeHtml(greeting)}</p>
    <div style="white-space:pre-wrap;line-height:1.7">${escapeHtml(message)}</div>
    ${
      actionUrl
        ? `<p style="margin:24px 0 0">
             <a href="${escapeHtml(actionUrl)}"
                style="background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block">
               ${escapeHtml(actionLabel || "Open")}
             </a>
           </p>`
        : ""
    }
    <p style="margin-top:24px;line-height:1.5">
      ${escapeHtml(signature)}<br>
      <span style="color:#64748b">${escapeHtml(fellowshipName)}</span>
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px">
    <p style="color:#94a3b8;font-size:12px;line-height:1.6">
      You receive this because you are a member of ${escapeHtml(fellowshipName)}.
      To stop announcement emails, turn them off in
      <a href="${escapeHtml(settingsUrl)}" style="color:#64748b">Settings</a>.
    </p>
  </div>`;

  return { subject: emailSubject, text, html };
};

module.exports = announcementEmail;