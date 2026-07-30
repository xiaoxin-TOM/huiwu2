import { requireCurrentMeeting } from "@/lib/meetings";
import { listMealSessions } from "@/lib/meals-admin";
import MealRedeemPanel from "@/components/MealRedeemPanel";
import { ButtonLink } from "@/components/ui/Button";

export default async function AdminMealScanPage() {
  const meeting = await requireCurrentMeeting();
  const meals = await listMealSessions(meeting.id);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">用餐核销</h1>
          <p className="text-sm text-gray-500">
            当前会议：{meeting.title} · 使用参会人已有的签到二维码，无需另发餐券
          </p>
        </div>
        <ButtonLink href="/admin/meals" variant="secondary" size="sm">
          ← 返回用餐管理
        </ButtonLink>
      </div>

      <MealRedeemPanel
        meals={meals.map((m) => ({ id: m.id, day: m.day, slot: m.slot, name: m.name }))}
      />
    </div>
  );
}
