import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getUserRegistration } from "@/lib/registrations";
import { listUserBookings } from "@/lib/bookings";
import { STATUS_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard, DataCard, IconCard } from "@/components/ui/Card";
import LogoutButton from "@/components/LogoutButton";
import CheckinQrCode from "@/components/CheckinQrCode";
import { UserIcon, ClipboardListIcon, HotelIcon, FileTextIcon } from "@/components/icons";

export default async function MePage() {
  const user = await requireUser();
  const [registration, bookings] = await Promise.all([
    getUserRegistration(user.id),
    listUserBookings(user.id),
  ]);

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <IconCard href="/register-conf" title="我的报名" icon={<ClipboardListIcon className="h-6 w-6" />} />
        <IconCard href="/hotels" title="我的预订" icon={<HotelIcon className="h-6 w-6" />} />
        <IconCard href="/" title="返回首页" icon={<FileTextIcon className="h-6 w-6" />} />
      </div>

      <SectionCard title="我的报名">
        {registration ? (
          <div className="space-y-4">
            <DataCard
              title={registration.type.name}
              meta={STATUS_LABEL[registration.status] ?? registration.status}
              icon={<ClipboardListIcon className="h-6 w-6" />}
            />
            {registration.status === "APPROVED" || registration.checkedIn ? (
              <CheckinQrCode token={registration.token} />
            ) : (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center text-sm text-slate-500">
                报名审核通过后将显示签到二维码
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            尚未报名。
            <Link href="/register-conf" className="text-sky-600 hover:underline">
              去报名
            </Link>
          </p>
        )}
      </SectionCard>

      <SectionCard title="我的酒店预订">
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-500">
            尚无预订。
            <Link href="/hotels" className="text-sky-600 hover:underline">
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
