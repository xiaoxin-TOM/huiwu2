import OSS from "ali-oss";
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

export async function uploadToOSS(params: {
  speakerId: string;
  fileName: string;
  buffer: Buffer;
  mime: string;
  req?: Request;
}): Promise<string> {
  const client = getClient();
  const safeName = params.fileName.replace(/[^a-zA-Z0-9_.\-\u4e00-\u9fa5]/g, "_");
  const key = `${getBasePath()}/speakers/${params.speakerId}/${randomUUID()}-${safeName}`;
  const headers: Record<string, string> = {
    "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}"`,
  };
  const ip = params.req ? getClientIp(params.req) : undefined;
  const userId = process.env.OSS_USER_ID ?? (ip ? `ip:${ip}` : undefined);
  const userName = ip ?? process.env.OSS_USER_NAME;
  if (userId) {
    headers["x-oss-meta-upload-user-id"] = encodeURIComponent(userId);
  }
  if (userName) {
    headers["x-oss-meta-upload-user-name"] = encodeURIComponent(userName);
  }
  const result = await client.put(key, params.buffer, {
    mime: params.mime,
    headers,
  });
  if (!result.url) {
    throw new Error("OSS 上传失败，未返回文件 URL");
  }
  // 使用配置的公网访问地址（IMAGE_BASE_URL / ALIYUN_OSS_PUBLIC_BASE_URL / OSS 默认域名）
  return `${getPublicBaseUrl()}/${key}`;
}
