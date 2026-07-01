import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:123456@localhost:5432/huiwu_dev",
  },
});
