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

  const notices = [
    {
      title: "第一轮会议通知",
      contentHtml: "<p>欢迎参加示例学术年会,现将有关事项通知如下。</p>",
      isPublished: true,
    },
    {
      title: "论文征集启事",
      contentHtml: "<p>即日起开放摘要投稿,截止日期以官网为准。</p>",
      isPublished: true,
    },
    {
      title: "(草稿)日程调整",
      contentHtml: "<p>内部草稿,暂不发布。</p>",
      isPublished: false,
    },
  ];
  for (const n of notices) {
    const found = await prisma.notice.findFirst({ where: { title: n.title } });
    if (!found) await prisma.notice.create({ data: n });
  }
  const pages = [
    {
      slug: "venue",
      title: "会场交通",
      contentHtml:
        "<p>会场:北京国际会议中心。地铁 8 号线奥体中心站 B 口步行 10 分钟。</p>",
    },
    {
      slug: "contact",
      title: "联系方式",
      contentHtml: "<p>会务组邮箱:office@conf.local<br/>电话:010-00000000</p>",
    },
  ];
  for (const p of pages) {
    await prisma.page.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  const speakers = [
    { name: "张三", title: "教授", organization: "清华大学", bio: "<p>研究方向:人工智能。</p>" },
    { name: "李四", title: "研究员", organization: "北京大学", bio: "<p>研究方向:材料科学。</p>" },
    { name: "王五", title: "主任", organization: "中科院", bio: "<p>大会主持人。</p>", isModerator: true },
  ];
  for (const s of speakers) {
    const found = await prisma.speaker.findFirst({ where: { name: s.name } });
    if (!found) await prisma.speaker.create({ data: s });
  }

  const zhang = await prisma.speaker.findFirst({ where: { name: "张三" } });
  const li = await prisma.speaker.findFirst({ where: { name: "李四" } });
  const wang = await prisma.speaker.findFirst({ where: { name: "王五" } });

  const sessions = [
    {
      day: "2026-09-18", startTime: "09:00", endTime: "09:30",
      room: "主会场", title: "开幕式", isBrief: true,
      links: wang ? [{ speakerId: wang.id, role: "MODERATOR" }] : [],
    },
    {
      day: "2026-09-18", startTime: "09:30", endTime: "10:30",
      room: "主会场", title: "主旨报告:人工智能前沿", isBrief: true,
      links: zhang ? [{ speakerId: zhang.id, role: "SPEAKER" }] : [],
    },
    {
      day: "2026-09-19", startTime: "14:00", endTime: "15:00",
      room: "分会场 A", title: "材料科学分论坛", isBrief: false,
      links: li ? [{ speakerId: li.id, role: "SPEAKER" }] : [],
    },
  ];
  for (const s of sessions) {
    const found = await prisma.session.findFirst({ where: { title: s.title } });
    if (!found) {
      const { links, ...data } = s;
      await prisma.session.create({
        data: { ...data, speakers: { create: links } },
      });
    }
  }

  const hotels = [
    { name: "会议中心大酒店", price: 600, address: "会场旁 200 米", distance: "步行 3 分钟",
      description: "<p>紧邻主会场,含双早。</p>" },
    { name: "城市快捷酒店", price: 320, address: "地铁 8 号线奥体中心站", distance: "地铁 2 站",
      description: "<p>经济实惠,交通便利。</p>" },
  ];
  for (const h of hotels) {
    const found = await prisma.hotel.findFirst({ where: { name: h.name } });
    if (!found) await prisma.hotel.create({ data: h });
  }

  console.log("seed 完成");
}

main().finally(() => prisma.$disconnect());
