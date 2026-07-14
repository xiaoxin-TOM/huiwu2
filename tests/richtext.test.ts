import { expect, test } from "vitest";
import { isRichHtml, plainTextToHtml } from "@/lib/richtext";

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
