import sanitizeHtml from "sanitize-html";

// 仅服务端使用(API 路由 / 服务端组件),客户端 bundle 不得引入本文件。
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "a"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

/** 富文本 HTML 白名单过滤:保存与渲染两端共用的唯一过滤口径。 */
export function sanitizeRichHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}
