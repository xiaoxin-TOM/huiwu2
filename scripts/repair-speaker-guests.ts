/**
 * 补齐讲者缺失的嘉宾记录。
 *
 *   npx tsx scripts/repair-speaker-guests.ts --dry-run   # 只报告不写入
 *   npx tsx scripts/repair-speaker-guests.ts             # 实际补齐
 *   npx tsx scripts/repair-speaker-guests.ts <meetingId> # 只处理指定会议
 *
 * 背景：历史版本里「创建讲者」与「创建嘉宾」是两次独立写入且不在事务内，
 * 嘉宾那步失败会留下没有嘉宾记录的孤儿讲者，表现为讲者在嘉宾管理与接待管理
 * 里查无此人。本脚本按「同会议同名」判定，只为确实没有任何同名嘉宾的讲者补建，
 * 幂等，可重复执行。
 */
import { prisma } from "../src/lib/prisma";
import { findSpeakersMissingGuest, repairSpeakerGuests, countLegacyNoteGuests } from "../src/lib/speaker-guest-repair";

const dryRun = process.argv.includes("--dry-run");
const meetingId = process.argv.slice(2).find((a) => !a.startsWith("--"));

async function main() {
  const scope = meetingId ? `会议 ${meetingId}` : "全部会议";
  console.log(`扫描范围：${scope}${dryRun ? "（dry-run，不写入）" : ""}`);

  const legacy = await countLegacyNoteGuests();
  if (legacy > 0) {
    console.log(`提示：有 ${legacy} 条嘉宾记录使用了历史备注文案，认领逻辑已兼容，无需处理。`);
  }

  const missing = await findSpeakersMissingGuest(meetingId);
  if (missing.length === 0) {
    console.log("没有发现缺失嘉宾记录的讲者。");
    return;
  }

  console.log(`\n发现 ${missing.length} 位讲者在嘉宾管理中没有记录：`);
  for (const s of missing) {
    console.log(`  - ${s.name}（${s.organization || "无单位"}）会议 ${s.meetingId} 已认证=${s.confirmed}`);
  }

  if (dryRun) {
    console.log("\ndry-run 结束，未写入任何数据。去掉 --dry-run 即可补齐。");
    return;
  }

  const result = await repairSpeakerGuests(meetingId);
  console.log(`\n已补建 ${result.created} 条嘉宾记录。请到嘉宾管理与接待管理确认。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
