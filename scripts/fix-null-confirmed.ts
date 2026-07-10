import { prisma } from "@/lib/prisma";

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "Speaker"
    SET confirmed = false
    WHERE confirmed IS NULL
  `;
  console.log(`Updated ${result} speakers with confirmed = null to false`);
  await prisma.$disconnect();
}

main();
