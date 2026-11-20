import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Production/Preview Neon credentials are injected as STAGING_DATABASE_URL.
    // Keep SHADOW_DATABASE_URL only as an explicit local fallback.
    url: process.env.STAGING_DATABASE_URL ?? process.env.STAGING_POSTGRES_URL ?? process.env.SHADOW_DATABASE_URL ?? "postgresql://database-not-configured",
  },
  strict: true,
  verbose: true,
});
