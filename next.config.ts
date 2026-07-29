import type { NextConfig } from "next";

function getRemotePatterns(): { protocol: "http" | "https"; hostname: string }[] {
  const patterns: { protocol: "http" | "https"; hostname: string }[] = [];

  for (const url of [process.env.IMAGE_BASE_URL, process.env.ALIYUN_OSS_PUBLIC_BASE_URL]) {
    if (url) {
      try {
        const u = new URL(url);
        patterns.push({ protocol: u.protocol.slice(0, -1) as "http" | "https", hostname: u.hostname });
      } catch {
        // 忽略无效 URL
      }
    }
  }

  const region = process.env.ALIYUN_OSS_REGION;
  const bucket = process.env.ALIYUN_OSS_BUCKET;
  if (region && bucket) {
    patterns.push({ protocol: "https", hostname: `${bucket}.${region}.aliyuncs.com` });
  }

  return patterns;
}

const nextConfig: NextConfig = {
	 allowedDevOrigins: ['huiwutong.wealzeal.com','39.96.221.13','192.168.31.182'],
  serverExternalPackages: ["ali-oss"],
  // 强制转译可能含现代语法的第三方库（兼容 Chromium 80）
  transpilePackages: [
    "@lamberl-lee/file-preview",
    "pdfjs-dist",
    "docx-preview",
    "exceljs",
    "jszip",
    "@aiden0z/pptx-renderer",
  ],
  // 关闭严格模式以减少水合错误
  reactStrictMode: false,
  images: {
    remotePatterns: getRemotePatterns(),
  },
};

export default nextConfig;
