import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";

type SessionUser = NonNullable<NonNullable<Awaited<ReturnType<typeof auth>>>["user"]>;

export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role)) redirect("/");
  return user;
}
