"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import type { MaterialPreviewMeta } from "@/types/material";

/**
 * 预览器整块懒加载：pdf.js / docx / pptx 渲染器加起来体积很大，
 * 不该拖慢没点开预览的页面。
 */
const LazyPreviewSurface = dynamic(() => import("@/components/MaterialPreviewSurface"), {
  ssr: false,
  loading: () => <p className="p-8 text-center text-sm text-slate-500">预览组件加载中…</p>,
});

export default function MaterialPreview({
  material,
  reportToken,
}: {
  material: MaterialPreviewMeta;
  reportToken?: string;
}) {
  const [failed, setFailed] = useState(false);

  const { fileHref, downloadHref } = useMemo(() => {
    const qs = reportToken ? `?rl=${encodeURIComponent(reportToken)}` : "";
    const sep = qs ? "&" : "?";
    return {
      fileHref: `/api/materials/${material.id}/file${qs}`,
      downloadHref: `/api/materials/${material.id}/file${qs}${sep}download=1`,
    };
  }, [material.id, reportToken]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-800">{material.fileName}</p>
          <p className="text-xs text-slate-500">
            {material.speakerName} · {(material.fileSize / 1024 / 1024).toFixed(2)} MB
            {material.isConfidential && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">保密</span>
            )}
          </p>
        </div>
        <a
          href={downloadHref}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          下载原文件
        </a>
      </div>

      <div className="min-h-[60vh] overflow-hidden rounded-xl border bg-white">
        {failed ? (
          <div className="space-y-3 p-8 text-center">
            <p className="text-sm text-slate-600">该文件无法在浏览器中预览。</p>
            <p className="text-xs text-slate-400">
              PPT/Word 的浏览器端渲染对复杂排版支持有限，下载后用本机软件打开可保证版式正确。
            </p>
            <a
              href={downloadHref}
              className="inline-flex rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
            >
              下载查看
            </a>
          </div>
        ) : (
          <LazyPreviewSurface
            fileHref={fileHref}
            fileName={material.fileName}
            fileSize={material.fileSize}
            mimeType={material.mimeType}
            onFailed={() => setFailed(true)}
          />
        )}
      </div>

      {failed && (
        <Button variant="ghost" onClick={() => setFailed(false)}>
          重试预览
        </Button>
      )}
    </div>
  );
}
