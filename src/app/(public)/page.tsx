import Image from "next/image";
import { prisma } from "@/lib/prisma";
import RichText from "@/components/RichText";
import { IconCard } from "@/components/ui/Card";
import {
  MailIcon,
  CalendarIcon,
  UsersIcon,
  CameraIcon,
  VideoIcon,
  CarIcon,
  PhoneIcon,
  FileTextIcon,
  HotelIcon,
  BookmarkIcon,
} from "@/components/icons";

const FEATURES = [
  { href: "/register-conf", label: "注册报名", icon: FileTextIcon },
  { href: "/notices", label: "会议通知", icon: MailIcon },
  { href: "/schedule", label: "会议日程", icon: CalendarIcon },
  { href: "/speakers", label: "专家介绍", icon: UsersIcon },
  { href: "/photos", label: "现场照片", icon: CameraIcon },
  { href: "/venue", label: "会场交通", icon: CarIcon },
  { href: "/live", label: "现场直播", icon: VideoIcon },
  { href: "/hotels", label: "酒店预订", icon: HotelIcon },
  { href: "/contact", label: "联系我们", icon: PhoneIcon },
  { href: "/schedule/brief", label: "简明日程", icon: BookmarkIcon },
];

export default async function HomePage() {
  const cfg = await prisma.siteConfig.findUnique({ where: { id: 1 } });

  return (
    <div className="-mx-4 -my-8 md:-mx-8">
      {/* Hero banner */}
      <section className="relative aspect-video w-full overflow-hidden">
        <Image
          src="/imgs/ui.jpg"
          alt="学术年会"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <h2 className="mb-4 text-lg font-bold text-slate-800">会议服务</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {FEATURES.map(({ href, label, icon: Icon }) => (
            <IconCard key={href + label} href={href} title={label} icon={<Icon className="h-6 w-6" />} variant="default" />
          ))}
        </div>
      </section>

      {/* Welcome content */}
      {cfg?.welcomeHtml && (
        <section className="mx-auto max-w-6xl px-4 pb-8 md:px-8">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">会议简介</h2>
            <div className="prose max-w-none text-slate-600">
              <RichText html={cfg.welcomeHtml} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
