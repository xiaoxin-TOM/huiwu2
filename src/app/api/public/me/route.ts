import { decode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getUserRegistration } from "@/lib/registrations";
import { listUserBookings } from "@/lib/bookings";
import { getSpeakerByUserId, listSpeakersByUserId } from "@/lib/speakers-admin";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";
import { z } from "zod";

const tokenSchema = z.object({
  token: z.string().min(1, "缺少 token"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = tokenSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "参数错误", 400);
    }
    const { token } = parsed.data;
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET not set");
    const payload = await decode({ token, secret, salt: "public-api-token" });
    if (!payload || typeof payload.sub !== "string") {
      return jsonError("token 无效", 401);
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return jsonError("用户不存在", 401);

    const meeting = await requirePublicMeeting();
    const [registration, bookings, speaker, allSpeakers] = await Promise.all([
      getUserRegistration(user.id, meeting.id),
      listUserBookings(user.id, meeting.id),
      getSpeakerByUserId(user.id, meeting.id),
      listSpeakersByUserId(user.id),
    ]);

    return jsonOk({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      registration,
      bookings,
      speaker,
      allSpeakers,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取个人信息失败";
    return jsonError(msg, 500);
  }
}
