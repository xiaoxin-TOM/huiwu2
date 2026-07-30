import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getPublicMeetingForRequest } from "@/lib/meetings";
import { meetingBackgroundStyle } from "@/lib/meeting-templates";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const meeting = await getPublicMeetingForRequest();
  // 未配置外观时 style 为空对象，由 bg-slate-50 接管——与改造前完全一致
  const style = meeting
    ? meetingBackgroundStyle({
        bgColor: meeting.bgColor,
        bgImageUrl: meeting.bgImageUrl,
        bgOverlay: meeting.bgOverlay,
      })
    : {};

  return (
    <div className="flex min-h-screen flex-col bg-slate-50" style={style}>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <SiteFooter />
    </div>
  );
}
