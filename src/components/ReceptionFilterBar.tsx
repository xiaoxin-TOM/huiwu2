"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function ReceptionFilterBar({ categories }: { categories: { value: string; label: string; group?: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source") ?? "ALL";
  const category = searchParams.get("category") ?? "ALL";
  const q = searchParams.get("q") ?? "";

  function apply(next: { source?: string; category?: string; q?: string }) {
    const sp = new URLSearchParams();
    const s = next.source ?? source;
    const c = next.category ?? category;
    const query = next.q ?? q;
    if (s !== "ALL") sp.set("source", s);
    if (c !== "ALL") sp.set("category", c);
    if (query.trim()) sp.set("q", query.trim());
    const qs = sp.toString();
    router.push(`/admin/receptions${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-sm text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">来源</span>
        <select
          className="rounded-lg border px-2 py-1"
          value={source}
          onChange={(e) => apply({ source: e.target.value, category: "ALL" })}
        >
          <option value="ALL">全部</option>
          <option value="guest">嘉宾</option>
          <option value="registration">报名人员</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">分类</span>
        <select
          className="rounded-lg border px-2 py-1"
          value={category}
          onChange={(e) => apply({ category: e.target.value })}
        >
          <option value="ALL">全部</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const value = String(data.get("q") ?? "");
          apply({ q: value });
        }}
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索姓名/单位/联系方式"
          className="rounded-lg border px-3 py-1"
        />
        <button type="submit" className="rounded-lg bg-sky-700 px-3 py-1 text-white hover:bg-sky-800">
          搜索
        </button>
      </form>
    </div>
  );
}
