import { prisma } from "@/lib/prisma";

export default async function LivePage() {
  const cfg = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  const liveUrl = cfg?.liveUrl;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">直播</h1>
      {liveUrl ? (
        <div className="space-y-3">
          <p className="text-gray-600">点击下方按钮前往直播平台观看。</p>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer"
            className="inline-block rounded bg-sky-700 px-5 py-2.5 text-white">
            进入直播 →
          </a>
        </div>
      ) : (
        <p className="text-gray-500">直播暂未开始,敬请期待。</p>
      )}
    </section>
  );
}
