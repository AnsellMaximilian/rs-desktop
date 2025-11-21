import type { Pool } from "pg";

let pool: Pool | null = null;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_CONNECTION_STRING;

async function loadPoolCtor() {
  const mod = await import("pg");
  return mod.Pool;
}

async function getPool() {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Provide a Postgres connection string to enable database access."
    );
  }

  if (!pool) {
    const PoolCtor = await loadPoolCtor();
    pool = new PoolCtor({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  }

  return pool;
}

export async function pingDatabase() {
  const client = await (await getPool()).connect();
  try {
    const { rows } = await client.query(
      "select now() as now, current_database() as database"
    );
    const row = rows[0];
    const now =
      row?.now instanceof Date
        ? row.now.toISOString()
        : row?.now?.toString?.() ?? new Date().toISOString();

    return {
      ok: true as const,
      now,
      database: row?.database ?? null,
    };
  } finally {
    client.release();
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
