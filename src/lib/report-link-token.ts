import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * 汇报链接的密码放行凭证。
 *
 * 不建会话表：密码校验通过后下发的 cookie 值是 HMAC(token + passwordHash)，
 * 服务端凭 AUTH_SECRET 就能验证。改密码或换 token 时哈希随之改变，
 * 已发出的 cookie 自动失效，无需清理任何存储。
 */

/** cookie 名用 token 的哈希前缀，避免把原始 token 写进 Cookie 头 */
export function reportLinkCookieName(token: string): string {
  return `rl_${createHash("sha256").update(token).digest("hex").slice(0, 16)}`;
}

export function signReportLinkCookie(token: string, passwordHash: string, secret: string): string {
  return createHmac("sha256", secret).update(`${token}:${passwordHash}`).digest("hex");
}

export function verifyReportLinkCookie(
  value: string | undefined | null,
  token: string,
  passwordHash: string,
  secret: string,
): boolean {
  if (!value) return false;
  const expected = signReportLinkCookie(token, passwordHash, secret);
  if (value.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(value, "hex"), Buffer.from(expected, "hex"));
  } catch {
    // 非法十六进制等输入直接判否，不抛给调用方
    return false;
  }
}
