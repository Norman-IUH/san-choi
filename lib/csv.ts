export function csv(rows: (string | number | null)[][]) {
  return "\uFEFF" + rows.map(row => row.map(value => {
    const text = String(value ?? "");
    const safe = typeof value === "string" && /^(\s*[=+\-@]|[\t\n\r])/u.test(text) ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
  }).join(",")).join("\r\n");
}
