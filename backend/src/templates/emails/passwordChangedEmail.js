function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const passwordChangedEmail = ({ firstName }) => {
  const fellowshipName =
    process.env.CHURCH_NAME || "Arsi University EvaSUE Fellowship";
  const name = escapeHtml(firstName || "friend");

  const subject = "Your password was changed";

  const text = [
    `Hello ${firstName || "friend"},`,
    "",
    `The password for your ${fellowshipName} account was just changed.`,
    "",
    "If this was you, no action is needed.",
    "If it was not you, reset your password right away using \"Forgot password\" on the sign-in page and contact the fellowship leaders.",
  ].join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b">
    <h2 style="margin:0 0 12px;color:#0f172a">Your password was changed</h2>
    <p style="line-height:1.6">Hello ${name}, the password for your <strong>${escapeHtml(fellowshipName)}</strong> account was just changed.</p>
    <p style="line-height:1.6">If this was you, no action is needed.</p>
    <p style="line-height:1.6;color:#b91c1c">If it was not you, use <strong>Forgot password</strong> on the sign-in page right away and contact the fellowship leaders.</p>
  </div>`;

  return { subject, text, html };
};

module.exports = passwordChangedEmail;