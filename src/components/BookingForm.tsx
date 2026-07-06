"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, selectClass, buttonClass, labelClass } from "@/components/ui/Card";

type HotelOption = { id: string; name: string; price: number };

export default function BookingForm({
  meetingId,
  hotels,
}: {
  meetingId: string;
  hotels: HotelOption[];
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
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          hotelId: fd.get("hotelId"),
          checkIn: fd.get("checkIn"),
          checkOut: fd.get("checkOut"),
          rooms: fd.get("rooms"),
        }),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "服务器错误" }));
      if (!data.ok) {
        setError(data.error ?? "预订失败");
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
        <label className={labelClass}>选择酒店</label>
        <select name="hotelId" required className={selectClass}>
          <option value="">请选择酒店</option>
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}（¥{h.price}/晚）
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>入住日期</label>
          <input name="checkIn" type="date" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>离店日期</label>
          <input name="checkOut" type="date" required className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>房间数</label>
        <input
          name="rooms"
          type="number"
          min={1}
          defaultValue={1}
          required
          className={inputClass}
          placeholder="房间数"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className={buttonClass}>
        {submitting ? "提交中…" : "提交预订"}
      </button>
    </form>
  );
}
