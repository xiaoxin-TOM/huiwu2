import { notFound } from "next/navigation";
import Link from "next/link";
import { getSpeakerByToken } from "@/lib/speakers-admin";
import { currentUser } from "@/lib/session";
import SpeakerAcceptButton from "@/components/SpeakerAcceptButton";

export default async function SpeakerInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const speaker = await getSpeakerByToken(token);
  if (!speaker) notFound();
  const meeting = speaker.meeting;
  const user = await currentUser();

  const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/s/${token}`)}`;

  let status: "unauthenticated" | "owned" | "taken" | "pending" = "pending";
  if (!user) {
    status = "unauthenticated";
  } else if (speaker.confirmed && speaker.userId === user.id) {
    status = "owned";
  } else if (speaker.confirmed) {
    status = "taken";
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-2xl space-y-6 rounded-2xl bg-white p-6 shadow-sm md:p-10">
        <h1 className="text-center text-2xl font-bold text-slate-800">{meeting.title}</h1>
        {meeting.location && (
          <p className="text-center text-sm text-slate-500">
            地点：{meeting.location}
            {meeting.startDate && ` · 时间：${meeting.startDate}${meeting.endDate ? ` ~ ${meeting.endDate}` : ""}`}
          </p>
        )}

        <div className="space-y-2 rounded-xl bg-sky-50 p-5 text-center">
          <p className="text-sm text-sky-700">诚邀</p>
          <p className="text-3xl font-bold text-slate-800">{speaker.name}</p>
          <p className="text-slate-600">
            {speaker.organization} {speaker.title}
          </p>
          <span className="inline-block rounded-full bg-sky-200 px-3 py-1 text-xs text-sky-800">
            {speaker.isModerator ? "主持人" : "讲者"}
          </span>
        </div>

        {speaker.bio && (
          <div className="prose prose-sm max-w-none text-slate-600">
            <h3 className="text-base font-semibold">讲者简介</h3>
            <p className="whitespace-pre-line">{speaker.bio}</p>
          </div>
        )}

        <div className="text-center">
          {status === "unauthenticated" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">请先登录后接受邀约</p>
              <Link
                href={loginUrl}
                className="inline-block rounded-lg bg-sky-700 px-6 py-3 text-white transition hover:bg-sky-800"
              >
                去登录
              </Link>
            </div>
          )}
          {status === "owned" && (
            <p className="rounded-lg bg-emerald-100 py-3 text-emerald-700">您已接受该邀约，欢迎您的参与！</p>
          )}
          {status === "taken" && (
            <p className="rounded-lg bg-amber-100 py-3 text-amber-700">该邀约已被其他账号接受。</p>
          )}
          {status === "pending" && <SpeakerAcceptButton token={token} />}
        </div>

        <div className="text-center text-xs text-slate-400">
          <Link href="/" className="hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
