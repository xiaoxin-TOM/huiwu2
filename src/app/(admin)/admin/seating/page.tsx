import { requireCurrentMeeting } from "@/lib/meetings";
import { listSeatTables, listUnseated, getSeatMap } from "@/lib/seating-admin";
import SeatingEditor from "@/components/SeatingEditor";

export default async function AdminSeatingPage() {
  const meeting = await requireCurrentMeeting();
  const [tables, unseated, seatMap] = await Promise.all([
    listSeatTables(meeting.id),
    listUnseated(meeting.id),
    getSeatMap(meeting.id),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">座位安排</h1>
        <p className="text-sm text-gray-500">
          当前会议：{meeting.title} · 从右侧选人再点桌位完成排座，一人只会占一个座位
        </p>
      </div>
      <SeatingEditor
        tables={tables}
        unseated={unseated}
        seatMapUrl={seatMap?.seatMapUrl ?? ""}
        seatMapNote={seatMap?.seatMapNote ?? ""}
      />
    </div>
  );
}
