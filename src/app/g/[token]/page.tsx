import { notFound } from "next/navigation";
import Link from "next/link";
import { getGuestByToken } from "@/lib/guests-admin";
import ConfirmButton from "@/components/ConfirmButton";

const LEVEL_LABEL: Record<string, string> = {
  VIP: "VIP 嘉宾",
  NORMAL: "嘉宾",
  MEDIA: "媒体",
};

export default async function GuestInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await getGuestByToken(token);
  if (!guest) notFound();
  const meeting = guest.meeting;

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
          <p className="text-sm text-sky-700">尊敬的</p>
          <p className="text-3xl font-bold text-slate-800">{guest.name}</p>
          <p className="text-slate-600">
            {guest.company} {guest.title}
          </p>
          <span className="inline-block rounded-full bg-sky-200 px-3 py-1 text-xs text-sky-800">
            {LEVEL_LABEL[guest.level] ?? guest.level}
          </span>
        </div>

        {guest.bio && (
          <div className="prose prose-sm max-w-none text-slate-600">
            <h3 className="text-base font-semibold">嘉宾简介</h3>
            <p className="whitespace-pre-line">{guest.bio}</p>
          </div>
        )}

        <div className="rounded-xl border border-slate-100 p-4 text-sm text-slate-600">
          <h3 className="mb-2 font-semibold">接待安排</h3>
          {guest.reception ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {guest.reception.arriveMode && (
                <p>抵达：{[guest.reception.arriveMode, guest.reception.arriveNo, guest.reception.arriveTime, guest.reception.arrivePlace].filter(Boolean).join(" ")}</p>
              )}
              {guest.reception.departMode && (
                <p>返程：{[guest.reception.departMode, guest.reception.departNo, guest.reception.departTime].filter(Boolean).join(" ")}</p>
              )}
              {guest.reception.hotelName && (
                <p>酒店：{[guest.reception.hotelName, guest.reception.hotelRoom].filter(Boolean).join(" ")}</p>
              )}
              {guest.reception.carPlate && (
                <p>车辆：{[guest.reception.carPlate, guest.reception.carDriver, guest.reception.carDriverPhone].filter(Boolean).join(" / ")}</p>
              )}
            </div>
          ) : (
            <p>暂无接待安排</p>
          )}
        </div>

        <div className="text-center">
          {guest.confirmed ? (
            <p className="rounded-lg bg-emerald-100 py-3 text-emerald-700">您已确认出席，期待您的到来！</p>
          ) : (
            <ConfirmButton token={token} />
          )}
        </div>

        <div className="text-center text-xs text-slate-400">
          <Link href="/" className="hover:underline">返回首页</Link>
        </div>
      </div>
    </div>
  );
}
