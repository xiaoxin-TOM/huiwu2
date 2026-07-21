import Link from "next/link";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/session";
import { getUserRegistration } from "@/lib/registrations";
import { resolveMeeting } from "@/lib/meetings";
import { recordChannelVisit, getChannelIdFromCode } from "@/lib/channels-admin";
import { meetingHref } from "@/lib/public";
import { prisma } from "@/lib/prisma";
import RegistrationForm from "@/components/RegistrationForm";
import { STATUS_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";
import { ClipboardListIcon, UserIcon } from "@/components/icons";

export default async function RegisterConfPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; ch?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const meeting = await resolveMeeting(params.m);
  const existing = await getUserRegistration(user.id, meeting.id);

  const { ch } = params;
  if (ch) {
    const channelId = await getChannelIdFromCode(meeting.id, ch);
    if (channelId) {
      await recordChannelVisit(channelId, { sessionId: user.id });
      (await cookies()).set("channel_code", ch, {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
      });
    }
  }

  if (existing) {
    return (
      <div className="space-y-4">
        <PageHeader title="注册报名" />
        <SectionCard>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <ClipboardListIcon className="h-10 w-10" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-800">您已提交报名</h2>
            <p className="mb-1 text-slate-600">
              当前状态：
              <span className="font-semibold text-sky-600">
                {STATUS_LABEL[existing.status] ?? existing.status}
              </span>
            </p>
            <p className="text-sm text-slate-500">参会类型：{existing.type.name}</p>
            <Link
              href={meetingHref(meeting.id, "/me")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 font-medium text-white transition hover:bg-sky-700"
            >
              <UserIcon className="h-5 w-5" />
              前往个人中心
            </Link>
          </div>
        </SectionCard>
      </div>
    );
  }

  const types = await prisma.registrationType.findMany({ orderBy: { fee: "asc" } });
  return (
    <div className="space-y-4">
      <PageHeader title={`${meeting.title} · 注册报名`} />
      <SectionCard title="填写报名信息">
        <RegistrationForm
          meetingId={meeting.id}
          types={types.map((t) => ({ id: t.id, name: t.name, fee: t.fee }))}
          requirePassword={meeting.requirePassword}
        />
      </SectionCard>
    </div>
  );
}
