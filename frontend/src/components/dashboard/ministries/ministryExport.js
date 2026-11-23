const csvCell = (value) => {
  let textValue = String(value ?? "");

  // Stops spreadsheet programs from running a cell as a formula.
  if (/^[\s]*[=+\-@]/.test(textValue)) textValue = `'${textValue}`;

  return `"${textValue.replace(/"/g, '""')}"`;
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const safeFileName = (name) =>
  String(name || "ministry").replace(/[^a-z0-9-_]/gi, "-").replace(/-+/g, "-");

export function exportMinistryCsv(ministry, people) {
  const header = [
    "Name",
    "Member number",
    "Phone",
    "Email",
    "Role in ministry",
    "Assignment status",
  ];

  const lines = people.map((person) => [
    person.name,
    person.memberNumber,
    person.phone,
    person.email,
    person.role,
    person.status,
  ]);

  const csv = [header, ...lines]
    .map((line) => line.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${safeFileName(ministry.name)}-members.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function printMinistryDirectory(ministry, people) {
  const rows = people
    .map(
      (person) => `
        <tr>
          <td>${escapeHtml(person.name)}</td>
          <td>${escapeHtml(person.memberNumber)}</td>
          <td>${escapeHtml(person.phone)}</td>
          <td>${escapeHtml(person.email)}</td>
          <td>${escapeHtml(person.role)}</td>
        </tr>`
    )
    .join("");

  const printWindow = window.open("", "_blank", "width=1100,height=750");

   if (!printWindow) return false;

  printWindow.document.write(`<!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(ministry.name)} directory</title>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
          h1 { margin-bottom: 6px; }
          p { color: #64748b; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 9px; text-align: left; overflow-wrap: anywhere; }
          th { background: #f1f5f9; }
          @media print { body { padding: 0; } tr { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(ministry.name)}</h1>
        <p>Generated ${escapeHtml(new Date().toLocaleString())} · ${people.length} people</p>
        <table>
          <thead>
            <tr><th>Name</th><th>Member number</th><th>Phone</th><th>Email</th><th>Role</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>`);

  printWindow.document.close();

    return true;
}