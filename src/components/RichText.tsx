export default function RichText({
  html,
  className = "prose max-w-none",
}: {
  html: string;
  className?: string;
}) {
  // 内容仅由管理员撰写,视为可信 HTML。
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
