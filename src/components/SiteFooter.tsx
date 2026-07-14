import { prisma } from "@/lib/prisma";
import { getPublicMeetingForRequest } from "@/lib/meetings";
import { getPublicConfig } from "@/lib/public";

async function getFooterMeeting() {
  return getPublicMeetingForRequest();
}

export default async function SiteFooter() {
  const meeting = await getFooterMeeting();
  const siteConfig = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  const defaultFooter =
    siteConfig?.footerHtml?.trim() ||
    `© ${new Date().getFullYear()} 会务管理系统 · All rights reserved.\n中国医院协会 版权所有\n技术支持由位值科技有限公司提供`;
  const footerText = meeting && siteConfig
    ? getPublicConfig(meeting, siteConfig).footerHtml || defaultFooter
    : defaultFooter;
  return (
    <footer
      className="mt-auto border-t bg-cover bg-center bg-no-repeat text-black"
      style={{ backgroundImage: "url('/imgs/ui_d.jpg')" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-black">
        <div className="whitespace-pre-line leading-relaxed">{footerText}</div>
      </div>
    </footer>
  );
}
