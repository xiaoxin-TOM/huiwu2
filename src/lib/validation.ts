import { z } from "zod";
import { HOME_GRID_ICON_KEYS, HOME_GRID_SIZE_KEYS } from "@/lib/home-grid-config";
import { RECEPTION_BULK_FIELDS, RECEPTION_BULK_MODES, type ReceptionBulkField } from "@/lib/reception-bulk";

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
  password: z.string().nullish(),
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

export const albumSchema = z
  .object({
    title: z.string().min(1, "请填写相册标题"),
    date: z.string().optional().default(""),
    note: z.string().optional().default(""),
    startTime: z.string().min(1, "请选择开始时间"),
    endTime: z.string().min(1, "请选择结束时间"),
  })
  .refine((d) => d.endTime >= d.startTime, {
    message: "结束时间不能早于开始时间",
    path: ["endTime"],
  });

const coordField = (min: number, max: number, msg: string) =>
  z.string().optional().default("").refine((v) => {
    if (v === "") return true;
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max;
  }, msg);

export const siteConfigSchema = z.object({
  confName: z.string().min(1, "请填写会议名称"),
  confDate: z.string().optional().default(""),
  confLocation: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  heroImageUrl: z.string().optional().default(""),
  liveUrl: z.string().optional().default(""),
  welcomeHtml: z.string().optional().default(""),
  footerHtml: z.string().optional().default(""),
  venueAddress: z.string().optional().default(""),
  venueLng: coordField(-180, 180, "经度无效(-180~180)"),
  venueLat: coordField(-90, 90, "纬度无效(-90~90)"),
  requirePassword: z.boolean().default(false),
  registrationPassword: z.string().optional().default(""),
  requireRealName: z.boolean().default(true),
})
.refine((d) => !d.requirePassword || d.registrationPassword.trim().length > 0, {
  message: "请设置报名密码",
  path: ["registrationPassword"],
});

export const safeImageUrl = z.string().trim().max(500, "图片地址过长").refine(
  (value) =>
    value === "" ||
    (value.startsWith("/") && !value.startsWith("//")) ||
    /^https?:\/\/[^\s]+$/i.test(value),
  "图片请输入站内路径或 http(s) 链接",
);

export const noticeSchema = z.object({
  title: z.string().min(1, "请填写标题"),
  contentHtml: z.string().optional().default(""),
  mode: z.enum(["TEXT", "IMAGE"]).default("TEXT"),
  imageUrl: safeImageUrl.default(""),
  isPublished: z.boolean(),
});

export const pageSchema = z.object({
  title: z.string().min(1, "请填写标题"),
  contentHtml: z.string().optional().default(""),
  mode: z.enum(["TEXT", "IMAGE"]).default("TEXT"),
  imageUrl: safeImageUrl.default(""),
});

export const scheduleImageModeSchema = z.object({
  scheduleMode: z.enum(["TEXT", "IMAGE"]).default("TEXT"),
  scheduleImageUrl: safeImageUrl.default(""),
});

export const speakerSchema = z.object({
  name: z.string().min(1, "请填写姓名"),
  title: z.string().optional().default(""),
  organization: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  photoUrl: z.string().optional().default(""),
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

export const authorizeMeetingStaffSchema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
});

export const submissionReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
});

export const materialReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().max(500, "审核备注过长").optional().default(""),
});

export const reportLinkSchema = z
  .object({
    name: z.string().trim().max(60, "名称过长").optional().default(""),
    // 汇报链接可查看含保密在内的全部已过审材料，等同管理员级凭证，密码不可省
    password: z.string().min(6, "汇报链接密码至少 6 位").max(100, "密码过长"),
    expiresAt: z.string().trim().optional().default(""),
  })
  .refine((d) => d.expiresAt === "" || !Number.isNaN(Date.parse(d.expiresAt)), {
    message: "失效时间格式不正确",
    path: ["expiresAt"],
  });
export type ReportLinkInput = z.infer<typeof reportLinkSchema>;

export const meetingSchema = z
  .object({
    title: z.string().min(1, "请填写会议名称"),
    description: z.string().optional().default(""),
    location: z.string().optional().default(""),
    startDate: z.string().optional().default(""),
    endDate: z.string().optional().default(""),
    requireApproval: z.coerce.boolean().default(false),
    registrationLimit: z.coerce.number().int().min(0).optional().nullable(),
    opensAt: z.string().optional().nullable(),
    closesAt: z.string().optional().nullable(),
    requirePassword: z.coerce.boolean().default(false),
    registrationPassword: z.string().optional().default(""),
    requireRealName: z.coerce.boolean().default(true),
  })
  .refine((d) => !d.requirePassword || d.registrationPassword.trim().length > 0, {
    message: "请设置报名密码",
    path: ["registrationPassword"],
  });
