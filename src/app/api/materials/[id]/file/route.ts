import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getMaterialWithContext, toMaterialFacts } from "@/lib/speaker-materials";
import { canViewMaterialAsAny } from "@/lib/material-access";
import { resolveMaterialViewers } from "@/lib/material-viewer";
import { getSpeakerMaterialStream } from "@/lib/oss";

/**
 * 讲者材料的唯一读取入口。OSS 对象是私有读，这里鉴权后同源流式转发——
 * 既不泄漏任何 OSS 地址，也免掉预览组件跨域取 ArrayBuffer 的 CORS 配置。
 */
export async function GET(req: Request, ctx: RouteContext<"/api/materials/[id]/file">) {
  const { id } = await ctx.params;
  const material = await getMaterialWithContext(id);
  if (!material) {
    return NextResponse.json({ ok: false, error: "文件不存在" }, { status: 404 });
  }

  const url = new URL(req.url);
  const viewers = await resolveMaterialViewers(material.speaker.meetingId, {
    reportToken: url.searchParams.get("rl"),
  });
  if (!canViewMaterialAsAny(toMaterialFacts(material), viewers)) {
    return NextResponse.json({ ok: false, error: "无权访问该文件" }, { status: 403 });
  }

  if (!material.fileKey) {
    return NextResponse.json({ ok: false, error: "文件尚未迁移到私有存储，请联系管理员" }, { status: 409 });
  }

  try {
    const stream = await getSpeakerMaterialStream(material.fileKey);
    const disposition = url.searchParams.get("download") === "1" ? "attachment" : "inline";
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": material.mimeType || "application/octet-stream",
        "Content-Length": String(material.fileSize),
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(material.fileName)}`,
        // 保密材料不得进入任何共享缓存
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[material file] id:", id, "key:", material.fileKey, "error:", error);
    return NextResponse.json({ ok: false, error: "文件读取失败" }, { status: 502 });
  }
}
