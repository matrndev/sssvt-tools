import "server-only";

import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  timetablePool?: Pool;
};

export function getPool(): Pool {
  if (globalForDb.timetablePool) return globalForDb.timetablePool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");

  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 8_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 10_000,
  });

  // Idle connections can fail independently of a query. Do not log credentials.
  pool.on("error", () => console.error("PostgreSQL idle connection failed."));
  globalForDb.timetablePool = pool;
  return pool;
}
