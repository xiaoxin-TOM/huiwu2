import OSS from "ali-oss";
import type { Readable } from "node:stream";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 50 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateSpeakerMaterial(file: { type: string; size: number }): string | null {
  if (!(file.type in ALLOWED_TYPES)) return "仅支持 PDF、PPT、PPTX、Word、Excel 文件";
  if (file.size > MAX_BYTES) return "文件不能超过 50MB";
  return null;
}

function getClient(): OSS {
  const region = process.env.ALIYUN_OSS_REGION;
  const bucket = process.env.ALIYUN_OSS_BUCKET;
  const accessKeyId = process.env.ALIYUN_OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET;
  if (!region || !bucket || !accessKeyId || !accessKeySecret) {
    throw new Error("阿里云 OSS 环境变量未配置");
  }
  return new OSS({
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    endpoint: process.env.ALIYUN_OSS_ENDPOINT || undefined,
    secure: true,
  });
}

export function getPublicBaseUrl(): string {
  const imageBase = process.env.IMAGE_BASE_URL;
  if (imageBase) return imageBase.replace(/\/$/, "");
  const custom = process.env.ALIYUN_OSS_PUBLIC_BASE_URL;
  if (custom) return custom.replace(/\/$/, "");
  const region = process.env.ALIYUN_OSS_REGION;
  const bucket = process.env.ALIYUN_OSS_BUCKET;
  if (!region || !bucket) throw new Error("阿里云 OSS 环境变量未配置");
  return `https://${bucket}.${region}.aliyuncs.com`;
}

function getBasePath(): string {
  const base = process.env.OSS_BASE_PATH || "uploads";
  return base.replace(/\/$/, "").replace(/^\//, "");
}

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? undefined;
}

function uploaderMetadata(req?: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  const ip = req ? getClientIp(req) : undefined;
  const userId = process.env.OSS_USER_ID ?? (ip ? `ip:${ip}` : undefined);
  const userName = ip ?? process.env.OSS_USER_NAME;
  if (userId) headers["x-oss-meta-upload-user-id"] = encodeURIComponent(userId);
  if (userName) headers["x-oss-meta-upload-user-name"] = encodeURIComponent(userName);
  return headers;
}

/**
 * 上传讲者材料。对象一律写成私有读——材料可能是保密稿，公网直链等于没有保密可言。
 * 返回 object key，读取统一走 /api/materials/[id]/file 鉴权代理。
 */
export async function uploadToOSS(params: {
  speakerId: string;
  fileName: string;
  buffer: Buffer;
  mime: string;
  req?: Request;
}): Promise<{ key: string; url: string }> {
  const client = getClient();
  const safeName = params.fileName.replace(/[^a-zA-Z0-9_.\-\u4e00-\u9fa5]/g, "_");
  const key = `${getBasePath()}/speakers/${params.speakerId}/${randomUUID()}-${safeName}`;
  const result = await client.put(key, params.buffer, {
    mime: params.mime,
    headers: {
      "x-oss-object-acl": "private",
      ...uploaderMetadata(params.req),
    },
  });
  if (!result.url) {
    throw new Error("OSS 上传失败，未返回文件 URL");
  }
  // url 仅留档备查，不对外暴露
  return { key, url: `${getPublicBaseUrl()}/${key}` };
}

/** 取私有对象的可读流，供鉴权代理路由透传给浏览器。 */
export async function getSpeakerMaterialStream(key: string): Promise<Readable> {
  const result = await getClient().getStream(key);
  if (!result?.stream) throw new Error("OSS 读取失败");
  return result.stream as Readable;
}

export async function deleteSpeakerMaterialFromOSS(key: string): Promise<void> {
  if (!key) return;
  await getClient().delete(key);
}

/** 把历史遗留的公网 URL 还原成 object key，供回填脚本使用。 */
export function keyFromPublicUrl(url: string): string {
  if (!url) return "";
  for (const base of [process.env.IMAGE_BASE_URL, process.env.ALIYUN_OSS_PUBLIC_BASE_URL]) {
    const trimmed = base?.replace(/\/$/, "");
    if (trimmed && url.startsWith(`${trimmed}/`)) return url.slice(trimmed.length + 1);
  }
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch {
    return "";
  }
}

/** 把历史对象的 ACL 收回为私有，供回填脚本使用。 */
export async function makeObjectPrivate(key: string): Promise<void> {
  if (!key) return;
  await getClient().putACL(key, "private");
}

export async function uploadHomeGridImageToOSS(params: {
  meetingId: string;
  buffer: Buffer;
  mime: string;
  req?: Request;
}): Promise<string> {
  const ext = IMAGE_TYPES[params.mime];
  if (!ext) throw new Error("仅支持 JPG/PNG/WebP 图片");
  const client = getClient();
  const safeMeetingId = params.meetingId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const key = `${getBasePath()}/meetings/${safeMeetingId}/home-grid/${randomUUID()}.${ext}`;
  const result = await client.put(key, params.buffer, {
    mime: params.mime,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
      ...uploaderMetadata(params.req),
    },
  });
  if (!result.url) throw new Error("OSS 上传失败，未返回文件 URL");
  return `${getPublicBaseUrl()}/${key}`;
}

export async function uploadLiveStreamCoverToOSS(params: {
  meetingId: string;
  buffer: Buffer;
  mime: string;
  req?: Request;
}): Promise<string> {
  const ext = IMAGE_TYPES[params.mime];
  if (!ext) throw new Error("仅支持 JPG/PNG/WebP 图片");
  const client = getClient();
  const safeMeetingId = params.meetingId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const key = `${getBasePath()}/meetings/${safeMeetingId}/live-streams/${randomUUID()}.${ext}`;
  const result = await client.put(key, params.buffer, {
    mime: params.mime,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
      ...uploaderMetadata(params.req),
    },
  });
  if (!result.url) throw new Error("OSS 上传失败，未返回文件 URL");
  return `${getPublicBaseUrl()}/${key}`;
}

export async function uploadAdminImageToOSS(params: {
  meetingId: string;
  buffer: Buffer;
  mime: string;
  req?: Request;
}): Promise<string> {
  const ext = IMAGE_TYPES[params.mime];
  if (!ext) throw new Error("仅支持 JPG/PNG/WebP 图片");
  const client = getClient();
  const safeMeetingId = params.meetingId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const key = `${getBasePath()}/meetings/${safeMeetingId}/admin-images/${randomUUID()}.${ext}`;
  const result = await client.put(key, params.buffer, {
    mime: params.mime,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
      ...uploaderMetadata(params.req),
    },
  });
  if (!result.url) throw new Error("OSS 上传失败，未返回文件 URL");
  return `${getPublicBaseUrl()}/${key}`;
}
