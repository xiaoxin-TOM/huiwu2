"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HomeGrid from "@/components/HomeGrid";
import { Button } from "@/components/ui/Button";
import { meetingBackgroundStyle } from "@/lib/meeting-templates";
import type { HomeGridColumns, HomeGridItemInput } from "@/lib/home-grid-config";

export type TemplateChoiceView = {
  key: string;
  id?: string;
  source: "BUILTIN" | "CUSTOM";
  name: string;
  description: string;
  bgColor: string;
  bgImageUrl: string | null;
  bgOverlay: number;
  gridColumns: HomeGridColumns;
  gridRounded: boolean;
  items: HomeGridItemInput[];
};

/**
 * 场景模板选择器。套用是覆盖操作，因此先渲染缩略预览，
 * 并在确认区明确写出将替换多少个现有入口。
 */
export default function MeetingTemplatePicker({
  meetingId,
  templates,
  currentItemCount,
}: {
  meetingId: string;
  templates: TemplateChoiceView[];
  currentItemCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TemplateChoiceView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function apply() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/meeting-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply", templateKey: selected.key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "套用失败");
        return;
      }
      setOpen(false);
      setSelected(null);
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setBusy(false);
    }
  }

  async function saveAsTemplate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/meeting-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", name, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "另存失败");
        return;
      }
      setSaveOpen(false);
      setName("");
      setDescription("");
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setBusy(false);
    }
  }

  async function removeTemplate(id: string) {
    await fetch(`/api/admin/meeting-templates/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        套用场景模板
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setSaveOpen(true)}>
        另存为模板
      </Button>

      {saveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-lg">
            <h3 className="font-bold text-slate-800">另存为模板</h3>
            <p className="text-xs text-slate-500">
              把当前会议的宫格入口与页面外观保存下来，之后新建会议可一键套用。
            </p>
            {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="模板名称，如：公司季度团建"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="说明（可选）"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSaveOpen(false)} disabled={busy}>
                取消
              </Button>
              <Button variant="primary" size="sm" onClick={() => void saveAsTemplate()} disabled={busy || !name.trim()}>
                {busy ? "保存中…" : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-4">
          <div className="mx-auto w-full max-w-4xl space-y-4 rounded-xl bg-white p-5 shadow-lg">
            <div>
              <h3 className="text-lg font-bold text-slate-800">选择场景模板</h3>
              <p className="mt-1 text-sm text-amber-700">
                套用会<span className="font-medium">替换</span>当前 {currentItemCount} 个宫格入口与页面外观。
                报名、日程、内容页等业务数据不受影响。
              </p>
            </div>

            {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

            <div className="grid max-h-[55vh] gap-3 overflow-y-auto sm:grid-cols-2">
              {templates.map((t) => {
                const isSelected = selected?.key === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelected(t)}
                    className={`rounded-xl border-2 p-3 text-left transition ${
                      isSelected ? "border-sky-600 bg-sky-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800">{t.name}</span>
                      <span className="flex items-center gap-2">
                        {t.source === "CUSTOM" && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">自定义</span>
                        )}
                        <span className="text-xs text-slate-400">{t.items.length} 个入口</span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{t.description || "无说明"}</p>
                    <div
                      className="mt-2 rounded-lg p-2"
                      style={{ backgroundColor: t.bgColor || "#f8fafc", ...meetingBackgroundStyle(t) }}
                    >
                      <HomeGrid
                        meetingId={meetingId}
                        items={t.items.map((i, idx) => ({ ...i, id: `${t.key}-${idx}` }))}
                        columns={t.gridColumns}
                        rounded={t.gridRounded}
                        preview
                      />
                    </div>
                    {t.source === "CUSTOM" && t.id && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          void removeTemplate(t.id!);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            void removeTemplate(t.id!);
                          }
                        }}
                        className="mt-2 inline-block text-xs text-red-500 hover:underline"
                      >
                        删除此模板
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <span className="text-sm text-slate-500">
                {selected ? `已选「${selected.name}」，将写入 ${selected.items.length} 个入口` : "请选择一个模板"}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={busy}>
                  取消
                </Button>
                <Button variant="primary" size="sm" onClick={() => void apply()} disabled={busy || !selected}>
                  {busy ? "套用中…" : "确认套用"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
