import { expect, test } from "vitest";
import { config } from "@/proxy";

test("proxy 仅匹配 /admin", () => {
  expect(config.matcher).toContain("/admin/:path*");
});
