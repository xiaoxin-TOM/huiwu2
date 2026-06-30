function escapeField(v: string | number): string {
  let s = String(v);
  // 防 CSV 公式注入:以 = + - @ 制表/回车 开头的字段(可能来自不可信用户输入)
  // 在表格软件中会被当作公式执行,前置单引号使其变为纯文本。
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeField).join(",")).join("\r\n");
}
