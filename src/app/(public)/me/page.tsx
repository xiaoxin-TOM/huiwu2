import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listUserRegistrationsAcrossMeetings } from "@/lib/registrations";
import { listUserBookings } from "@/lib/bookings";
import { resolveMeeting } from "@/lib/meetings";
import { meetingHref } from "@/lib/public";
import { getSpeakerByUserId, listSpeakersByUserId } from "@/lib/speakers-admin";
import { STATUS_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard, DataCard, IconCard } from "@/components/ui/Card";
import LogoutButton from "@/components/LogoutButton";
import CheckinQrCode from "@/components/CheckinQrCode";
import MeetingSwitchLink from "@/components/MeetingSwitchLink";
import { UserIcon, ClipboardListIcon, HotelIcon, FileTextIcon, UploadIcon } from "@/components/icons";

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const user = await requireUser();
  const meeting = await resolveMeeting((await searchParams).m);
  const [allRegistrations, bookings, speaker, allSpeakers] = await Promise.all([
    listUserRegistrationsAcrossMeetings(user.id),
    listUserBookings(user.id, meeting.id),
    getSpeakerByUserId(user.id, meeting.id),
    listSpeakersByUserId(user.id),
  ]);
  const speakerByMeeting = new Map(allSpeakers.map((s) => [s.meetingId, s]));

  return (
    <div className="space-y-4">
      <PageHeader title="个人中心" action={<LogoutButton variant="dark" />} />

      <SectionCard>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
      </SectionCard>

      {speaker && (
        <SectionCard title="讲者身份">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{speaker.name}</p>
              <p className="text-sm text-slate-500">
                {speaker.organization} {speaker.title}
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">已认证</span>
          </div>
        </SectionCard>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <IconCard href={meetingHref(meeting.id, "/register-conf")} title="我的报名" icon={<ClipboardListIcon className="h-6 w-6" />} />
        <IconCard href={meetingHref(meeting.id, "/hotels")} title="我的预订" icon={<HotelIcon className="h-6 w-6" />} />
        {speaker && (
          <IconCard
            href={meetingHref(meeting.id, "/me/speaker-materials")}
            title="上传报告资料"
            icon={<UploadIcon className="h-6 w-6" />}
          />
        )}
        <IconCard href={meetingHref(meeting.id, "/register-conf")} title="返回报名" icon={<FileTextIcon className="h-6 w-6" />} />
      </div>

      <SectionCard title="我的报名">
        {allRegistrations.length === 0 ? (
          <p className="text-sm text-slate-500">
            尚未报名。
            <Link href={meetingHref(meeting.id, "/register-conf")} className="text-sky-600 hover:underline">
              去报名
            </Link>
          </p>
        ) : (
          <div className="space-y-4">
            {allRegistrations.map((reg) => {
              const isCurrent = reg.meetingId === meeting.id;
              const statusLabel = STATUS_LABEL[reg.status] ?? reg.status;
              const statusClass =
                reg.status === "APPROVED"
                  ? "bg-emerald-100 text-emerald-700"
                  : reg.status === "REJECTED"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700";
              const meetingSpeaker = speakerByMeeting.get(reg.meetingId);
              return (
                <div
                  key={reg.id}
                  className={`rounded-2xl border p-4 ${isCurrent ? "border-sky-200 bg-sky-50/30" : "border-slate-100 bg-white"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-800">{reg.meeting.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">参会身份：{reg.type.name}</p>
                      {meetingSpeaker && (
                        <p className="mt-1 text-sm text-sky-600">
                          讲者身份：{meetingSpeaker.name}
                          {meetingSpeaker.isModerator && "（主持人）"}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>{statusLabel}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {!isCurrent && (
                      <MeetingSwitchLink
                        href={meetingHref(reg.meeting.id, "/me")}
                        className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-700"
                      >
                        切换会议
                      </MeetingSwitchLink>
                    )}
                    <Link
                      href={meetingHref(reg.meeting.id, "/register-conf")}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:text-sky-600"
                    >
                      查看报名
                    </Link>
                  </div>
                  {isCurrent && (reg.status === "APPROVED" || reg.checkedIn) && (
                    <div className="mt-4">
                      <CheckinQrCode token={reg.token} />
                    </div>
                  )}
                  {isCurrent && reg.status !== "APPROVED" && !reg.checkedIn && (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-center text-sm text-slate-500">
                      报名审核通过后将显示签到二维码
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="我的酒店预订">
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-500">
            尚无预订。
            <Link href={meetingHref(meeting.id, "/hotels")} className="text-sky-600 hover:underline">
              去预订
            </Link>
          </p>
        ) : (
          <div className="grid gap-3">
            {bookings.map((b) => (
              <DataCard
                key={b.id}
                title={b.hotel.name}
                meta={STATUS_LABEL[b.status] ?? b.status}
                description={`${b.checkIn} → ${b.checkOut} · ${b.rooms} 间`}
                icon={<HotelIcon className="h-6 w-6" />}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
