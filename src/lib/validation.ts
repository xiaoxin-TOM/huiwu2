import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "请填写姓名"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
  phone: z.string().optional(),
  organization: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const registrationSchema = z.object({
  typeId: z.string().min(1, "请选择参会类型"),
  fullName: z.string().min(1, "请填写姓名"),
  organization: z.string().optional().default(""),
  title: z.string().optional().default(""),
  phone: z.string().optional().default(""),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

export const submissionSchema = z.object({
  title: z.string().min(1, "请填写论文题目"),
  authors: z.string().min(1, "请填写作者"),
  abstract: z.string().min(1, "请填写摘要"),
});
export type SubmissionInput = z.infer<typeof submissionSchema>;

export const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
});
