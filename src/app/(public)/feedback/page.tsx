import { currentUser } from "@/lib/session";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { meetingHref } from "@/lib/public";
import { listUserFeedback } from "@/lib/feedback";
import { FEEDBACK_CATEGORY_LABEL } from "@/lib/validation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";
import FeedbackForm from "@/components/FeedbackForm";

function formatTime(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);
  const user = await currentUser();
  const mine = user ? await listUserFeedback(user.id, meeting.id) : [];

  return (
    <div className="space-y-4">
      <PageHeader title="意见反馈" backHref={meetingHref(meeting.id, "/contact")} />

      <SectionCard title="提交反馈">
        <FeedbackForm meetingId={meeting.id} isLoggedIn={Boolean(user)} />
      </SectionCard>

      {user && (
        <SectionCard title="我的反馈">
          {mine.length === 0 ? (
            <p className="text-sm text-slate-500">您还没有提交过反馈。</p>
          ) : (
            <div className="divide-y">
              {mine.map((f) => (
                <div key={f.id} className="space-y-1 py-3">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {FEEDBACK_CATEGORY_LABEL[f.category] ?? f.category}
                    </span>
                    <span
                      className={
                        f.status === "RESOLVED"
                          ? "rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700"
                          : "rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700"
                      }
                    >
                      {f.status === "RESOLVED" ? "已回复" : "处理中"}
                    </span>
                    <span className="text-xs text-slate-400">{formatTime(f.createdAt)}</span>
                  </p>
                  <p className="whitespace-pre-line text-slate-700">{f.content}</p>
                  {f.reply && (
                    <div className="mt-2 rounded-lg bg-sky-50 px-3 py-2">
                      <p className="text-xs font-medium text-sky-800">主办方回复</p>
                      <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">{f.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
