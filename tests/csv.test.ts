import { expect, test } from "vitest";
import { toCsv } from "@/lib/csv";

test("基本拼装,CRLF 分隔", () => {
  const csv = toCsv(["a", "b"], [["1", "2"], ["3", "4"]]);
  expect(csv).toBe("a,b\r\n1,2\r\n3,4");
});

test("含逗号/引号/换行的字段被正确转义", () => {
  const csv = toCsv(["x"], [['含,逗号'], ['含"引号'], ["含\n换行"]]);
  expect(csv).toBe('x\r\n"含,逗号"\r\n"含""引号"\r\n"含\n换行"');
});

test("数字字段可用", () => {
  expect(toCsv(["n"], [[5]])).toBe("n\r\n5");
});

test("同时含逗号与引号的字段", () => {
  expect(toCsv(["x"], [['a,"b']])).toBe('x\r\n"a,""b"');
});

test("以公式字符开头的字段被前置单引号(防 CSV 注入)", () => {
  expect(toCsv(["x"], [["=1+1"]])).toBe("x\r\n'=1+1");
  expect(toCsv(["x"], [["-2"]])).toBe("x\r\n'-2");
  expect(toCsv(["x"], [["@foo"]])).toBe("x\r\n'@foo");
  // 注入 + 引号:先前置单引号,再因含引号整体加引号转义
  expect(toCsv(["x"], [['=HYPERLINK("x")']])).toBe('x\r\n"\'=HYPERLINK(""x"")"');
});
