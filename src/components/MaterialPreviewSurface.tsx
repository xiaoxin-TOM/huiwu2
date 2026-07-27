"use client";

import { useEffect, useMemo } from "react";
import { PluginPreviewRenderer, detectFileType } from "@lamberl-lee/file-preview";
import { createBuiltinPreviewRegistry } from "@lamberl-lee/file-preview/full";
import "@lamberl-lee/file-preview/styles/index.css";

/**
 * @lamberl-lee/file-preview 的实际挂载点。只被 MaterialPreview 动态导入（ssr: false），
 * 因此这里可以在渲染期直接构造插件注册表。
 *
 * 文件走同源的 /api/materials/[id]/file，所以直接用 url 源即可，
 * 不必先取 ArrayBuffer，也不需要给 OSS 配 CORS。
 */
export default function MaterialPreviewSurface({
  fileHref,
  fileName,
  fileSize,
  mimeType,
  onFailed,
}: {
  fileHref: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  onFailed: () => void;
}) {
  const registry = useMemo(() => {
    try {
      return createBuiltinPreviewRegistry();
    } catch (error) {
      console.error("[material preview] 插件注册失败", error);
      return null;
    }
  }, []);

  // 注册表构造失败属于环境级问题，通知父组件降级到下载
  useEffect(() => {
    if (!registry) onFailed();
  }, [registry, onFailed]);

  const file = useMemo(
    () => ({
      id: fileHref,
      name: fileName,
      size: fileSize,
      type: mimeType,
      fileType: detectFileType(fileName, mimeType),
      source: { kind: "url" as const, url: fileHref, name: fileName, mimeType },
    }),
    [fileHref, fileName, fileSize, mimeType],
  );

  if (!registry) {
    return <p className="p-8 text-center text-sm text-slate-500">预览组件不可用，请下载查看。</p>;
  }

  return (
    <PluginPreviewRenderer
      file={file}
      registry={registry}
      // 会议材料上限 50MB，尺寸由上传接口把关，这里不再二次拦截
      largeFilePolicy="off"
      onError={(error) => {
        console.error("[material preview]", error.code, error.message);
        onFailed();
      }}
    />
  );
}
