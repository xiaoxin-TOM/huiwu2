"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type TypeOption = { id: string; name: string; fee: number };

export default function RegistrationForm({ types }: { types: TypeOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeId: fd.get("typeId"),
          fullName: fd.get("fullName"),
          organization: fd.get("organization"),
          title: fd.get("title"),
          phone: fd.get("phone"),
        }),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "服务器错误" }));
      if (!data.ok) {
        setError(data.error ?? "报名失败");
        return;
      }
      router.push("/me");
      router.refresh();
    } catch {
      setError("网络错误,请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      <select name="typeId" required className="w-full rounded border px-3 py-2">
        <option value="">请选择参会类型</option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>{t.name}(¥{t.fee})</option>
        ))}
      </select>
      <input name="fullName" required placeholder="姓名" className="w-full rounded border px-3 py-2" />
      <input name="organization" placeholder="单位" className="w-full rounded border px-3 py-2" />
      <input name="title" placeholder="职称/职务" className="w-full rounded border px-3 py-2" />
      <input name="phone" placeholder="联系电话" className="w-full rounded border px-3 py-2" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="rounded bg-sky-700 px-4 py-2 text-white disabled:opacity-50">
        {submitting ? "提交中…" : "提交报名"}
      </button>
    </form>
  );
}
