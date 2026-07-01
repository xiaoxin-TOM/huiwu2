import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getUserRegistration } from "@/lib/registrations";
import { prisma } from "@/lib/prisma";
import RegistrationForm from "@/components/RegistrationForm";
import { STATUS_LABEL } from "@/lib/labels";

export default async function RegisterConfPage() {
  const user = await requireUser();
  const existing = await getUserRegistration(user.id);

  if (existing) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">注册报名</h1>
        <p>您已提交报名,当前状态:
          <span className="font-medium text-sky-700">{STATUS_LABEL[existing.status] ?? existing.status}</span>
        </p>
        <p className="text-sm text-gray-500">参会类型:{existing.type.name}</p>
        <Link href="/me" className="text-sky-700 hover:underline">前往个人中心</Link>
      </section>
    );
  }

  const types = await prisma.registrationType.findMany({ orderBy: { fee: "asc" } });
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">注册报名</h1>
      <RegistrationForm types={types.map((t) => ({ id: t.id, name: t.name, fee: t.fee }))} />
    </section>
  );
}
