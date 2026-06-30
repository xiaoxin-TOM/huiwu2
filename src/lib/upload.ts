import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const MAX_BYTES = 10 * 1024 * 1024;

/** 合法返回 null,否则返回中文错误信息。 */
export function validatePdf(file: { type: string; size: number }): string | null {
  if (file.type !== "application/pdf") return "仅支持 PDF 文件";
  if (file.size > MAX_BYTES) return "文件不能超过 10MB";
  return null;
}

export async function savePdf(file: File): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.pdf`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}
