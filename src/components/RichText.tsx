import { safeHtml } from "@/lib/html";

/**
 * 将管理员输入的纯文本安全渲染为 HTML。
 * - 转义 HTML 特殊字符，防止 XSS
 * - 将换行符转为 <br />，实现段落效果
 * 内容字段虽以 Html 命名，但实际按纯文本处理，管理员无需手写标签。
 */
export default function RichText({
  html,
  className = "prose max-w-none",
}: {
  html: string;
  className?: string;
}) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml(html) }} />;
}
