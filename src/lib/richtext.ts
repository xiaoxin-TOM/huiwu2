import { escapeHtml } from "@/lib/html";

/**
 * 判断内容是否为富文本 HTML(编辑器产出)。
 * 旧数据是管理员手打的纯文本,不含 <tag> 形式的标签;
 * "a < b" 这类比较符后无字母紧跟,不会误判。
 */
export function isRichHtml(content: string): boolean {
  return /<[a-z][a-z0-9]*(\s[^>]*)?>/i.test(content);
}

/** 旧纯文本喂给富文本编辑器前的转换:转义后按行拆成 <p> 段落。 */
export function plainTextToHtml(text: string): string {
  if (!text) return "";
  return text
    .split(/\r\n|\n|\r/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}
