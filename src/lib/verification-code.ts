import { prisma } from "@/lib/prisma";

const CODE_TTL_MINUTES = 3;

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createVerificationCode(email: string): Promise<string> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await prisma.verificationCode.create({
    data: {
      email,
      code,
      expiresAt,
    },
  });

  return code;
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (record) {
    // 验证成功后删除该验证码，防止重复使用
    await prisma.verificationCode.delete({
      where: { id: record.id },
    });
    return true;
  }

  return false;
}
