import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  if (!text) {
    return NextResponse.json({ ok: false, error: "缺少 text 参数" }, { status: 400 });
  }

  try {
    const buffer = await QRCode.toBuffer(text, { width: 256, margin: 2 });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "二维码生成失败" }, { status: 500 });
  }
}
