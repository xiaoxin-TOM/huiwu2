import { expect, test } from "vitest";
import { isRichHtml, plainTextToHtml } from "@/lib/richtext";
import { sanitizeRichHtml } from "@/lib/richtext-server";

test("isRichHtml 识别 HTML 标签内容", () => {
  expect(isRichHtml("<p>你好</p>")).toBe(true);
  expect(isRichHtml("<ul><li>a</li></ul>")).toBe(true);
});

test("isRichHtml 对纯文本与数学符号返回 false", () => {
  expect(isRichHtml("第一行\n第二行")).toBe(false);
  expect(isRichHtml("a < b 且 c > d")).toBe(false);
  expect(isRichHtml("")).toBe(false);
});

test("plainTextToHtml 按行转段落并转义特殊字符", () => {
  expect(plainTextToHtml("第一行\n第二行")).toBe("<p>第一行</p><p>第二行</p>");
  expect(plainTextToHtml("a<b>c")).toBe("<p>a&lt;b&gt;c</p>");
  expect(plainTextToHtml("")).toBe("");
});

test("sanitizeRichHtml 保留白名单标签", () => {
  const input = "<h2>标题</h2><p><strong>粗</strong><em>斜</em></p><ul><li>项</li></ul><blockquote>引</blockquote>";
  expect(sanitizeRichHtml(input)).toBe(input);
});

test("sanitizeRichHtml 剥除危险内容", () => {
  expect(sanitizeRichHtml('<p>x</p><script>alert(1)</script>')).toBe("<p>x</p>");
  expect(sanitizeRichHtml('<p onclick="x()">y</p>')).toBe("<p>y</p>");
  expect(sanitizeRichHtml('<div><span>文字保留</span></div>')).toBe("文字保留");
});

test("sanitizeRichHtml 链接只留安全协议并补 rel/target", () => {
  const out = sanitizeRichHtml('<a href="https://example.com">链接</a>');
  expect(out).toContain('href="https://example.com"');
  expect(out).toContain('rel="noopener noreferrer"');
  expect(out).toContain('target="_blank"');
  expect(sanitizeRichHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
});

test("sanitizeRichHtml 空串返回空串", () => {
  expect(sanitizeRichHtml("")).toBe("");
});
