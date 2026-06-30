import { prisma } from "@/lib/prisma";
import RichText from "@/components/RichText";

export default async function HomePage() {
  const cfg = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">{cfg?.confName ?? "学术会议"}</h1>
      <p className="text-gray-600">{cfg?.confDate} · {cfg?.confLocation}</p>
      <RichText html={cfg?.welcomeHtml ?? ""} />
    </section>
  );
}
