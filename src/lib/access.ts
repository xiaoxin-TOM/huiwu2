/**
 * Pure access-control helpers — no Edge/Node runtime dependencies.
 * Extracted so they can be unit-tested without running the middleware.
 */

export function isAdmin(role: string | undefined): boolean {
  return role === "ADMIN";
}
