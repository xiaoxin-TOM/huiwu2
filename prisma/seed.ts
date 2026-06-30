import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";

async function main() {
  await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      confName: "示例学术年会",
      confDate: "2026-09-18 至 2026-09-20",
      confLocation: "北京国际会议中心",
      welcomeHtml: "<p>欢迎参加本次大会。</p>",
      contactHtml: "<p>会务组电话:010-00000000</p>",
    },
  });

  const adminEmail = "admin@conf.local";
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!exists) {
    await prisma.user.create({
      data: {
        name: "系统管理员",
        email: adminEmail,
        passwordHash: await hashPassword("admin123"),
        role: "ADMIN",
      },
    });
  }

  const types = ["普通代表", "学生代表", "现场注册"];
  for (const name of types) {
    const found = await prisma.registrationType.findFirst({ where: { name } });
    if (!found) {
      await prisma.registrationType.create({
        data: { name, fee: name === "学生代表" ? 800 : 1200 },
      });
    }
  }
  console.log("seed 完成");
}

main().finally(() => prisma.$disconnect());
