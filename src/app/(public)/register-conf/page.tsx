import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getUserRegistration } from "@/lib/registrations";
import { prisma } from "@/lib/prisma";
import RegistrationForm from "@/components/RegistrationForm";
import { STATUS_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard, IconCard } from "@/components/ui/Card";
import { ClipboardListIcon, UserIcon, FileEditIcon } from "@/components/icons";

export default async function RegisterConfPage() {
  const user = await requireUser();
  const existing = await getUserRegistration(user.id);

  if (existing) {
    return (
      <div className="space-y-4">
        <PageHeader title="注册报名" />
        <SectionCard>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <ClipboardListIcon className="h-10 w-10" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-800">您已提交报名</h2>
            <p className="mb-1 text-slate-600">
              当前状态：
              <span className="font-semibold text-sky-600">
                {STATUS_LABEL[existing.status] ?? existing.status}
              </span>
            </p>
            <p className="text-sm text-slate-500">参会类型：{existing.type.name}</p>
            <Link
              href="/me"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 font-medium text-white transition hover:bg-sky-700"
            >
              <UserIcon className="h-5 w-5" />
              前往个人中心
            </Link>
          </div>
        </SectionCard>
      </div>
    );
  }

  const types = await prisma.registrationType.findMany({ orderBy: { fee: "asc" } });
  return (
    <div className="space-y-4">
      <PageHeader title="注册报名" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <IconCard href="/schedule" title="查看日程" icon={<ClipboardListIcon className="h-6 w-6" />} />
        <IconCard href="/speakers" title="专家介绍" icon={<UserIcon className="h-6 w-6" />} />
        <IconCard href="/submissions" title="论文提交" icon={<FileEditIcon className="h-6 w-6" />} />
        <IconCard href="/" title="返回首页" icon={<ClipboardListIcon className="h-6 w-6" />} />
      </div>
      <SectionCard title="填写报名信息">
        <RegistrationForm types={types.map((t) => ({ id: t.id, name: t.name, fee: t.fee }))} />
      </SectionCard>
    </div>
  );
}
