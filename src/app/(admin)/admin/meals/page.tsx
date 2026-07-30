import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentMeeting } from "@/lib/meetings";
import { listMealSessions } from "@/lib/meals-admin";
import MealSessionEditor from "@/components/MealSessionEditor";

export default async function AdminMealsPage() {
  const meeting = await requireCurrentMeeting();
  const [meals, types] = await Promise.all([
    listMealSessions(meeting.id),
    prisma.registrationType.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">用餐管理</h1>
          <p className="text-sm text-gray-500">当前会议：{meeting.title}</p>
        </div>
        {meals.length > 0 && (
          <Link
            href="/admin/meals/scan"
            className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
          >
            现场核销
          </Link>
        )}
      </div>

      <MealSessionEditor meals={meals} types={types} />
    </div>
  );
}
