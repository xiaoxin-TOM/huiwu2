import LiveStreamEditor from "@/components/LiveStreamEditor";
import { listLiveStreams } from "@/lib/live";
import { requireCurrentMeeting } from "@/lib/meetings";

export default async function AdminLivePage() {
  const meeting = await requireCurrentMeeting();
  const items = await listLiveStreams(meeting.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">直播管理</h1>
        <p className="mt-1 text-sm text-slate-500">
          当前会议：{meeting.title}。配置多个直播会场的外部链接。
        </p>
      </div>
      <LiveStreamEditor initialItems={items} initialMultiButton={meeting.liveMultiButton} />
    </div>
  );
}
