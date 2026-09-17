import { defineConfig, env } from "prisma/config";

// The Prisma CLI (migrate/studio/generate) doesn't read .env.local like Next.js does — load the
// CLI-only `.env` file (kept in sync with DATABASE_URL in .env.local) explicitly.
try {
  process.loadEnvFile(".env");
} catch {
  // .env is optional if DATABASE_URL is already set in the environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
