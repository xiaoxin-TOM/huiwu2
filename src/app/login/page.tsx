import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveMeeting } from "@/lib/meetings";
import { meetingHref } from "@/lib/public";
import { isAdmin } from "@/lib/access";
import { getSafeCallbackUrl } from "@/lib/urls";
import { LoginForm } from "./LoginForm";

async function getUserHome(role: string | undefined): Promise<string> {
  if (isAdmin(role)) return "/admin";
  try {
    const meeting = await resolveMeeting();
    return meetingHref(meeting.id, "/");
  } catch {
    return "/";
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session?.user) {
    const target = getSafeCallbackUrl(callbackUrl) ?? (await getUserHome(session.user.role as string | undefined));
    redirect(target);
  }

  return (
    <Suspense fallback={<div className="py-8 text-center text-sm text-slate-500">加载中…</div>}>
      <LoginForm />
    </Suspense>
  );
}
