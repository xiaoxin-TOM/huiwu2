"use client";

import { useState } from "react";
import { VideoIcon } from "@/components/icons";
import type { LiveStreamInput, LiveStreamView } from "@/lib/live";

function newId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatTimeRange(start: string, end: string): string {
  if (!start && !end) return "";
  const [sd, st] = start.split("T");
  const [ed, et] = end.split("T");
  if (!start) return end;
  if (!end) return start;
  if (sd === ed) return `${sd} ${st}-${et}`;
  return `${sd} ${st} - ${ed} ${et}`;
}

function parseTimeRange(value: string): { start: string; end: string } {
  const same = value.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (same) return { start: `${same[1]}T${same[2]}`, end: `${same[1]}T${same[3]}` };
  const diff = value.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) - (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/);
  if (diff) return { start: `${diff[1]}T${diff[2]}`, end: `${diff[3]}T${diff[4]}` };
  return { start: "", end: "" };
}

export default function LiveStreamEditor({ initialItems }: { initialItems: LiveStreamView[] }) {
  const [items, setItems] = useState<LiveStreamView[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function patchItem(id: string, patch: Partial<LiveStreamInput>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setMessage(null);
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    setItems((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    setMessage(null);
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: newId(),
        name: "主会场直播",
        url: "",
        coverImage: "",
        description: "",
        time: "",
        isVisible: true,
      },
    ]);
    setMessage(null);
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    setMessage(null);
  }

  async function uploadCover(itemId: string, file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "图片不能超过 5MB" });
      return;
    }
    setUploadingItemId(itemId);
    setMessage(null);
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/admin/live/upload", {
        method: "POST",
        body: form,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || "上传失败");
      patchItem(itemId, { coverImage: result.url });
      setMessage({ type: "success", text: "封面已上传并应用，请保存直播会场" });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "上传失败" });
    } finally {
      setUploadingItemId(null);
    }
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const payload = { items: items.map(({ name, url, coverImage, description, time, isVisible }) => ({ name, url, coverImage, description, time, isVisible })) };
    try {
      const response = await fetch("/api/admin/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "保存失败");
      setMessage({ type: "success", text: "直播会场已保存" });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">配置一个或多个直播会场，前台按此顺序展示。</p>
        <button
          type="button"
          onClick={addItem}
          disabled={items.length >= 20}
          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 disabled:opacity-50"
        >
          + 添加会场
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          暂无直播会场，点击上方按钮添加。
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.id}
              className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm ${item.isVisible ? "border-slate-200" : "border-slate-200 opacity-60"}`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <VideoIcon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-slate-700">会场 {index + 1}</span>
                  {!item.isVisible && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">已隐藏</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label="上移" className="rounded border px-2 py-1 text-sm disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} aria-label="下移" className="rounded border px-2 py-1 text-sm disabled:opacity-30">↓</button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="ml-1 rounded border border-red-100 bg-red-50 px-2 py-1 text-xs text-red-600 disabled:opacity-30"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <label className="block text-sm text-slate-600">
                  会场名称
                  <input
                    value={item.name}
                    maxLength={50}
                    onChange={(event) => patchItem(item.id, { name: event.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                <label className="block text-sm text-slate-600">
                  直播地址（外部链接）
                  <input
                    value={item.url}
                    maxLength={500}
                    placeholder="https://..."
                    onChange={(event) => patchItem(item.id, { url: event.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                <div className="block text-sm text-slate-600">
                  观看时间
                  {(() => {
                    const { start, end } = parseTimeRange(item.time);
                    return (
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <input
                          type="datetime-local"
                          value={start}
                          onChange={(event) =>
                            patchItem(item.id, { time: formatTimeRange(event.target.value, end) })
                          }
                          className="rounded-lg border px-2 py-2 text-sm"
                        />
                        <input
                          type="datetime-local"
                          value={end}
                          onChange={(event) =>
                            patchItem(item.id, { time: formatTimeRange(start, event.target.value) })
                          }
                          className="rounded-lg border px-2 py-2 text-sm"
                        />
                      </div>
                    );
                  })()}
                </div>
                <label className="block text-sm text-slate-600">
                  会场描述
                  <input
                    value={item.description}
                    maxLength={200}
                    placeholder="简短描述该会场直播内容"
                    onChange={(event) => patchItem(item.id, { description: event.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
              </div>

              <div className="mt-3 space-y-2">
                <label className="block text-sm text-slate-600">
                  封面图地址（可选）
                  <input
                    value={item.coverImage}
                    onChange={(event) => patchItem(item.id, { coverImage: event.target.value })}
                    placeholder="上传图片后自动填写，也可粘贴图片地址"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className={`cursor-pointer rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 ${uploadingItemId === item.id ? "pointer-events-none opacity-50" : ""}`}>
                    {uploadingItemId === item.id ? "上传中..." : "上传图片并记录"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingItemId != null}
                      className="hidden"
                      onChange={(event) => {
                        const input = event.currentTarget;
                        const file = input.files?.[0];
                        if (file) void uploadCover(item.id, file).finally(() => { input.value = ""; });
                      }}
                    />
                  </label>
                  {item.coverImage && (
                    <button type="button" onClick={() => patchItem(item.id, { coverImage: "" })} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100">
                      移除封面
                    </button>
                  )}
                  <span className="text-xs text-slate-400">JPG、PNG、WebP，最大 5MB，推荐使用 16:9 比例图片</span>
                </div>
                {item.coverImage && (
                  <div className="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.coverImage} alt={`${item.name} 封面预览`} className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={item.isVisible}
                  onChange={(event) => patchItem(item.id, { isVisible: event.target.checked })}
                />
                在前台显示
              </label>
            </article>
          ))}
        </div>
      )}

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {message.text}
        </div>
      )}
      <button
        type="button"
        onClick={save}
        disabled={saving || items.length === 0}
        className="w-full rounded-xl bg-sky-700 px-5 py-3 font-medium text-white shadow-sm hover:bg-sky-800 disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存直播会场"}
      </button>
    </div>
  );
}