export type MeetingInput = z.infer<typeof meetingSchema>;

const homeGridUrl = z.string().trim().min(1, "请填写跳转地址").max(500, "地址过长").refine(
  (value) =>
    (value.startsWith("/") && !value.startsWith("//")) ||
    /^https?:\/\/[^\s]+$/i.test(value),
  "请输入站内路径或 http(s) 链接",
);

export const homeGridItemSchema = z.object({
  title: z.string().trim().min(1, "请填写入口名称").max(30, "入口名称不能超过 30 个字"),
  href: homeGridUrl,
  icon: z.enum(HOME_GRID_ICON_KEYS),
  size: z.enum(HOME_GRID_SIZE_KEYS),
  backgroundImage: z.string().trim().max(500, "背景图地址过长").refine(
    (value) =>
      value === "" ||
      (value.startsWith("/") && !value.startsWith("//")) ||
      /^https?:\/\/[^\s]+$/i.test(value),
    "背景图请输入站内路径或 http(s) 链接",
  ).default(""),
  isVisible: z.boolean(),
});

export const homeGridSchema = z.object({
  columns: z.coerce.number().int().min(2).max(4).default(4),
  rounded: z.boolean().default(true),
  items: z.array(homeGridItemSchema).min(1, "至少保留一个功能入口").max(24, "功能入口最多 24 个"),
});

export const guestSchema = z.object({
  name: z.string().min(1, "请填写姓名"),
  phone: z.string().optional().default(""),
  email: z.string().email("邮箱格式不正确").optional().or(z.literal("")),
  company: z.string().optional().default(""),
  title: z.string().optional().default(""),
  level: z.enum(["VIP", "NORMAL", "MEDIA"]).default("NORMAL"),
  bio: z.string().optional().default(""),
  note: z.string().optional().default(""),
  seatInfo: z.string().optional().default(""),
});
export type GuestInput = z.infer<typeof guestSchema>;

export const receptionSchema = z.object({
  arriveMode: z.string().optional().default(""),
  arriveNo: z.string().optional().default(""),
  arriveTime: z.string().optional().default(""),
  arrivePlace: z.string().optional().default(""),
  departMode: z.string().optional().default(""),
  departNo: z.string().optional().default(""),
  departTime: z.string().optional().default(""),
  hotelName: z.string().optional().default(""),
  hotelRoom: z.string().optional().default(""),
  hotelCheckIn: z.string().optional().default(""),
  hotelCheckOut: z.string().optional().default(""),
  carPlate: z.string().optional().default(""),
  carDriver: z.string().optional().default(""),
  carDriverPhone: z.string().optional().default(""),
  carContact: z.string().optional().default(""),
  remark: z.string().optional().default(""),
});
export type ReceptionInput = z.infer<typeof receptionSchema>;

export const RECEPTION_FIELDS = Object.keys(receptionSchema.shape) as (keyof ReceptionInput)[];

/**
 * 局部更新用：只校验调用方实际提交的字段。
 * 不能用 receptionSchema，也不能用它的 .partial()——两者都会给缺失字段补 ""，
 * 把未提交的接待信息一起清空（房间号内联编辑就踩过这个坑）。
 */
export const receptionPatchSchema = z.object(
  Object.fromEntries(
    RECEPTION_FIELDS.map((key) => [key, z.string().max(500, "内容过长").optional()]),
  ) as Record<keyof ReceptionInput, z.ZodOptional<z.ZodString>>,
);
export type ReceptionPatch = z.infer<typeof receptionPatchSchema>;

// 批量设置只接受勾选过的字段，因此每个字段都是可选的；缺省即"未勾选、不写入"。
const receptionBulkFieldsShape = Object.fromEntries(
  RECEPTION_BULK_FIELDS.map((key) => [key, z.string().max(500, "内容过长").optional()]),
) as Record<ReceptionBulkField, z.ZodOptional<z.ZodString>>;

export const receptionBulkSchema = z.object({
  mode: z.enum(RECEPTION_BULK_MODES),
  targets: z
    .array(
      z.object({
        kind: z.enum(["guest", "registration"]),
        id: z.string().min(1),
      }),
    )
    .min(1, "请先勾选要设置的人员")
    .max(500, "单次最多批量设置 500 人"),
  fields: z
    .object(receptionBulkFieldsShape)
    .refine((f) => Object.keys(f).length > 0, "请至少勾选一个要设置的字段"),
});
export type ReceptionBulkInput = z.infer<typeof receptionBulkSchema>;

export const FEEDBACK_CATEGORIES = ["BUG", "SUGGESTION", "CONSULT", "COMPLAINT", "OTHER"] as const;

