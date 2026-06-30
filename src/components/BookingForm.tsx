"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type HotelOption = { id: string; name: string; price: number };

export default function BookingForm({ hotels }: { hotels: HotelOption[] }) {
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
      <select name="hotelId" required className="w-full rounded border px-3 py-2">
        <option value="">请选择酒店</option>
        {hotels.map((h) => (
          <option key={h.id} value={h.id}>{h.name}(¥{h.price}/晚)</option>
        ))}
      </select>
      <label className="block text-sm text-gray-500">入住日期
        <input name="checkIn" type="date" required className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      <label className="block text-sm text-gray-500">离店日期
        <input name="checkOut" type="date" required className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      <input name="rooms" type="number" min={1} defaultValue={1} required
        className="w-full rounded border px-3 py-2" placeholder="房间数" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting}
        className="rounded bg-sky-700 px-4 py-2 text-white disabled:opacity-50">
        {submitting ? "提交中…" : "提交预订"}
      </button>
    </form>
  );
}
