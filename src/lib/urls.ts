/**
 * 安全地从 callbackUrl 中提取内部路径，防止开放重定向到外部站点。
 */
export function getSafeCallbackUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw, "http://localhost");
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    const path = url.pathname + url.search;
    if (!path.startsWith("/")) return undefined;
    // 避免在登录/注册页之间循环跳转
    if (path === "/login" || path.startsWith("/login?")) return undefined;
    if (path === "/register" || path.startsWith("/register?")) return undefined;
    return path;
  } catch {
    return undefined;
  }
}
