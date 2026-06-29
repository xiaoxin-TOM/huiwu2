import { describe, expect, it } from "vitest";
import { authConfig } from "@/auth.config";

// Cast callbacks to allow direct invocation in unit tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const callbacks = authConfig.callbacks as any;

describe("authConfig callbacks", () => {
  describe("jwt callback", () => {
    it("user 存在时把 id 和 role 写入 token", () => {
      const token = {};
      const user = { id: "user-x", role: "ADMIN", name: "Test", email: "t@t.com" };
      const result = callbacks.jwt({ token, user });
      expect(result.id).toBe("user-x");
      expect(result.role).toBe("ADMIN");
    });

    it("user 不存在时 token 保持原样", () => {
      const token = { id: "existing-id", role: "USER" };
      const result = callbacks.jwt({ token, user: undefined });
      expect(result.id).toBe("existing-id");
      expect(result.role).toBe("USER");
    });
  });

  describe("session callback", () => {
    it("把 token.id 和 token.role 写入 session.user", () => {
      const session = { user: { name: "Test", email: "t@t.com" } };
      const token = { id: "user-x", role: "ADMIN" };
      const result = callbacks.session({ session, token });
      expect(result.user.id).toBe("user-x");
      expect(result.user.role).toBe("ADMIN");
    });
  });
});
