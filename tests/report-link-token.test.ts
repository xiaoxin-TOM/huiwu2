import { expect, test } from "vitest";
import {
  reportLinkCookieName,
  signReportLinkCookie,
  verifyReportLinkCookie,
} from "@/lib/report-link-token";

const SECRET = "test-secret";
const token = "1f0a5b6c-1111-2222-3333-444455556666";
const hash = "$2b$10$abcdefghijklmnopqrstuv";

test("签发的 cookie 能被同样的 token 与密码哈希验证通过", () => {
  const value = signReportLinkCookie(token, hash, SECRET);
  expect(verifyReportLinkCookie(value, token, hash, SECRET)).toBe(true);
});

test("密码改了以后旧 cookie 立即失效", () => {
  const value = signReportLinkCookie(token, hash, SECRET);
  expect(verifyReportLinkCookie(value, token, "$2b$10$DIFFERENTHASHvalue000", SECRET)).toBe(false);
});

test("换一个链接的 token 无法复用同一个 cookie", () => {
  const value = signReportLinkCookie(token, hash, SECRET);
  expect(verifyReportLinkCookie(value, "另一个-token", hash, SECRET)).toBe(false);
});

test("服务端密钥不同则验证失败", () => {
  const value = signReportLinkCookie(token, hash, SECRET);
  expect(verifyReportLinkCookie(value, token, hash, "another-secret")).toBe(false);
});

test("空值、乱码、长度不符的输入都不通过且不抛异常", () => {
  for (const bad of ["", "  ", "not-hex", "zz".repeat(32), "ab", undefined]) {
    expect(verifyReportLinkCookie(bad, token, hash, SECRET)).toBe(false);
  }
});

test("cookie 名按 token 区分，互不覆盖", () => {
  expect(reportLinkCookieName(token)).not.toBe(reportLinkCookieName("other-token"));
  expect(reportLinkCookieName(token)).toMatch(/^rl_[a-z0-9]+$/i);
});

test("cookie 名不泄漏原始 token", () => {
  expect(reportLinkCookieName(token)).not.toContain(token);
});
