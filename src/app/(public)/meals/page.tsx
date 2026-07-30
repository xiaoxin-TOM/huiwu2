import { currentUser } from "@/lib/session";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { meetingHref } from "@/lib/public";
import { getUserRegistration } from "@/lib/registrations";
import { listVisibleMealSessions, listRedeemedMealIds } from "@/lib/meals-admin";
import { groupMealsByDay, isEligibleForMeal, describeMealTime, MEAL_SLOT_LABEL } from "@/lib/meals";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);

  const user = await currentUser();
  const registration = user ? await getUserRegistration(user.id, meeting.id) : null;
  const [allMeals, redeemedIds] = await Promise.all([
    listVisibleMealSessions(meeting.id),
    registration ? listRedeemedMealIds(registration.id) : Promise.resolve([]),
  ]);

  // 只展示当前参会类型可用的餐次；未报名的用户看到全部不限类型的餐次
  const mine = allMeals.filter((m) => isEligibleForMeal(m, registration?.typeId ?? null));
  const days = groupMealsByDay(mine);
  const redeemed = new Set(redeemedIds);

  return (
    <div className="space-y-4">
      <PageHeader title="用餐安排" backHref={meetingHref(meeting.id, "/")} />

      {days.length === 0 ? (
        <SectionCard>
          <p className="text-slate-500">
            {allMeals.length === 0 ? "暂未安排用餐，请稍后再来查看。" : "您的参会类型暂无对应的用餐安排。"}
          </p>
        </SectionCard>
      ) : (
        <>
          {registration && (
            <p className="text-xs text-slate-500">
              现场请出示个人中心的签到二维码，由工作人员扫码核销。
            </p>
          )}
          {days.map((day) => (
            <SectionCard key={day.day} title={day.day}>
              <div className="divide-y">
                {day.meals.map((m) => {
                  const time = describeMealTime(m);
                  const used = redeemed.has(m.id);
                  return (
                    <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">
                          <span className="mr-2 text-sm text-sky-700">
                            {MEAL_SLOT_LABEL[m.slot] ?? m.slot}
                          </span>
                          {m.name || MEAL_SLOT_LABEL[m.slot]}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {[m.venue, time].filter(Boolean).join(" · ") || "地点时间待定"}
                        </p>
                      </div>
                      {registration && (
                        <span
                          className={
                            used
                              ? "rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                              : "rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                          }
                        >
                          {used ? "已用餐" : "可用餐"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          ))}
        </>
      )}
    </div>
  );
}
