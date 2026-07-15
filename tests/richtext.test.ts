import { expect, test } from "vitest";
import { isRichHtml, plainTextToHtml } from "@/lib/richtext";
import { sanitizeRichHtml } from "@/lib/richtext-server";
import RichText from "@/components/RichText";

function renderedHtml(html: string): string {
  const el = RichText({ html }) as { props: { dangerouslySetInnerHTML: { __html: string } } };
  return el.props.dangerouslySetInnerHTML.__html;
}

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

test("RichText 对旧纯文本维持转义+换行", () => {
  expect(renderedHtml("第一行\n<注意>")).toBe("第一行<br />&lt;注意&gt;");
});

test("RichText 对富文本走白名单过滤", () => {
  expect(renderedHtml("<p>x</p><script>bad()</script>")).toBe("<p>x</p>");
  expect(renderedHtml("<h2>标题</h2>")).toBe("<h2>标题</h2>");
});

test("sanitizeRichHtml 拦截协议相对链接,保留站内相对路径", () => {
  expect(sanitizeRichHtml('<a href="//evil.com">x</a>')).not.toContain("//evil.com");
  expect(sanitizeRichHtml('<a href="/schedule">日程</a>')).toContain('href="/schedule"');
});
