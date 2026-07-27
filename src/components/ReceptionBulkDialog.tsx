"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  RECEPTION_BULK_FIELD_GROUPS,
  type ReceptionBulkField,
  type ReceptionBulkMode,
} from "@/lib/reception-bulk";
import type { ReceptionTarget } from "@/types/reception";

interface ReceptionBulkDialogProps {
  targets: ReceptionTarget[];
  onClose: () => void;
  onApplied: () => void;
}

/**
 * 由父组件按需挂载/卸载（而不是靠 open 属性隐藏），
 * 关闭即卸载，下次打开天然是干净状态，不必在 effect 里手工重置。
 */
export default function ReceptionBulkDialog({ targets, onClose, onApplied }: ReceptionBulkDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ReceptionBulkMode>("FILL_EMPTY");
  const [checked, setChecked] = useState<Set<ReceptionBulkField>>(new Set());
  const [values, setValues] = useState<Partial<Record<ReceptionBulkField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggle(field: ReceptionBulkField) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

  function setValue(field: ReceptionBulkField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // 开始输入即视为要设置这个字段，省掉一次点击
    setChecked((prev) => (prev.has(field) ? prev : new Set(prev).add(field)));
  }

  async function submit() {
    if (checked.size === 0) {
      setError("请至少勾选一个要设置的字段");
      return;
    }
    setSaving(true);
    setError("");
    const fields: Record<string, string> = {};
    for (const field of checked) fields[field] = values[field] ?? "";

    try {
      const res = await fetch("/api/admin/receptions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, targets, fields }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "批量设置失败");
        setSaving(false);
        return;
      }
      onApplied();
      router.refresh();
      onClose();
    } catch {
      setError("网络错误");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="批量设置接待信息"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-bold">批量设置接待信息</h2>
          <p className="mt-1 text-sm text-gray-500">
            已选 <span className="font-medium text-sky-700">{targets.length}</span> 人 · 只有勾选的字段会被写入
          </p>
        </div>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto px-5 py-4">
          <fieldset className="rounded-lg bg-slate-50 p-3">
            <legend className="px-1 text-sm text-gray-500">写入方式</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="bulk-mode"
                  checked={mode === "FILL_EMPTY"}
                  onChange={() => setMode("FILL_EMPTY")}
                />
                仅填空白项
                <span className="text-xs text-gray-400">已安排好的不动</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="bulk-mode"
                  checked={mode === "OVERWRITE"}
                  onChange={() => setMode("OVERWRITE")}
                />
                覆盖已有值
                <span className="text-xs text-gray-400">勾选字段一律改写</span>
              </label>
            </div>
          </fieldset>

          {RECEPTION_BULK_FIELD_GROUPS.map((group) => (
            <div key={group.group}>
              <h3 className="mb-2 text-sm font-medium text-gray-700">{group.group}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <div key={field.key} className={field.multiline ? "sm:col-span-2" : undefined}>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={checked.has(field.key)}
                        onChange={() => toggle(field.key)}
                      />
                      {field.label}
                    </label>
                    {field.multiline ? (
                      <textarea
                        rows={2}
                        value={values[field.key] ?? ""}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    ) : (
                      <input
                        value={values[field.key] ?? ""}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-400">
            房间号逐人不同，不参与批量设置，请在列表中直接编辑。勾选后留空表示清空该字段（仅在覆盖模式下生效）。
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
          <div className="text-sm text-gray-500">
            {error ? (
              <span className="text-red-600">{error}</span>
            ) : (
              <>
                将修改 <span className="font-medium text-slate-700">{checked.size}</span> 个字段 ·{" "}
                <span className="font-medium text-slate-700">{targets.length}</span> 条记录
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
              取消
            </Button>
            <Button variant="primary" size="sm" onClick={() => void submit()} disabled={saving}>
              {saving ? "保存中…" : "确认"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
