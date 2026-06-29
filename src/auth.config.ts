import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no Prisma / libsql imports).
// Used by both the Edge middleware and the full Node.js NextAuth instance.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [], // Credentials provider added in src/lib/auth.ts (Node.js only)
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
