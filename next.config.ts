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
	 allowedDevOrigins: ['huiwutong.wealzeal.com','39.96.221.13'],
  serverExternalPackages: ["ali-oss"],
  images: {
    remotePatterns: getRemotePatterns(),
  },
};

export default nextConfig;
