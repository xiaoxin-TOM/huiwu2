import HomeGridEditor from "@/components/HomeGridEditor";
import { getHomeGridColumns, listHomeGridItems } from "@/lib/home-grid";
import { requireCurrentMeeting } from "@/lib/meetings";

export default async function AdminHomeGridPage() {
  const meeting = await requireCurrentMeeting();
  const [items, columns] = await Promise.all([
    listHomeGridItems(meeting.id),
    getHomeGridColumns(meeting.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">首页宫格设计</h1>
        <p className="mt-1 text-sm text-slate-500">
          当前会议：{meeting.title}。自由配置入口数量、顺序、尺寸、图标和背景图。
        </p>
      </div>
      <HomeGridEditor meetingId={meeting.id} initialItems={items} initialColumns={columns} />
    </div>
  );
}
