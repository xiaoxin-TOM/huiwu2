import { expect, test } from "vitest";
import { config } from "@/middleware";

test("middleware 仅匹配 /admin", () => {
  expect(config.matcher).toContain("/admin/:path*");
});
