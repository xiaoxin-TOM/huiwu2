"use client";

import { useState } from "react";
import type { Speaker } from "@prisma/client";

export function SessionSpeakerFields({ speakers }: { speakers: Speaker[] }) {
  const [rows, setRows] = useState<{ id: number }[]>([{ id: 1 }]);

  const addRow = () => {
    setRows((prev) => [...prev, { id: (prev[prev.length - 1]?.id ?? 0) + 1 }]);
  };

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  if (speakers.length === 0) {
    return (
      <p className="text-sm text-gray-500 sm:col-span-3">
        暂无可选讲者，请先到“讲者管理”创建。
      </p>
    );
  }

  return (
    <div className="space-y-2 sm:col-span-3">
      <span className="text-sm font-medium text-slate-700">讲者 / 主持人</span>
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <select
            name="speakerId"
            required
            className="flex-1 rounded border px-2 py-1.5 text-sm"
          >
            <option value="">选择讲者</option>
            {speakers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.title ? `（${s.title}）` : ""}
              </option>
            ))}
          </select>
          <select
            name="role"
            required
            className="rounded border px-2 py-1.5 text-sm"
          >
            <option value="SPEAKER">讲者</option>
            <option value="MODERATOR">主持人</option>
          </select>
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="text-sm text-red-600 hover:underline"
            >
              删除
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-sm text-sky-700 hover:underline"
      >
        + 添加讲者/主持人
      </button>
    </div>
  );
}
