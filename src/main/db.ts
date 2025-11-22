import { Pool } from "pg";
import type {
  Customer,
  CustomersListRequest,
  CustomersSortKey,
} from "../shared/types";

let pool: Pool | null = null;

function maskConnectionString(raw: string) {
  try {
    const url = new URL(raw);
    if (url.password) {
      url.password = "***";
    }
    return url.toString();
  } catch (err) {
    // Fallback to raw string if parsing fails.
    return raw;
  }
}

async function getPool() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_CONNECTION_STRING;

  if (!connectionString) {
    console.error(
      "[db] DATABASE_URL/POSTGRES_URL/POSTGRES_CONNECTION_STRING is not set."
    );
    throw new Error(
      "DATABASE_URL is not set. Provide a Postgres connection string to enable database access."
    );
  }

  if (!pool) {
    console.log("[db] Using connection string:", maskConnectionString(connectionString));
    pool = new Pool({
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

const CUSTOMER_SORT_MAP: Record<CustomersSortKey, string> = {
  fullName: `c."fullName"`,
  phone: `c.phone`,
  region: `r."name"`,
  createdAt: `c."createdAt"`,
  updatedAt: `c."updatedAt"`,
  isActive: `c."isActive"`,
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function listCustomers(
  input: CustomersListRequest = {}
): Promise<{ data: Customer[]; total: number; limit: number; offset: number }> {
  const pool = await getPool();
  const limit = Math.max(
    1,
    Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
  );
  const offset = Math.max(input.offset ?? 0, 0);
  const search = input.search?.trim();
  const sortBy =
    input.sortBy && CUSTOMER_SORT_MAP[input.sortBy]
      ? input.sortBy
      : ("fullName" as const);
  const sortDir = input.sortDir === "desc" ? "desc" : "asc";

  const whereParts: string[] = [];
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    const idx = `$${params.length}`;
    whereParts.push(
      `(c."fullName" ILIKE ${idx} OR c.phone ILIKE ${idx} OR c.address ILIKE ${idx} OR r."name" ILIKE ${idx})`
    );
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
  const sortColumn = CUSTOMER_SORT_MAP[sortBy];
  const orderClause = `ORDER BY ${sortColumn} ${sortDir}, c.id ASC`;

  const dataParams = [...params, limit, offset];
  const dataQuery = `
    SELECT
      c.id,
      c."fullName",
      c.phone,
      c.address,
      c."createdAt",
      c."updatedAt",
      c."rsMember",
      c."receiveDrDiscount",
      c."RegionId" as "regionId",
      r."name" as "regionName",
      c.note,
      c."accountName",
      c."accountNumber",
      c."isActive"
    FROM "Customers" c
    LEFT JOIN "Regions" r ON c."RegionId" = r.id
    ${whereClause}
    ${orderClause}
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS count
    FROM "Customers" c
    LEFT JOIN "Regions" r ON c."RegionId" = r.id
    ${whereClause}
  `;

  const client = await pool.connect();
  try {
    const [dataResult, countResult] = await Promise.all([
      client.query(dataQuery, dataParams),
      client.query(countQuery, params),
    ]);

    const data: Customer[] = dataResult.rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      phone: row.phone ?? null,
      address: row.address ?? null,
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : row.createdAt?.toString?.() ?? "",
      updatedAt:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : row.updatedAt?.toString?.() ?? "",
      rsMember: row.rsMember ?? null,
      receiveDrDiscount: row.receiveDrDiscount ?? null,
      regionId: row.regionId ?? null,
      regionName: row.regionName ?? null,
      note: row.note ?? null,
      accountName: row.accountName ?? null,
      accountNumber: row.accountNumber ?? null,
      isActive: row.isActive ?? null,
    }));

    const total = Number(countResult.rows[0]?.count ?? 0);

    return { data, total, limit, offset };
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
