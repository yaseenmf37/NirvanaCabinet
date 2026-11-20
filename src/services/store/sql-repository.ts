import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/src/db/schema";

export type SqlRepository = ReturnType<typeof drizzle<typeof schema>>;

let pool: Pool | undefined;
let database: SqlRepository | undefined;

export function resolveSqlUrl() {
  return process.env.STAGING_DATABASE_URL || process.env.STAGING_POSTGRES_URL || process.env.SHADOW_DATABASE_URL;
}

/** SQL is opt-in; Production/Preview use the configured STAGING Neon URL. */
export function getSqlRepository(): SqlRepository {
  const url = resolveSqlUrl();
  if (!url) throw new Error("STAGING_DATABASE_URL or STAGING_POSTGRES_URL is required for the SQL repository.");
  if (!database) {
    pool = new Pool({ connectionString: url });
    database = drizzle(pool, { schema });
  }
  return database;
}

export async function closeSqlRepository() {
  if (pool) await pool.end();
  pool = undefined;
  database = undefined;
}
