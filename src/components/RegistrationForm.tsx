"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, selectClass, buttonClass, labelClass } from "@/components/ui/Card";

type TypeOption = { id: string; name: string; fee: number };

export default function RegistrationForm({
  meetingId,
  types,
  requirePassword = false,
}: {
  meetingId: string;
  types: TypeOption[];
  requirePassword?: boolean;
}) {
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
          meetingId,
          typeId: fd.get("typeId"),
          fullName: fd.get("fullName"),
          organization: fd.get("organization"),
          title: fd.get("title"),
          phone: fd.get("phone"),
          password: fd.get("password"),
        }),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "服务器错误" }));
      if (!data.ok) {
        setError(data.error ?? "报名失败");
        return;
      }
      router.push(`/m/${meetingId}/me`);
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div>
        <label className={labelClass}>参会类型</label>
        <select name="typeId" required className={selectClass}>
          <option value="" disabled hidden>
            请选择参会类型
          </option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>姓名</label>
        <input name="fullName" required placeholder="请输入姓名" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>单位</label>
        <input name="organization" placeholder="请输入单位" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>职称/职务</label>
        <input name="title" placeholder="请输入职称/职务" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>联系电话</label>
        <input name="phone" placeholder="请输入联系电话" className={inputClass} />
      </div>
      {requirePassword && (
        <div>
          <label className={labelClass}>报名密码</label>
          <input
            name="password"
            type="password"
            required
            placeholder="请输入报名密码"
            className={inputClass}
          />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className={buttonClass}>
        {submitting ? "提交中…" : "提交报名"}
      </button>
    </form>
  );
}
