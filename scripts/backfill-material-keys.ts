/**
 * 讲者材料迁移到私有存储的一次性回填脚本。
 *
 *   npx tsx scripts/backfill-material-keys.ts [--dry-run]
 *
 * 对每条历史 SpeakerMaterial：
 *   1. 从 fileUrl 反推 OSS object key 写入 fileKey
 *   2. status 设为 APPROVED —— 这些资料在本功能上线前就已可访问，
 *      不该因为新增审核流程而突然从页面上消失
 *   3. 把 OSS 对象 ACL 收回为 private，堵掉公网直链
 *
 * 可重复执行：已有 fileKey 的记录跳过第 1、2 步，ACL 收敛是幂等操作。
 */
import { prisma } from "../src/lib/prisma";
import { keyFromPublicUrl, makeObjectPrivate } from "../src/lib/oss";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const materials = await prisma.speakerMaterial.findMany({
    select: { id: true, fileUrl: true, fileKey: true, fileName: true, status: true },
  });
  console.log(`共 ${materials.length} 条讲者材料${dryRun ? "（dry-run，不写入）" : ""}`);

  let filled = 0;
  let aclDone = 0;
  const failures: string[] = [];

  for (const m of materials) {
    const key = m.fileKey || keyFromPublicUrl(m.fileUrl);
    if (!key) {
      failures.push(`${m.id} (${m.fileName}) 无法从 fileUrl 推出 key: ${m.fileUrl}`);
      continue;
    }

    if (!m.fileKey || m.status === "PENDING") {
      if (!dryRun) {
        await prisma.speakerMaterial.update({
          where: { id: m.id },
          data: { fileKey: key, ...(m.fileKey ? {} : { status: "APPROVED" }) },
        });
      }
      filled += 1;
    }

    if (!dryRun) {
      try {
        await makeObjectPrivate(key);
        aclDone += 1;
      } catch (error) {
        failures.push(`${m.id} ACL 收敛失败 (${key}): ${String(error)}`);
      }
    }
  }

  console.log(`回填 fileKey/status: ${filled} 条`);
  console.log(`ACL 已收敛为 private: ${aclDone} 条`);
  if (failures.length > 0) {
    console.error(`\n以下 ${failures.length} 条需人工处理：`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
