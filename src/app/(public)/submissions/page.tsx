import { requireUser } from "@/lib/session";
import { listUserSubmissions } from "@/lib/submissions";
import SubmissionForm from "@/components/SubmissionForm";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "未通过",
};

export default async function SubmissionsPage() {
  const user = await requireUser();
  const subs = await listUserSubmissions(user.id);
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">论文提交</h1>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">我的投稿</h2>
        {subs.length === 0 ? (
          <p className="text-gray-500">暂无投稿。</p>
        ) : (
          <ul className="divide-y rounded border">
            {subs.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="font-medium">{s.title}</span>
                <span className="text-gray-400">{s.authors}</span>
                <span className="ml-auto text-sky-700">{STATUS_LABEL[s.status] ?? s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">提交新论文</h2>
        <SubmissionForm />
      </div>
    </section>
  );
}