export const FEEDBACK_CATEGORY_LABEL: Record<string, string> = {
  BUG: "功能异常",
  SUGGESTION: "建议",
  CONSULT: "咨询",
  COMPLAINT: "投诉",
  OTHER: "其他",
};

export const feedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES).default("OTHER"),
  content: z.string().trim().min(1, "请填写反馈内容").max(2000, "反馈内容过长"),
  contact: z.string().trim().max(100, "联系方式过长").optional().default(""),
  imageUrl: safeImageUrl.optional().default(""),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const feedbackReplySchema = z.object({
  reply: z.string().trim().min(1, "请填写回复内容").max(2000, "回复内容过长"),
});

export const meetingContactSchema = z.object({
  orgName: z.string().trim().max(100, "名称过长").optional().default(""),
  phone: z.string().trim().max(50, "电话过长").optional().default(""),
  phone2: z.string().trim().max(50, "电话过长").optional().default(""),
  email: z.string().trim().max(100, "邮箱过长").optional().default(""),
  wechatId: z.string().trim().max(50, "微信号过长").optional().default(""),
  address: z.string().trim().max(200, "地址过长").optional().default(""),
  // 二维码走与其他图片一致的白名单，挡掉 javascript: 与协议相对地址
  wecomQrUrl: safeImageUrl.optional().default(""),
  groupQrUrl: safeImageUrl.optional().default(""),
  mpQrUrl: safeImageUrl.optional().default(""),
  wecomNote: z.string().trim().max(100, "说明过长").optional().default(""),
  groupNote: z.string().trim().max(100, "说明过长").optional().default(""),
  mpNote: z.string().trim().max(100, "说明过长").optional().default(""),
});
export type MeetingContactInput = z.infer<typeof meetingContactSchema>;

export const channelSchema = z.object({
  code: z.string().min(2, "短码至少 2 位").max(40, "短码过长"),
  name: z.string().min(1, "请填写渠道名称"),
  owner: z.string().optional().default(""),
  note: z.string().optional().default(""),
});
export type ChannelInput = z.infer<typeof channelSchema>;

export const registrationTypeSchema = z.object({
  name: z.string().min(1, "请填写类型名称"),
  fee: z.coerce.number().int().min(0, "费用不能为负"),
  description: z.string().optional().default(""),
});
export type RegistrationTypeInput = z.infer<typeof registrationTypeSchema>;

const liveStreamUrl = z.string().trim().min(1, "请填写直播地址").max(500, "直播地址过长").refine(
  (value) => /^https?:\/\/[^\s]+$/i.test(value),
  "请输入 http(s) 外部直播链接",
);

export const liveStreamSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "请填写会场名称").max(50, "会场名称不能超过 50 个字"),
  url: liveStreamUrl,
  coverImage: z.string().trim().max(500, "封面图地址过长").refine(
    (value) =>
      value === "" ||
      (value.startsWith("/") && !value.startsWith("//")) ||
      /^https?:\/\/[^\s]+$/i.test(value),
    "封面图请输入站内路径或 http(s) 链接",
  ).default(""),
  introImage: z.string().trim().max(500, "介绍图片地址过长").refine(
    (value) =>
      value === "" ||
      (value.startsWith("/") && !value.startsWith("//")) ||
      /^https?:\/\/[^\s]+$/i.test(value),
    "介绍图片请输入站内路径或 http(s) 链接",
  ).default(""),
  description: z.string().trim().max(200, "会场描述不能超过 200 个字").default(""),
  time: z.string().trim().max(100, "观看时间不能超过 100 个字").default(""),
  isVisible: z.boolean(),
});

export const liveStreamsSchema = z.object({
  multiButton: z.boolean().default(false),
  items: z.array(liveStreamSchema).max(20, "直播会场最多 20 个"),
});

export const badgeTemplateSchema = z.object({
  pageWidthMm: z.coerce.number().int().min(1),
  pageHeightMm: z.coerce.number().int().min(1),
  bgImageUrl: z.string().optional().default(""),
  labelGapMm: z.coerce.number().int().min(0),
  nameX: z.coerce.number().int(),
  nameY: z.coerce.number().int(),
  nameSize: z.coerce.number().int().min(1),
  titleX: z.coerce.number().int(),
  titleY: z.coerce.number().int(),
  titleSize: z.coerce.number().int().min(1),
  companyX: z.coerce.number().int(),
  companyY: z.coerce.number().int(),
  companySize: z.coerce.number().int().min(1),
  qrX: z.coerce.number().int(),
  qrY: z.coerce.number().int(),
  qrSize: z.coerce.number().int().min(1),
  meetingTitleX: z.coerce.number().int(),
  meetingTitleY: z.coerce.number().int(),
  meetingTitleSize: z.coerce.number().int().min(1),
});
export type BadgeTemplateInput = z.infer<typeof badgeTemplateSchema>;
