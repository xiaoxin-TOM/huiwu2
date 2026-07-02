import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "请填写姓名"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
  code: z.string().length(6, "请填写6位验证码"),
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

export const bookingSchema = z
  .object({
    hotelId: z.string().min(1, "请选择酒店"),
    checkIn: z.string().min(1, "请选择入住日期"),
    checkOut: z.string().min(1, "请选择离店日期"),
    rooms: z.coerce.number().int().min(1, "房间数至少 1").max(10, "房间数过多"),
  })
  .refine((d) => d.checkOut > d.checkIn, {
    message: "离店日期需晚于入住日期",
    path: ["checkOut"],
  });
export type BookingInput = z.infer<typeof bookingSchema>;

export const albumSchema = z.object({
  title: z.string().min(1, "请填写相册标题"),
  date: z.string().min(1, "请填写日期"),
});

export const siteConfigSchema = z.object({
  confName: z.string().min(1, "请填写会议名称"),
  confDate: z.string().optional().default(""),
  confLocation: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  liveUrl: z.string().optional().default(""),
  welcomeHtml: z.string().optional().default(""),
  footerHtml: z.string().optional().default(""),
});

export const noticeSchema = z.object({
  title: z.string().min(1, "请填写标题"),
  contentHtml: z.string().optional().default(""),
  isPublished: z.boolean(),
});

export const pageSchema = z.object({
  title: z.string().min(1, "请填写标题"),
  contentHtml: z.string().optional().default(""),
});

export const speakerSchema = z.object({
  name: z.string().min(1, "请填写姓名"),
  title: z.string().optional().default(""),
  organization: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  photoUrl: z.string().optional().default(""),
  isModerator: z.boolean(),
});

export const sessionSchema = z.object({
  day: z.string().min(1, "请填写日期"),
  startTime: z.string().min(1, "请填写开始时间"),
  endTime: z.string().min(1, "请填写结束时间"),
  room: z.string().optional().default(""),
  title: z.string().min(1, "请填写标题"),
});

export const sessionSpeakerSchema = z.object({
  speakerId: z.string().min(1, "请选择讲者"),
  role: z.enum(["SPEAKER", "MODERATOR"]),
});

export const hotelSchema = z.object({
  name: z.string().min(1, "请填写酒店名称"),
  description: z.string().optional().default(""),
  price: z.coerce.number().int().min(0, "价格不能为负"),
  address: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  distance: z.string().optional().default(""),
});

export const roleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});
