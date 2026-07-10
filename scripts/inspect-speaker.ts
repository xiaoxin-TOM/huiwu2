import { prisma } from "@/lib/prisma";

async function main() {
  const columns = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'Speaker'
    ORDER BY ordinal_position
  `;
  console.table(columns);

  const indexes = await prisma.$queryRaw`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'Speaker'
  `;
  console.table(indexes);

  await prisma.$disconnect();
}

main();
