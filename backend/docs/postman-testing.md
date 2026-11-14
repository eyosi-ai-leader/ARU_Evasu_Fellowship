{
  "email": "bekicrypto4314@gmail.com",
  "password": "Mom23eyu?"
}



eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTA1LCJyb2xlSWQiOjEsImVtYWlsIjoiYmVraWNyeXB0bzQzMTRAZ21haWwuY29tIiwiaWF0IjoxNzk0NjQ3OTc0LCJleHAiOjE3OTQ3MzQzNzR9.PJ_eoYoKoE5dtejs8I5LcDEiLX2te5QLyGnyoYqF3qg






it's working correctly but the ui design is bullshit please make it very lateast and standard 2026 with attrative . you know what the whole registeration pages is need update ui design  and the register header are double please remove the one 

and the below is the backend template please give me again with fellowship context or no more church


 

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

const announcementEmail = ({
  firstName,
  subject,
  message,
  senderName,
  senderRole,
  churchName,
  settingsUrl,
  isTest = false,
}) => {
  const safeSubject = singleLine(subject);
  const greeting = `Hello ${firstName || "friend"},`;
  const signature = `${senderName}${senderRole ? `, ${senderRole}` : ""}`;

  const text = [
    isTest ? "[TEST] This is a preview. Only you received it." : null,
    greeting,
    "",
    message,
    "",
    `- ${signature}`,
    churchName,
    "",
    "-----",
    `You receive this because you are a member of ${churchName}.`,
    `To stop announcement emails, open Settings in your member account: ${settingsUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b">
    ${
      isTest
        ? `<p style="background:#fef3c7;color:#92400e;padding:10px 14px;border-radius:8px;font-size:13px">This is a test preview. Only you received it.</p>`
        : ""
    }
    <h2 style="margin:0 0 16px;color:#0f172a">${escapeHtml(safeSubject)}</h2>
    <p style="line-height:1.6">${escapeHtml(greeting)}</p>
    <div style="white-space:pre-wrap;line-height:1.7">${escapeHtml(message)}</div>
    <p style="margin-top:24px;line-height:1.5">
      ${escapeHtml(signature)}<br>
      <span style="color:#64748b">${escapeHtml(churchName)}</span>
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px">
    <p style="color:#94a3b8;font-size:12px;line-height:1.6">
      You receive this because you are a member of ${escapeHtml(churchName)}.
      To stop announcement emails, turn them off in
      <a href="${escapeHtml(settingsUrl)}" style="color:#64748b">Settings</a>.
    </p>
  </div>`;

  return { subject: safeSubject, text, html };
};

module.exports = announcementEmail;


function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const invitationEmail = ({
  firstName,
  inviterName,
  setupUrl,
  hours,
  reminder = false,
}) => {
  const churchName = process.env.CHURCH_NAME || "our church";
  const name = escapeHtml(firstName || "friend");

  const subject = reminder
    ? `Reminder: finish setting up your ${churchName} account`
    : `You're invited to ${churchName}`;

  const intro = reminder
    ? `We noticed you haven't set up your ${churchName} member account yet. Use the button below to choose your password and sign in.`
    : `${inviterName || "The church office"} created a member account for you at ${churchName}. Use the button below to choose your own password and sign in.`;

  const text = [
    `Hello ${firstName || "friend"},`,
    "",
    intro,
    "",
    setupUrl,
    "",
    `This link works once and expires in ${hours} hours.`,
    "If you weren't expecting this email, you can ignore it. Nothing will change.",
  ].join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1e293b">
    <h2 style="margin:0 0 12px;color:#0f172a">${
      reminder ? "Finish setting up your account" : "You're invited"
    }</h2>
    <p style="line-height:1.6">Hello ${name},</p>
    <p style="line-height:1.6">${escapeHtml(intro)}</p>
    <p style="margin:28px 0">
      <a href="${escapeHtml(setupUrl)}"
         style="background:#0f172a;color:#ffffff;padding:13px 26px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block">
        Set my password
      </a>
    </p>
    <p style="color:#64748b;font-size:13px;line-height:1.6">
      This link works once and expires in ${hours} hours.
      If the button doesn't work, copy this address into your browser:<br>
      <span style="word-break:break-all">${escapeHtml(setupUrl)}</span>
    </p>
    <p style="color:#94a3b8;font-size:12px;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:14px;margin-top:24px">
      If you weren't expecting this email, you can ignore it. Nothing will change.
    </p>
  </div>`;

  return { subject, text, html };
};

module.exports = invitationEmail;


function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const passwordChangedEmail = ({ firstName }) => {
  const churchName = process.env.CHURCH_NAME || "our church";
  const name = escapeHtml(firstName || "friend");

  const subject = "Your password was changed";

  const text = [
    `Hello ${firstName || "friend"},`,
    "",
    `The password for your ${churchName} account was just changed.`,
    "",
    "If this was you, no action is needed.",
    "If it was not you, reset your password right away using \"Forgot password\" on the sign-in page and contact the church office.",
  ].join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b">
    <h2 style="margin:0 0 12px;color:#0f172a">Your password was changed</h2>
    <p style="line-height:1.6">Hello ${name}, the password for your <strong>${escapeHtml(churchName)}</strong> account was just changed.</p>
    <p style="line-height:1.6">If this was you, no action is needed.</p>
    <p style="line-height:1.6;color:#b91c1c">If it was not you, use <strong>Forgot password</strong> on the sign-in page right away and contact the church office.</p>
  </div>`;

  return { subject, text, html };
};

module.exports = passwordChangedEmail;

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const passwordResetEmail = ({ firstName, code, minutes }) => {
  const churchName = process.env.CHURCH_NAME || "our church";
  const name = escapeHtml(firstName || "friend");

  const subject = `Your password reset code: ${code}`;

  const text = [
    `Hello ${firstName || "friend"},`,
    "",
    `We received a request to reset your ${churchName} password.`,
    "Your reset code is:",
    "",
    code,
    "",
    `This code expires in ${minutes} minutes.`,
    "If you did not request this, you can ignore this email. Your password will not change.",
  ].join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b">
    <h2 style="margin:0 0 12px;color:#0f172a">Reset your password</h2>
    <p style="line-height:1.6">Hello ${name}, we received a request to reset your <strong>${escapeHtml(churchName)}</strong> password. Enter this code to continue:</p>
    <p style="margin:24px 0;text-align:center">
      <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:10px;background:#f1f5f9;padding:14px 22px;border-radius:12px;color:#0f172a">${code}</span>
    </p>
    <p style="color:#64748b;font-size:14px;line-height:1.6">
      This code expires in ${minutes} minutes. If you did not request this, you can ignore this email and your password will stay the same.
    </p>
  </div>`;

  return { subject, text, html };
};

module.exports = passwordResetEmail;


function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const verificationCodeEmail = ({ firstName, code, minutes }) => {
  const churchName = process.env.CHURCH_NAME || "our church";
  const name = escapeHtml(firstName || "friend");

  const subject = `Your verification code: ${code}`;

  const text = [
    `Hello ${firstName || "friend"},`,
    "",
    `Your verification code for ${churchName} is:`,
    "",
    code,
    "",
    `This code expires in ${minutes} minutes.`,
    "If you did not create this account, you can ignore this email.",
  ].join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b">
    <h2 style="margin:0 0 12px;color:#0f172a">Verify your email</h2>
    <p style="line-height:1.6">Hello ${name}, enter this code to confirm your email for <strong>${escapeHtml(churchName)}</strong>:</p>
    <p style="margin:24px 0;text-align:center">
      <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:10px;background:#f1f5f9;padding:14px 22px;border-radius:12px;color:#0f172a">${code}</span>
    </p>
    <p style="color:#64748b;font-size:14px;line-height:1.6">
      This code expires in ${minutes} minutes. If you did not create this account, you can ignore this email.
    </p>
  </div>`;

  return { subject, text, html };
};

module.exports = verificationCodeEmail;

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const welcomeEmail = ({ firstName, loginUrl }) => {
  const churchName = process.env.CHURCH_NAME || "our church";
  const name = escapeHtml(firstName || "friend");

  const subject = `Welcome to ${churchName}`;

  const text = [
    `Hello ${firstName || "friend"},`,
    "",
    `Welcome to ${churchName}! We're glad you joined our church family.`,
    "",
    "You can sign in to your member account here:",
    loginUrl,
    "",
    "\"Casting all your care upon him; for he careth for you.\" (1 Peter 5:7, KJV)",
    "",
    `Blessings,`,
    churchName,
  ].join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1e293b">
    <h2 style="margin:0 0 12px;color:#0f172a">Welcome, ${name}!</h2>
    <p style="line-height:1.6">
      We're glad you joined <strong>${escapeHtml(churchName)}</strong>. Your member account is ready.
    </p>
    <p style="margin:24px 0">
      <a href="${loginUrl}"
         style="background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">
        Sign in to your account
      </a>
    </p>
    <p style="font-style:italic;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:16px;color:#334155">
      “Casting all your care upon him; for he careth for you.”<br>
      <span style="font-style:normal;color:#64748b">1 Peter 5:7 (KJV)</span>
    </p>
    <p style="color:#64748b;font-size:13px">Blessings,<br>${escapeHtml(churchName)}</p>
  </div>`;

  return { subject, text, html };
};

module.exports = welcomeEmail;
