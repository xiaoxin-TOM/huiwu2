import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  organization?: string;
}

export async function createUser(input: CreateUserInput): Promise<{ id: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("EMAIL_TAKEN");
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      phone: input.phone,
      organization: input.organization,
    },
  });
  return { id: user.id };
}
