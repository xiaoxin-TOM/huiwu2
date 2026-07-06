import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { authConfig } from "@/auth.config";

/** Extracted authorize logic — testable without running NextAuth. */
export async function authorizeCredentials(
  email: string | undefined,
  password: string | undefined,
): Promise<{ id: string; name: string; email: string; role: string } | null> {
  if (!email || !password) return null;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  if (!user.isActive) return null;
  if (!(await verifyPassword(password, user.passwordHash))) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = creds?.email as string | undefined;
        const password = creds?.password as string | undefined;
        return authorizeCredentials(email, password);
      },
    }),
  ],
});
