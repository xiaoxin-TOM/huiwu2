import { describe, expect, it } from "vitest";
import { isAdmin } from "@/lib/access";

describe("isAdmin", () => {
  it('isAdmin("ADMIN") === true', () => {
    expect(isAdmin("ADMIN")).toBe(true);
  });

  it('isAdmin("USER") === false', () => {
    expect(isAdmin("USER")).toBe(false);
  });

  it("isAdmin(undefined) === false", () => {
    expect(isAdmin(undefined)).toBe(false);
  });

  it('isAdmin("") === false', () => {
    expect(isAdmin("")).toBe(false);
  });
});
