export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function nl2br(text: string): string {
  return text.replace(/\r\n|\n|\r/g, "<br />");
}

export function safeHtml(text: string): string {
  return nl2br(escapeHtml(text));
}
