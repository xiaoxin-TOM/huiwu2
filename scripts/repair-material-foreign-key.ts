/**
 * 修复"对象在 OSS 中不可读"的讲者材料。
 *
 *   npx tsx --env-file=.env scripts/repair-material-foreign-key.ts [--dry-run]
 *
 * 背景：历史材料的对象由旧系统的另一个阿里云账号上传，当前账号的 AccessKey
 * 对其中部分对象既读不了也改不了 ACL（AccessDenied）。此脚本对每条读不出来的
 * 材料，找同讲者、同文件名、同文件大小且对象可读的"孪生"记录，把孪生对象的字节
 * 复制到当前账号名下的新 key（私有 ACL），再把 DB 记录指过去。
 * 找不到可读孪生的记录列出来人工处理（讲者重新上传，或 Bucket 所有者在控制台修 ACL）。
 */
import { prisma } from "../src/lib/prisma";
import { getSpeakerMaterialStream, uploadToOSS } from "../src/lib/oss";

const dryRun = process.argv.includes("--dry-run");

async function readable(key: string): Promise<boolean> {
  if (!key) return false;
  try {
    const stream = await getSpeakerMaterialStream(key);
    stream.destroy();
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const materials = await prisma.speakerMaterial.findMany({
    select: { id: true, speakerId: true, fileName: true, fileSize: true, mimeType: true, fileKey: true },
  });
  console.log(`共 ${materials.length} 条讲者材料${dryRun ? "（dry-run，不写入）" : ""}`);

  const broken: typeof materials = [];
  for (const m of materials) {
    if (!(await readable(m.fileKey))) broken.push(m);
  }
  if (broken.length === 0) {
    console.log("全部记录的对象均可读，无需修复。");
    return;
  }
  console.log(`对象不可读：${broken.length} 条`);

  const manual: string[] = [];
  for (const m of broken) {
    const twin = materials.find(
      (t) =>
        t.id !== m.id &&
        t.speakerId === m.speakerId &&
        t.fileName === m.fileName &&
        t.fileSize === m.fileSize &&
        t.fileKey &&
        !broken.some((b) => b.id === t.id),
    );
    if (!twin || !(await readable(twin.fileKey))) {
      manual.push(`${m.id} (${m.fileName}) 无可读孪生对象，需讲者重新上传或在 OSS 控制台修复 ACL`);
      continue;
    }

    console.log(`${m.id} 从孪生记录 ${twin.id} 复制字节`);
    if (dryRun) continue;

    const chunks: Buffer[] = [];
    const stream = await getSpeakerMaterialStream(twin.fileKey);
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const { key, url } = await uploadToOSS({
      speakerId: m.speakerId,
      fileName: m.fileName,
      buffer: Buffer.concat(chunks),
      mime: m.mimeType,
    });
    await prisma.speakerMaterial.update({
      where: { id: m.id },
      data: { fileKey: key, fileUrl: url },
    });
    console.log(`  -> 新 key: ${key}`);
  }

  if (manual.length > 0) {
    console.error(`\n以下 ${manual.length} 条需人工处理：`);
    for (const f of manual) console.error(`  - ${f}`);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
