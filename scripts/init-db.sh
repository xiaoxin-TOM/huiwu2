#!/usr/bin/env bash
#
# 会务系统 · 数据库初始化脚本
# ---------------------------------------------------------------
# 作用:在一台已装好 PostgreSQL 的机器上,一键完成
#   1) 创建目标数据库(若不存在)
#   2) 按 Prisma schema 建表(prisma db push)
#   3) 写入种子数据(管理员账号 / 站点配置 / 报名类型 / 样例内容)
#
# 前置条件:
#   - 已安装 Node.js 20+ 并在项目根目录执行过  npm install
#   - 已安装 psql 客户端,且目标 PostgreSQL 正在运行、可连接
#   - 已在项目根目录准备好 .env,内含 DATABASE_URL(见 .env.example)
#
# 用法(项目根目录执行):
#   bash scripts/init-db.sh
#
# 说明:脚本从 .env 的 DATABASE_URL 解析连接信息;创建库时会用同一
#       账号连接到维护库(默认 postgres)。若你的库已由 DBA 建好,
#       创建步骤失败会被忽略,继续建表与种子。
set -euo pipefail

cd "$(dirname "$0")/.."

# ---- 读取 DATABASE_URL ----
if [ -f .env ]; then
  # 仅取 DATABASE_URL 一行,去掉引号
  DB_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
fi
DB_URL="${DATABASE_URL:-${DB_URL:-}}"
if [ -z "${DB_URL:-}" ]; then
  echo "✗ 未找到 DATABASE_URL(请在 .env 中设置,或 export DATABASE_URL)"; exit 1
fi

# ---- 解析 postgresql://user:pass@host:port/dbname ----
proto_removed="${DB_URL#*://}"
creds="${proto_removed%%@*}"
hostportdb="${proto_removed#*@}"
DB_USER="${creds%%:*}"
DB_PASS="${creds#*:}"
hostport="${hostportdb%%/*}"
DB_NAME="${hostportdb##*/}"; DB_NAME="${DB_NAME%%\?*}"   # 去掉 ?sslmode= 等查询串
DB_HOST="${hostport%%:*}"
DB_PORT="${hostport#*:}"; [ "$DB_PORT" = "$DB_HOST" ] && DB_PORT=5432

echo "→ 目标数据库:$DB_NAME  @ $DB_HOST:$DB_PORT  (用户 $DB_USER)"

export PGPASSWORD="$DB_PASS"

# ---- 1) 创建数据库(若不存在)----
echo "→ [1/3] 创建数据库(若不存在)…"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc \
     "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  echo "  数据库 $DB_NAME 已存在,跳过创建。"
else
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";" \
    && echo "  已创建 $DB_NAME。" \
    || echo "  ! 创建失败(可能无权限)。若库已由 DBA 建好可忽略。"
fi

# ---- 2) 建表 ----
echo "→ [2/3] 建表(prisma db push)…"
npm run db:push

# ---- 3) 种子数据 ----
echo "→ [3/3] 写入种子数据…"
npm run db:seed

echo ""
echo "✓ 初始化完成。默认管理员:admin@conf.local / admin123(请尽快在后台改密码或角色)"
echo "  启动开发:npm run dev   |   生产:npm run build && npm run start"
