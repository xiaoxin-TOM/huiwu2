import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "请填写姓名"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
  phone: z.string().optional(),
  organization: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
