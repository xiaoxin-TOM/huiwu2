import { expect, test } from "vitest";
import { config } from "@/proxy";

test("proxy 匹配 /admin、/r 与 /m 路由", () => {
  expect(config.matcher).toContain("/admin/:path*");
  expect(config.matcher).toContain("/r/:path*");
  expect(config.matcher).toContain("/m/:path*");
});
