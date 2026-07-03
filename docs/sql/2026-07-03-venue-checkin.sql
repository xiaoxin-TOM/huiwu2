-- 2026-07-03 数据库变更脚本(PostgreSQL 13+)
-- 适用:尚未同步以下两个功能的环境(本地 huiwu_dev 已通过 prisma db push 同步,无需执行)
-- 脚本可重复执行(带 IF NOT EXISTS 保护)
-- 也可不用本脚本,直接在目标环境执行 npm run db:push 由 Prisma 自动对齐

-- ============================================================
-- 一、会场地图功能:SiteConfig 新增会场坐标 4 列
-- ============================================================
ALTER TABLE "SiteConfig"
  ADD COLUMN IF NOT EXISTS "venueName"    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "venueAddress" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "venueLng"     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "venueLat"     TEXT NOT NULL DEFAULT '';

-- 历史遗留清理(可选):isBrief 列早已从 schema 删除,
-- 如果目标库的 Session 表还残留这列,一并删掉
ALTER TABLE "Session" DROP COLUMN IF EXISTS "isBrief";

-- ============================================================
-- 二、报名签到功能(2026-07-02 提交"报名"):目标库若已有可跳过
-- ============================================================
-- 注意:token 用 gen_random_uuid() 先填充存量行再去掉默认值,
-- 因为 Prisma 的 uuid() 是客户端生成,库里不该留 DEFAULT
ALTER TABLE "Registration"
  ADD COLUMN IF NOT EXISTS "checkedIn"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "checkedInAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "token"       TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "Registration" ALTER COLUMN "token" DROP DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS "Registration_token_key" ON "Registration"("token");

-- 签到日志表
CREATE TABLE IF NOT EXISTS "CheckinLog" (
    "id"             TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "checkedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "byUserId"       TEXT,
    "method"         TEXT NOT NULL DEFAULT 'SCAN',
    CONSTRAINT "CheckinLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CheckinLog_registrationId_fkey" FOREIGN KEY ("registrationId")
      REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CheckinLog_registrationId_idx" ON "CheckinLog"("registrationId");
CREATE INDEX IF NOT EXISTS "CheckinLog_checkedAt_idx" ON "CheckinLog"("checkedAt");
