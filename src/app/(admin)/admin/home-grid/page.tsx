import { auth } from "@/lib/auth";
import HomeGridEditor from "@/components/HomeGridEditor";
import {
  getHomeGridColumns,
  getHomeGridRounded,
  getMeetingAppearanceFields,
  listHomeGridItems,
} from "@/lib/home-grid";
import { listTemplateChoices } from "@/lib/meeting-templates-admin";
import { requireCurrentMeeting } from "@/lib/meetings";

export default async function AdminHomeGridPage() {
  const meeting = await requireCurrentMeeting();
  const session = await auth();
  const [items, columns, rounded, appearance, templates] = await Promise.all([
    listHomeGridItems(meeting.id),
    getHomeGridColumns(meeting.id),
    getHomeGridRounded(meeting.id),
    getMeetingAppearanceFields(meeting.id),
    listTemplateChoices(session?.user?.id ?? ""),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">首页宫格设计</h1>
        <p className="mt-1 text-sm text-slate-500">
          当前会议：{meeting.title}。自由配置入口数量、顺序、尺寸、图标、整体背景，也可一键套用场景模板。
        </p>
      </div>
      <HomeGridEditor
        meetingId={meeting.id}
        initialItems={items}
        initialColumns={columns}
        initialRounded={rounded}
        initialAppearance={{
          bgColor: appearance.bgColor,
          bgImageUrl: appearance.bgImageUrl ?? "",
          bgOverlay: appearance.bgOverlay,
        }}
        templates={templates}
      />
    </div>
  );
}
