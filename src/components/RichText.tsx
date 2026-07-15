import { safeHtml } from "@/lib/html";
import { isRichHtml } from "@/lib/richtext";
import { sanitizeRichHtml } from "@/lib/richtext-server";

/**
 * 内容渲染(仅服务端组件使用):
 * - 富文本 HTML(编辑器产出)→ 白名单过滤后渲染(渲染端再过滤一次,纵深防御);
 * - 存量纯文本 → 转义 + 换行转 <br>,显示与历史一致。
 */
export default function RichText({
  html,
  className = "prose max-w-none",
}: {
  html: string;
  className?: string;
}) {
  const rendered = isRichHtml(html) ? sanitizeRichHtml(html) : safeHtml(html);
  return <div className={className} dangerouslySetInnerHTML={{ __html: rendered }} />;
}
