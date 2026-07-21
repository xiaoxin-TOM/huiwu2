import { authorizeCredentials } from "@/lib/auth";
import { encode } from "next-auth/jwt";
import { jsonOk, jsonError } from "@/lib/public-api";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "请填写密码"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "参数错误", 400);
    }
    const { email, password } = parsed.data;
    const user = await authorizeCredentials(email, password);
    if (!user) return jsonError("邮箱或密码错误", 401);

    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET not set");
    const token = await encode({
      token: { sub: user.id, id: user.id, name: user.name, email: user.email, role: user.role },
      secret,
      salt: "public-api-token",
    });

    return jsonOk({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "登录失败";
    return jsonError(msg, 500);
  }
}
