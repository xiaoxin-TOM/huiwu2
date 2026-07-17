"use client";

import { useMemo, useState } from "react";
import HomeGrid from "@/components/HomeGrid";
import {
  DEFAULT_HOME_GRID_ITEMS,
  HOME_GRID_COLUMNS_OPTIONS,
  HOME_GRID_ICON_OPTIONS,
  HOME_GRID_ROUTE_OPTIONS,
  HOME_GRID_SIZE_OPTIONS,
  autoFillHomeGridRows,
  homeGridArea,
  type HomeGridColumns,
  type HomeGridIconKey,
  type HomeGridItemInput,
  type HomeGridSize,
} from "@/lib/home-grid-config";
import type { HomeGridItemView } from "@/lib/home-grid";

function newId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function defaultDrafts(): HomeGridItemView[] {
  return DEFAULT_HOME_GRID_ITEMS.map((item, index) => ({ ...item, id: `default-${index}` }));
}

export default function HomeGridEditor({ meetingId, initialItems, initialColumns, initialRounded = true }: { meetingId: string; initialItems: HomeGridItemView[]; initialColumns: HomeGridColumns; initialRounded?: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [columns, setColumns] = useState<HomeGridColumns>(initialColumns);
  const [rounded, setRounded] = useState(initialRounded);
  const [saving, setSaving] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const visibleArea = useMemo(
    () => items.filter((item) => item.isVisible).reduce((sum, item) => sum + homeGridArea(item.size), 0),
    [items],
  );
  const hasIncompleteDesktopRow = visibleArea % columns !== 0;

  function patchItem(id: string, patch: Partial<HomeGridItemView>) {
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

  function moveTo(from: number, to: number) {
    if (from === to) return;
    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setMessage(null);
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: newId(),
        title: "新入口",
        href: "/",
        icon: "link",
        size: "SMALL",
        backgroundImage: "",
        isVisible: true,
      },
    ]);
    setMessage(null);
  }

  async function uploadImage(itemId: string, file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "图片不能超过 5MB" });
      return;
    }
    setUploadingItemId(itemId);
    setMessage(null);
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/admin/home-grid/upload", {
        method: "POST",
        body: form,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || "上传失败");
      patchItem(itemId, { backgroundImage: result.url });
      setMessage({ type: "success", text: "图片已上传并应用，请保存首页宫格" });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "上传失败" });
    } finally {
      setUploadingItemId(null);
    }
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const payload: { columns: HomeGridColumns; rounded: boolean; items: HomeGridItemInput[] } = {
      columns,
      rounded,
      items: items.map(({ title, href, icon, size, backgroundImage, isVisible }) => ({
        title,
        href,
        icon,
        size,
        backgroundImage,
        isVisible,
      })),
    };
    try {
      const response = await fetch("/api/admin/home-grid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "保存失败");
      setMessage({ type: "success", text: "首页宫格已保存" });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">入口设置</h2>
            <p className="text-sm text-slate-500">拖动卡片或使用箭头调整顺序，最多可配置 24 个入口。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setItems((current) => autoFillHomeGridRows(current, columns))} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
              自动铺满
            </button>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              每行数量
              <select
                value={columns}
                onChange={(event) => setColumns(Number(event.target.value) as HomeGridColumns)}
                className="rounded-lg border bg-white px-2 py-2"
              >
                {HOME_GRID_COLUMNS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rounded}
                onChange={(event) => setRounded(event.target.checked)}
              />
              圆角
            </label>
            <button type="button" onClick={() => setItems(defaultDrafts())} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              恢复默认
            </button>
            <button type="button" onClick={addItem} disabled={items.length >= 24} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 disabled:opacity-50">
              + 添加入口
            </button>
          </div>
        </div>

        <datalist id="home-grid-route-options">
          {HOME_GRID_ROUTE_OPTIONS.map((route) => <option key={route.value} value={route.value}>{route.label}</option>)}
        </datalist>

        <div className="space-y-3">
          {items.map((item, index) => (
            <article
              key={item.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex != null) moveTo(dragIndex, index);
                setDragIndex(null);
              }}
              className={`rounded-xl border bg-white p-4 shadow-sm ${dragIndex === index ? "border-sky-400 opacity-60" : "border-slate-200"}`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragEnd={() => setDragIndex(null)}
                    className="cursor-grab select-none text-xl text-slate-300"
                    title="拖动排序"
                  >
                    ⠿
                  </span>
                  <span className="text-sm font-semibold text-slate-700">入口 {index + 1}</span>
                  {!item.isVisible && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">已隐藏</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label="上移" className="rounded border px-2 py-1 text-sm disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} aria-label="下移" className="rounded border px-2 py-1 text-sm disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} disabled={items.length === 1} className="ml-1 rounded border border-red-100 bg-red-50 px-2 py-1 text-xs text-red-600 disabled:opacity-30">删除</button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-600">
                  入口名称
                  <input value={item.title} maxLength={30} onChange={(event) => patchItem(item.id, { title: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
                </label>
                <label className="text-sm text-slate-600">
                  跳转地址
                  <input list="home-grid-route-options" value={item.href} onChange={(event) => patchItem(item.id, { href: event.target.value })} placeholder="/schedule 或 https://..." className="mt-1 w-full rounded-lg border px-3 py-2" />
                </label>
                <label className="text-sm text-slate-600">
                  图标
                  <select value={item.icon} onChange={(event) => patchItem(item.id, { icon: event.target.value as HomeGridIconKey })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2">
                    {HOME_GRID_ICON_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="text-sm text-slate-600">
                  卡片尺寸
                  <select value={item.size} onChange={(event) => patchItem(item.id, { size: event.target.value as HomeGridSize })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2">
                    {HOME_GRID_SIZE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm text-slate-600">
                    背景图地址（可选）
                    <input value={item.backgroundImage} onChange={(event) => patchItem(item.id, { backgroundImage: event.target.value })} placeholder="上传图片后自动填写，也可粘贴图片地址" className="mt-1 w-full rounded-lg border px-3 py-2" />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className={`cursor-pointer rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 ${uploadingItemId ? "pointer-events-none opacity-50" : ""}`}>
                      {uploadingItemId === item.id ? "上传中..." : "上传图片并记录"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingItemId != null}
                        className="hidden"
                        onChange={(event) => {
                          const input = event.currentTarget;
                          const file = input.files?.[0];
                          if (file) void uploadImage(item.id, file).finally(() => { input.value = ""; });
                        }}
                      />
                    </label>
                    {item.backgroundImage && (
                      <button type="button" onClick={() => patchItem(item.id, { backgroundImage: "" })} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100">
                        移除图片
                      </button>
                    )}
                    <span className="text-xs text-slate-400">JPG、PNG、WebP，最大 5MB</span>
                  </div>
                  {item.backgroundImage && (
                    <div className="h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.backgroundImage} alt={`${item.title} 背景预览`} className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={item.isVisible} onChange={(event) => patchItem(item.id, { isVisible: event.target.checked })} />
                在前台显示
              </label>
            </article>
          ))}
        </div>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-800">实时预览</h2>
              <p className="text-xs text-slate-500">按前台比例等比例缩小显示。</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs ${hasIncompleteDesktopRow ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
              {visibleArea} 格
            </span>
          </div>
          {hasIncompleteDesktopRow && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              当前宽屏占用格数不是 {columns} 的倍数，末行可能留空；可调整一个入口为横向或大卡片。
            </p>
          )}
          <HomeGrid meetingId={meetingId} items={items} columns={columns} rounded={rounded} preview />
        </div>

        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {message.text}
          </div>
        )}
        <button type="button" onClick={save} disabled={saving} className="w-full rounded-xl bg-sky-700 px-5 py-3 font-medium text-white shadow-sm hover:bg-sky-800 disabled:opacity-50">
          {saving ? "保存中..." : "保存首页宫格"}
        </button>
      </aside>
    </div>
  );
}
