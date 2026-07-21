import { decode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getUserRegistration, createRegistration, listRegistrationTypes } from "@/lib/registrations";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";
import { registrationSchema } from "@/lib/validation";

export async function getTokenUser(token: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not set");
  const payload = await decode({ token, secret, salt: "public-api-token" });
  if (!payload || typeof payload.sub !== "string") return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  return user ?? null;
}

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return jsonError("请先登录", 401);
    const user = await getTokenUser(token);
    if (!user) return jsonError("登录已失效", 401);

    const meeting = await requirePublicMeeting();
    const [existing, types] = await Promise.all([
      getUserRegistration(user.id, meeting.id),
      listRegistrationTypes(),
    ]);

    return jsonOk({ existing, types, meeting: { id: meeting.id, title: meeting.title } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取报名信息失败";
    return jsonError(msg, 500);
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return jsonError("请先登录", 401);
    const user = await getTokenUser(token);
    if (!user) return jsonError("登录已失效", 401);

    const body = await req.json().catch(() => null);
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "参数错误", 400);
    }

    const meeting = await requirePublicMeeting();
    const registration = await createRegistration(user.id, meeting.id, parsed.data);
    return jsonOk({ registration });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "提交报名失败";
    if (msg === "ALREADY_REGISTERED") return jsonError("您已经报名过该会议", 409);
    if (msg === "TYPE_NOT_FOUND") return jsonError("参会类型不存在", 400);
    return jsonError(msg, 500);
  }
}
