"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MEAL_SLOT_LABEL } from "@/lib/meals";

export type RedeemMealOption = { id: string; day: string; slot: string; name: string };

type Result =
  | { kind: "OK"; fullName: string; mealName: string }
  | { kind: "ALREADY"; fullName: string; mealName: string; redeemedAt: string }
  | { kind: "NOT_ELIGIBLE"; fullName: string; mealName: string }
  | { kind: "ERROR"; message: string };

/**
 * 现场核销面板。凭证就是报名的签到二维码内容（Registration.token），
 * 用扫码枪或手机扫码后填入即可，不另发餐券。
 */
export default function MealRedeemPanel({ meals }: { meals: RedeemMealOption[] }) {
  const [mealId, setMealId] = useState(meals[0]?.id ?? "");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [count, setCount] = useState(0);

  async function redeem() {
    const trimmed = token.trim();
    if (!mealId || !trimmed) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/meals/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealSessionId: mealId, token: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setResult({ kind: "ERROR", message: data.error || "核销失败" });
      } else if (data.status === "OK") {
        setResult({ kind: "OK", fullName: data.fullName, mealName: data.mealName });
        setCount((c) => c + 1);
      } else if (data.status === "ALREADY") {
        setResult({
          kind: "ALREADY",
          fullName: data.fullName,
          mealName: data.mealName,
          redeemedAt: String(data.redeemedAt ?? "").slice(0, 16).replace("T", " "),
        });
      } else {
        setResult({ kind: "NOT_ELIGIBLE", fullName: data.fullName, mealName: data.mealName });
      }
      // 无论结果如何都清空输入，方便连续扫下一位
      setToken("");
    } catch {
      setResult({ kind: "ERROR", message: "网络错误" });
    } finally {
      setBusy(false);
    }
  }

  if (meals.length === 0) {
    return <p className="text-gray-500">还没有餐次，请先在「用餐管理」中添加。</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <label className="block text-sm text-gray-600">当前核销餐次</label>
        <select
          value={mealId}
          onChange={(e) => {
            setMealId(e.target.value);
            setResult(null);
            setCount(0);
          }}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        >
          {meals.map((m) => (
            <option key={m.id} value={m.id}>
              {m.day} {MEAL_SLOT_LABEL[m.slot] ?? m.slot} {m.name && `· ${m.name}`}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm text-gray-600">扫描签到二维码或粘贴凭证</label>
        <form
          className="mt-1 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void redeem();
          }}
        >
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
            placeholder="扫码枪扫描后自动回车，或手动粘贴"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <Button type="submit" variant="primary" size="md" disabled={busy || !token.trim()}>
            {busy ? "核销中…" : "核销"}
          </Button>
        </form>
        <p className="mt-2 text-xs text-gray-400">本次已成功核销 {count} 人</p>
      </div>

      {result && (
        <div
          className={`rounded-xl p-5 text-center ${
            result.kind === "OK"
              ? "bg-emerald-50 text-emerald-800"
              : result.kind === "ALREADY"
                ? "bg-amber-50 text-amber-800"
                : "bg-red-50 text-red-700"
          }`}
        >
          {result.kind === "OK" && (
            <>
              <p className="text-2xl font-bold">核销成功</p>
              <p className="mt-1">
                {result.fullName} · {result.mealName}
              </p>
            </>
          )}
          {result.kind === "ALREADY" && (
            <>
              <p className="text-2xl font-bold">已领取过</p>
              <p className="mt-1">
                {result.fullName} · {result.mealName}
              </p>
              <p className="mt-1 text-sm">首次核销于 {result.redeemedAt}</p>
            </>
          )}
          {result.kind === "NOT_ELIGIBLE" && (
            <>
              <p className="text-2xl font-bold">无此餐资格</p>
              <p className="mt-1">
                {result.fullName} 的参会类型不包含「{result.mealName}」
              </p>
            </>
          )}
          {result.kind === "ERROR" && <p className="text-lg font-medium">{result.message}</p>}
        </div>
      )}
    </div>
  );
}
