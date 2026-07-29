import Link from "next/link";
import { requireCurrentMeeting } from "@/lib/meetings";
import { listMeetingFeedback, countPendingFeedback } from "@/lib/feedback";
import { FEEDBACK_CATEGORIES, FEEDBACK_CATEGORY_LABEL } from "@/lib/validation";
import FeedbackReplyForm from "@/components/FeedbackReplyForm";

function formatTime(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

const STATUS_TABS = [
  { value: "PENDING", label: "待处理" },
  { value: "RESOLVED", label: "已回复" },
  { value: "ALL", label: "全部" },
] as const;

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const meeting = await requireCurrentMeeting();
  const params = await searchParams;
  const status = (params.status ?? "PENDING") as "ALL" | "PENDING" | "RESOLVED";
  const category = params.category ?? "ALL";

  const [items, pending] = await Promise.all([
    listMeetingFeedback(meeting.id, { status, category }),
    countPendingFeedback(meeting.id),
  ]);

  function tabHref(next: string) {
    const sp = new URLSearchParams();
    if (next !== "PENDING") sp.set("status", next);
    if (category !== "ALL") sp.set("category", category);
    const qs = sp.toString();
    return `/admin/feedback${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">
          用户反馈
          {pending > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white align-middle">
              {pending} 条待处理
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-500">当前会议：{meeting.title}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 text-sm shadow-sm">
        <div className="flex gap-1">
          {STATUS_TABS.map((t) => (
            <Link
              key={t.value}
              href={tabHref(t.value)}
              className={`rounded-lg px-3 py-1.5 ${
                status === t.value ? "bg-sky-700 text-white" : "text-gray-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <Link
            href={`/admin/feedback${status !== "PENDING" ? `?status=${status}` : ""}`}
            className={`rounded-lg px-2 py-1 text-xs ${category === "ALL" ? "bg-slate-200" : "text-gray-500 hover:bg-slate-50"}`}
          >
            全部类型
          </Link>
          {FEEDBACK_CATEGORIES.map((c) => {
            const sp = new URLSearchParams();
            if (status !== "PENDING") sp.set("status", status);
            sp.set("category", c);
            return (
              <Link
                key={c}
                href={`/admin/feedback?${sp.toString()}`}
                className={`rounded-lg px-2 py-1 text-xs ${category === c ? "bg-slate-200" : "text-gray-500 hover:bg-slate-50"}`}
              >
                {FEEDBACK_CATEGORY_LABEL[c]}
              </Link>
            );
          })}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500">暂无反馈。</p>
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <div key={f.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-sm">
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
                  {f.status === "RESOLVED" ? "已回复" : "待处理"}
                </span>
                <span className="font-medium text-slate-800">{f.user?.name ?? "访客"}</span>
                <span className="text-xs text-gray-400">
                  {f.user?.email ?? (f.contact ? `联系方式：${f.contact}` : "未留联系方式")}
                </span>
                <span className="ml-auto text-xs text-gray-400">{formatTime(f.createdAt)}</span>
              </div>

              <p className="mt-2 whitespace-pre-line text-slate-700">{f.content}</p>
              {f.user && f.contact && (
                <p className="mt-1 text-xs text-gray-500">用户留的联系方式：{f.contact}</p>
              )}

              {f.reply && (
                <div className="mt-2 rounded-lg bg-sky-50 px-3 py-2">
                  <p className="text-xs font-medium text-sky-800">
                    已回复{f.repliedAt && ` · ${formatTime(f.repliedAt)}`}
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">{f.reply}</p>
                </div>
              )}

              <div className="mt-3">
                <FeedbackReplyForm id={f.id} status={f.status} existingReply={f.reply} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
