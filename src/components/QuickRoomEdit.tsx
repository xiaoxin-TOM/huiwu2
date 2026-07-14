"use client";

import { useState } from "react";

export default function QuickRoomEdit({ receptionId, defaultValue }: { receptionId: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function save() {
    if (value === defaultValue) return;
    setStatus("saving");
    const formData = new FormData();
    formData.append("hotelRoom", value);
    try {
      const res = await fetch(`/api/admin/receptions/${receptionId}`, { method: "POST", body: formData });
      setStatus(res.ok ? "saved" : "idle");
    } catch {
      setStatus("idle");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setStatus("idle");
        }}
        onBlur={() => void save()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save();
          }
        }}
        className="w-24 rounded border px-2 py-1 text-sm"
      />
      {status === "saving" && <span className="text-xs text-gray-400">保存中</span>}
      {status === "saved" && <span className="text-xs text-emerald-600">已保存</span>}
    </div>
  );
}
