import { Pool } from "pg";
import type {
  Customer,
  CustomersListRequest,
  CustomersSortKey,
  CustomersOverview,
  RegionCount,
  Product,
  ProductsListRequest,
  ProductsSortKey,
  ProductsOverview,
  TopItem,
  TrendPoint,
  ProductDetail,
  ProductTrendPoint,
  StockMovement,
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

export async function getCustomersOverview(): Promise<CustomersOverview> {
  const pool = await getPool();
  const client = await pool.connect();

  const summaryQuery = `
    SELECT
      (SELECT COUNT(*) FROM "Customers")::int AS total,
      (SELECT COUNT(*) FROM "Customers" WHERE "isActive" = true)::int AS active,
      (SELECT COUNT(*) FROM "Customers" WHERE "isActive" = false)::int AS inactive,
      (SELECT COUNT(*) FROM "Customers" WHERE "rsMember" = true)::int AS "rsMember",
      (SELECT COUNT(*) FROM "Customers" WHERE "receiveDrDiscount" = true)::int AS "receiveDrDiscount",
      (
        SELECT COUNT(DISTINCT i."CustomerId")
        FROM "Invoices" i
        WHERE i."CustomerId" IS NOT NULL
          AND i.date >= (CURRENT_DATE - INTERVAL '30 days')
      )::int AS "withInvoices30d",
      (
        SELECT MAX(i.date)
        FROM "Invoices" i
        WHERE i."CustomerId" IS NOT NULL
      ) AS "lastInvoiceDate"
  `;

  const topRegionsQuery = `
    SELECT
      COALESCE(r."name", 'Unspecified') AS "regionName",
      COUNT(*)::int AS count
    FROM "Customers" c
    LEFT JOIN "Regions" r ON c."RegionId" = r.id
    GROUP BY r."name"
    ORDER BY count DESC, "regionName" ASC
    LIMIT 5
  `;

  try {
    const [summaryResult, topRegionsResult] = await Promise.all([
      client.query(summaryQuery),
      client.query(topRegionsQuery),
    ]);

    const summaryRow = summaryResult.rows[0] ?? {};
    const overview: CustomersOverview = {
      total: Number(summaryRow.total ?? 0),
      active: Number(summaryRow.active ?? 0),
      inactive: Number(summaryRow.inactive ?? 0),
      rsMember: Number(summaryRow.rsMember ?? 0),
      receiveDrDiscount: Number(summaryRow.receiveDrDiscount ?? 0),
      withInvoices30d: Number(summaryRow.withInvoices30d ?? 0),
      lastInvoiceDate:
        summaryRow.lastInvoiceDate instanceof Date
          ? summaryRow.lastInvoiceDate.toISOString()
          : summaryRow.lastInvoiceDate ?? null,
      topRegions: topRegionsResult.rows.map(
        (row): RegionCount => ({
          regionName: row.regionName ?? "Unspecified",
          count: Number(row.count ?? 0),
        })
      ),
    };

    return overview;
  } finally {
    client.release();
  }
}

export async function getCustomerDetail(id: number): Promise<CustomerDetail> {
  const pool = await getPool();
  const client = await pool.connect();

  const customerQuery = `
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
    WHERE c.id = $1
    LIMIT 1
  `;

  const invoiceQuery = `
    SELECT COUNT(*)::int AS count, MAX(date) AS "lastDate"
    FROM "Invoices"
    WHERE "CustomerId" = $1
  `;

  const deliveryQuery = `
    SELECT COUNT(*)::int AS count, MAX(date) AS "lastDate"
    FROM "Deliveries"
    WHERE "CustomerId" = $1
  `;

  const invoiceTrendQuery = `
    WITH series AS (
      SELECT date_trunc('month', CURRENT_DATE) - (interval '1 month' * generate_series(0, 5)) AS month
    )
    SELECT
      to_char(series.month, 'Mon YYYY') AS label,
      COALESCE(COUNT(i.*), 0)::int AS count
    FROM series
    LEFT JOIN "Invoices" i
      ON i."CustomerId" = $1
      AND date_trunc('month', i.date) = series.month
    GROUP BY series.month
    ORDER BY series.month;
  `;

  const deliveryTrendQuery = `
    WITH series AS (
      SELECT date_trunc('month', CURRENT_DATE) - (interval '1 month' * generate_series(0, 5)) AS month
    )
    SELECT
      to_char(series.month, 'Mon YYYY') AS label,
      COALESCE(COUNT(d.*), 0)::int AS count
    FROM series
    LEFT JOIN "Deliveries" d
      ON d."CustomerId" = $1
      AND date_trunc('month', d.date) = series.month
    GROUP BY series.month
    ORDER BY series.month;
  `;

  const spendTrendQuery = `
    WITH series AS (
      SELECT date_trunc('month', CURRENT_DATE) - (interval '1 month' * generate_series(0, 5)) AS month
    )
    SELECT
      to_char(series.month, 'Mon YYYY') AS label,
      COALESCE(SUM(dd.price * dd.qty), 0)::numeric AS amount
    FROM series
    LEFT JOIN "Deliveries" d
      ON d."CustomerId" = $1
      AND date_trunc('month', d.date) = series.month
    LEFT JOIN "DeliveryDetails" dd ON dd."DeliveryId" = d.id
    GROUP BY series.month
    ORDER BY series.month;
  `;

  const categoryBreakdownQuery = `
    SELECT
      COALESCE(pc."name", 'Uncategorized') AS label,
      COALESCE(SUM(dd.price * dd.qty), 0)::numeric AS amount
    FROM "Deliveries" d
    JOIN "DeliveryDetails" dd ON dd."DeliveryId" = d.id
    LEFT JOIN "Products" p ON dd."ProductId" = p.id
    LEFT JOIN "ProductCategories" pc ON p."ProductCategoryId" = pc.id
    WHERE d."CustomerId" = $1
    GROUP BY pc."name"
    ORDER BY amount DESC, label ASC
    LIMIT 6
  `;

  const orderBucketsQuery = `
    WITH order_totals AS (
      SELECT
        d.id,
        COALESCE(SUM(dd.price * dd.qty), 0)::numeric AS total
      FROM "Deliveries" d
      LEFT JOIN "DeliveryDetails" dd ON dd."DeliveryId" = d.id
      WHERE d."CustomerId" = $1
      GROUP BY d.id
    )
    , bucketized AS (
      SELECT
        CASE
          WHEN total < 100000 THEN '< 100k'
          WHEN total < 500000 THEN '100k - 500k'
          WHEN total < 1000000 THEN '500k - 1M'
          ELSE '> 1M'
        END AS label
      FROM order_totals
    )
    SELECT
      label,
      COUNT(*)::int AS count
    FROM bucketized
    GROUP BY label
    ORDER BY
      CASE
        WHEN label = '< 100k' THEN 1
        WHEN label = '100k - 500k' THEN 2
        WHEN label = '500k - 1M' THEN 3
        ELSE 4
      END;
  `;

  try {
    const [
      customerResult,
      invoiceResult,
      deliveryResult,
      invoiceTrendResult,
      deliveryTrendResult,
      spendTrendResult,
      categoryBreakdownResult,
      orderBucketsResult,
    ] = await Promise.all([
      client.query(customerQuery, [id]),
      client.query(invoiceQuery, [id]),
      client.query(deliveryQuery, [id]),
      client.query(invoiceTrendQuery, [id]),
      client.query(deliveryTrendQuery, [id]),
      client.query(spendTrendQuery, [id]),
      client.query(categoryBreakdownQuery, [id]),
      client.query(orderBucketsQuery, [id]),
    ]);

    if (customerResult.rows.length === 0) {
      throw new Error("Customer not found");
    }

    const c = customerResult.rows[0];

    const customer: Customer = {
      id: c.id,
      fullName: c.fullName,
      phone: c.phone ?? null,
      address: c.address ?? null,
      createdAt:
        c.createdAt instanceof Date
          ? c.createdAt.toISOString()
          : c.createdAt?.toString?.() ?? "",
      updatedAt:
        c.updatedAt instanceof Date
          ? c.updatedAt.toISOString()
          : c.updatedAt?.toString?.() ?? "",
      rsMember: c.rsMember ?? null,
      receiveDrDiscount: c.receiveDrDiscount ?? null,
      regionId: c.regionId ?? null,
      regionName: c.regionName ?? null,
      note: c.note ?? null,
      accountName: c.accountName ?? null,
      accountNumber: c.accountNumber ?? null,
      isActive: c.isActive ?? null,
    };

    const inv = invoiceResult.rows[0] ?? {};
    const del = deliveryResult.rows[0] ?? {};

    const lastInvoiceDate =
      inv.lastDate instanceof Date ? inv.lastDate.toISOString() : inv.lastDate ?? null;
    const lastDeliveryDate =
      del.lastDate instanceof Date ? del.lastDate.toISOString() : del.lastDate ?? null;
    const lastActivityDate = [lastInvoiceDate, lastDeliveryDate]
      .filter(Boolean)
      .map((d) => new Date(d as string).getTime())
      .reduce<number | null>((max, ts) => {
        if (Number.isNaN(ts)) return max;
        return max === null ? ts : Math.max(max, ts);
      }, null);

    const invoiceTrend: TrendPoint[] = invoiceTrendResult.rows.map((row) => ({
      label: row.label,
      count: Number(row.count ?? 0),
    }));
    const deliveryTrend: TrendPoint[] = deliveryTrendResult.rows.map((row) => ({
      label: row.label,
      count: Number(row.count ?? 0),
    }));
    const spendTrend: TrendAmountPoint[] = spendTrendResult.rows.map((row) => ({
      label: row.label,
      amount: Number(row.amount ?? 0),
    }));
    const categoryBreakdown: CategorySlice[] = categoryBreakdownResult.rows.map(
      (row) => ({
        label: row.label ?? "Uncategorized",
        amount: Number(row.amount ?? 0),
      })
    );
    const orderValueBuckets: BucketSlice[] = orderBucketsResult.rows.map(
      (row) => ({
        label: row.label,
        count: Number(row.count ?? 0),
      })
    );

    const monetary = spendTrend.reduce((sum, item) => sum + item.amount, 0);
    const recencyDays = lastDeliveryDate
      ? Math.floor(
          (Date.now() - new Date(lastDeliveryDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      customer,
      invoiceCount: Number(inv.count ?? 0),
      deliveryCount: Number(del.count ?? 0),
      lastInvoiceDate,
      lastDeliveryDate,
      lastActivityDate: lastActivityDate ? new Date(lastActivityDate).toISOString() : null,
      invoiceTrend,
      deliveryTrend,
      spendTrend,
      categoryBreakdown,
      orderValueBuckets,
      rfm: {
        recencyDays,
        frequency: Number(del.count ?? 0),
        monetary,
      },
    };
  } finally {
    client.release();
  }
}

const PRODUCT_SORT_MAP: Record<ProductsSortKey, string> = {
  name: `p."name"`,
  price: `p.price`,
  cost: `p.cost`,
  category: `pc."name"`,
  supplier: `s."name"`,
  createdAt: `p."createdAt"`,
  updatedAt: `p."updatedAt"`,
  isActive: `p."isActive"`,
};

export async function listProducts(
  input: ProductsListRequest = {}
): Promise<{ data: Product[]; total: number; limit: number; offset: number }> {
  const pool = await getPool();
  const limit = Math.max(
    1,
    Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
  );
  const offset = Math.max(input.offset ?? 0, 0);
  const search = input.search?.trim();
  const sortBy =
    input.sortBy && PRODUCT_SORT_MAP[input.sortBy]
      ? input.sortBy
      : ("updatedAt" as const);
  const sortDir = input.sortDir === "desc" ? "desc" : "asc";

  const whereParts: string[] = [];
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    const idx = `$${params.length}`;
    whereParts.push(
      `(p."name" ILIKE ${idx} OR pc."name" ILIKE ${idx} OR s."name" ILIKE ${idx})`
    );
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
  const sortColumn = PRODUCT_SORT_MAP[sortBy];
  const orderClause = `ORDER BY ${sortColumn} ${sortDir}, p.id ASC`;

  const dataParams = [...params, limit, offset];
  const dataQuery = `
    SELECT
      p.id,
      p."name",
      p.price,
      p."resellerPrice",
      p.cost,
      p.unit,
      p."ProductCategoryId" as "categoryId",
      pc."name" as "categoryName",
      p."SupplierId" as "supplierId",
      s."name" as "supplierName",
      p."keepStockSince",
      p."restockNumber",
      p."isActive",
      p."createdAt",
      p."updatedAt"
    FROM "Products" p
    LEFT JOIN "ProductCategories" pc ON p."ProductCategoryId" = pc.id
    LEFT JOIN "Suppliers" s ON p."SupplierId" = s.id
    ${whereClause}
    ${orderClause}
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS count
    FROM "Products" p
    LEFT JOIN "ProductCategories" pc ON p."ProductCategoryId" = pc.id
    LEFT JOIN "Suppliers" s ON p."SupplierId" = s.id
    ${whereClause}
  `;

  const client = await pool.connect();
  try {
    const [dataResult, countResult] = await Promise.all([
      client.query(dataQuery, dataParams),
      client.query(countQuery, params),
    ]);

    const data: Product[] = dataResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price ?? 0),
      resellerPrice: row.resellerPrice !== null ? Number(row.resellerPrice) : null,
      cost: Number(row.cost ?? 0),
      unit: row.unit ?? "",
      categoryId: row.categoryId ?? null,
      categoryName: row.categoryName ?? null,
      supplierId: row.supplierId ?? null,
      supplierName: row.supplierName ?? null,
      keepStockSince:
        row.keepStockSince instanceof Date
          ? row.keepStockSince.toISOString()
          : row.keepStockSince ?? null,
      restockNumber: row.restockNumber !== null ? Number(row.restockNumber) : null,
      isActive: row.isActive ?? null,
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : row.createdAt?.toString?.() ?? "",
      updatedAt:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : row.updatedAt?.toString?.() ?? "",
    }));

    const total = Number(countResult.rows[0]?.count ?? 0);

    return { data, total, limit, offset };
  } finally {
    client.release();
  }
}

export async function getProductDetail(id: number): Promise<ProductDetail> {
  const pool = await getPool();
  const client = await pool.connect();

  const productQuery = `
    SELECT
      p.id,
      p."name",
      p.price,
      p."resellerPrice",
      p.cost,
      p.unit,
      p."ProductCategoryId" as "categoryId",
      pc."name" as "categoryName",
      p."SupplierId" as "supplierId",
      s."name" as "supplierName",
      p."keepStockSince",
      p."restockNumber",
      p."isActive",
      p."createdAt",
      p."updatedAt"
    FROM "Products" p
    LEFT JOIN "ProductCategories" pc ON p."ProductCategoryId" = pc.id
    LEFT JOIN "Suppliers" s ON p."SupplierId" = s.id
    WHERE p.id = $1
  `;

  const summaryQuery = `
    SELECT
      (
        SELECT COALESCE(SUM(dd.qty), 0)::numeric
        FROM "DeliveryDetails" dd
        WHERE dd."ProductId" = $1
      ) AS "soldQty",
      (
        SELECT COALESCE(SUM(dd.price * dd.qty), 0)::numeric
        FROM "DeliveryDetails" dd
        WHERE dd."ProductId" = $1
      ) AS revenue,
      (
        SELECT COALESCE(SUM(dd.cost * dd.qty), 0)::numeric
        FROM "DeliveryDetails" dd
        WHERE dd."ProductId" = $1
      ) AS cogs,
      (
        SELECT COALESCE(SUM(pd.qty), 0)::numeric
        FROM "PurchaseDetails" pd
        WHERE pd."ProductId" = $1
      ) AS "purchasedQty",
      (
        SELECT MAX(COALESCE(d.date, dd."createdAt"))
        FROM "DeliveryDetails" dd
        LEFT JOIN "Deliveries" d ON dd."DeliveryId" = d.id
        WHERE dd."ProductId" = $1
      ) AS "lastSaleDate",
      (
        SELECT MAX(COALESCE(pu.date, pd."createdAt"))
        FROM "PurchaseDetails" pd
        LEFT JOIN "Purchases" pu ON pd."PurchaseId" = pu.id
        WHERE pd."ProductId" = $1
      ) AS "lastPurchaseDate"
  `;

  const salesTrendQuery = `
    WITH months AS (
      SELECT date_trunc('month', CURRENT_DATE) - (INTERVAL '1 month' * g) AS month_start
      FROM generate_series(0, 5) AS g
    ),
    deliveries AS (
      SELECT
        dd.qty,
        dd.price,
        date_trunc('month', COALESCE(d.date, dd."createdAt")) AS month_start
      FROM "DeliveryDetails" dd
      LEFT JOIN "Deliveries" d ON dd."DeliveryId" = d.id
      WHERE dd."ProductId" = $1
    )
    SELECT
      to_char(m.month_start, 'Mon YYYY') AS label,
      COALESCE(SUM(dd.qty), 0)::numeric AS qty,
      COALESCE(SUM(dd.price * dd.qty), 0)::numeric AS amount
    FROM months m
    LEFT JOIN deliveries dd
      ON dd.month_start = m.month_start
    GROUP BY m.month_start
    ORDER BY m.month_start ASC
  `;

  const purchaseTrendQuery = `
    WITH months AS (
      SELECT date_trunc('month', CURRENT_DATE) - (INTERVAL '1 month' * g) AS month_start
      FROM generate_series(0, 5) AS g
    ),
    purchases AS (
      SELECT
        pd.qty,
        pd.price,
        date_trunc('month', COALESCE(pu.date, pd."createdAt")) AS month_start
      FROM "PurchaseDetails" pd
      LEFT JOIN "Purchases" pu ON pd."PurchaseId" = pu.id
      WHERE pd."ProductId" = $1
    )
    SELECT
      to_char(m.month_start, 'Mon YYYY') AS label,
      COALESCE(SUM(pd.qty), 0)::numeric AS qty,
      COALESCE(SUM(pd.price * pd.qty), 0)::numeric AS amount
    FROM months m
    LEFT JOIN purchases pd
      ON pd.month_start = m.month_start
    GROUP BY m.month_start
    ORDER BY m.month_start ASC
  `;

  const stockMovementsQuery = `
    (
      SELECT
        COALESCE(d.date, dd."createdAt") AS date,
        'delivery'::text AS kind,
        -dd.qty::numeric AS qty,
        d.note AS description,
        CONCAT('Delivery #', d.id) AS ref
      FROM "DeliveryDetails" dd
      LEFT JOIN "Deliveries" d ON dd."DeliveryId" = d.id
      WHERE dd."ProductId" = $1
    )
    UNION ALL
    (
      SELECT
        COALESCE(pu.date, pd."createdAt") AS date,
        'purchase'::text AS kind,
        pd.qty::numeric AS qty,
        pu.note AS description,
        CONCAT('Purchase #', pu.id) AS ref
      FROM "PurchaseDetails" pd
      LEFT JOIN "Purchases" pu ON pd."PurchaseId" = pu.id
      WHERE pd."ProductId" = $1
    )
    UNION ALL
    (
      SELECT
        sa.date::timestamp AS date,
        'adjustment'::text AS kind,
        sa.amount::numeric AS qty,
        sa.description AS description,
        NULL AS ref
      FROM "StockAdjustments" sa
      WHERE sa."ProductId" = $1
    )
    UNION ALL
    (
      SELECT
        sm.date,
        'match'::text AS kind,
        sm.qty::numeric AS qty,
        sm.description AS description,
        NULL AS ref
      FROM "StockMatches" sm
      WHERE sm."ProductId" = $1
    )
    UNION ALL
    (
      SELECT
        dr.date::timestamp AS date,
        'draw'::text AS kind,
        -dr.amount::numeric AS qty,
        dr.description AS description,
        NULL AS ref
      FROM "Draws" dr
      WHERE dr."ProductId" = $1
    )
    ORDER BY date DESC
    LIMIT 20
  `;

  const stockBalanceQuery = `
    SELECT
      COALESCE((
        SELECT SUM(pd.qty)
        FROM "PurchaseDetails" pd
        LEFT JOIN "Purchases" pu ON pd."PurchaseId" = pu.id
        WHERE pd."ProductId" = $1
          AND ($2::date IS NULL OR pu.date >= $2::date)
      ), 0)::numeric AS purchases,
      COALESCE((
        SELECT SUM(dd.qty)
        FROM "DeliveryDetails" dd
        LEFT JOIN "Deliveries" d ON dd."DeliveryId" = d.id
        WHERE dd."ProductId" = $1
          AND ($2::date IS NULL OR d.date >= $2::date)
      ), 0)::numeric AS deliveries,
      COALESCE((
        SELECT SUM(sa.amount)
        FROM "StockAdjustments" sa
        WHERE sa."ProductId" = $1
          AND ($2::date IS NULL OR sa.date >= $2::date)
      ), 0)::numeric AS adjustments,
      COALESCE((
        SELECT SUM(dr.amount)
        FROM "Draws" dr
        WHERE dr."ProductId" = $1
          AND ($2::date IS NULL OR dr.date >= $2::date)
      ), 0)::numeric AS draws
  `;

  const latestStockMatchQuery = `
    SELECT
      sm.date,
      sm.qty,
      sm.description
    FROM "StockMatches" sm
    WHERE sm."ProductId" = $1
    ORDER BY sm.date DESC
    LIMIT 1
  `;

  const topCustomersQuery = `
    SELECT
      COALESCE(c."fullName", 'Unknown') AS label,
      COALESCE(SUM(dd.qty), 0)::numeric AS value
    FROM "DeliveryDetails" dd
    JOIN "Deliveries" d ON dd."DeliveryId" = d.id
    LEFT JOIN "Customers" c ON d."CustomerId" = c.id
    WHERE dd."ProductId" = $1
    GROUP BY c."fullName"
    ORDER BY value DESC, label ASC
    LIMIT 5
  `;

  try {
    const productResult = await client.query(productQuery, [id]);
    const productRow = productResult.rows[0];
    if (!productRow) {
      throw new Error("Product not found");
    }

    const toDateString = (value: unknown) =>
      value instanceof Date
        ? value.toISOString()
        : value?.toString?.() ?? null;

    const product: Product = {
      id: productRow.id,
      name: productRow.name,
      price: Number(productRow.price ?? 0),
      resellerPrice:
        productRow.resellerPrice !== null
          ? Number(productRow.resellerPrice)
          : null,
      cost: Number(productRow.cost ?? 0),
      unit: productRow.unit ?? "",
      categoryId: productRow.categoryId ?? null,
      categoryName: productRow.categoryName ?? null,
      supplierId: productRow.supplierId ?? null,
      supplierName: productRow.supplierName ?? null,
      keepStockSince: toDateString(productRow.keepStockSince),
      restockNumber:
        productRow.restockNumber !== null
          ? Number(productRow.restockNumber)
          : null,
      isActive: productRow.isActive ?? null,
      createdAt: toDateString(productRow.createdAt) ?? "",
      updatedAt: toDateString(productRow.updatedAt) ?? "",
    };

    const sinceDate =
      product.keepStockSince && typeof product.keepStockSince === "string"
        ? product.keepStockSince
        : null;

    const [summaryResult, salesTrendResult, purchaseTrendResult, stockMovesResult, topCustomersResult, stockBalanceResult, latestMatchResult] =
      await Promise.all([
        client.query(summaryQuery, [id]),
        client.query(salesTrendQuery, [id]),
        client.query(purchaseTrendQuery, [id]),
        client.query(stockMovementsQuery, [id]),
        client.query(topCustomersQuery, [id]),
        client.query(stockBalanceQuery, [id, sinceDate]),
        client.query(latestStockMatchQuery, [id]),
      ]);

    const summaryRow = summaryResult.rows[0] ?? {};

    const salesTrend: ProductTrendPoint[] = salesTrendResult.rows.map(
      (row) => ({
        label: row.label ?? "",
        qty: Number(row.qty ?? 0),
        amount: Number(row.amount ?? 0),
      })
    );

    const purchaseTrend: ProductTrendPoint[] = purchaseTrendResult.rows.map(
      (row) => ({
        label: row.label ?? "",
        qty: Number(row.qty ?? 0),
        amount: Number(row.amount ?? 0),
      })
    );

    const stockMovements: StockMovement[] = stockMovesResult.rows.map(
      (row) => ({
        date: toDateString(row.date) ?? "",
        kind: row.kind,
        qty: Number(row.qty ?? 0),
        description: row.description ?? null,
        ref: row.ref ?? null,
      })
    );

    const topCustomers: TopItem[] = topCustomersResult.rows.map((row) => ({
      label: row.label ?? "Unknown",
      value: Number(row.value ?? 0),
    }));

    const balanceRow = stockBalanceResult.rows[0] ?? {};
    const currentStock =
      Number(balanceRow.purchases ?? 0) -
      Number(balanceRow.deliveries ?? 0) +
      Number(balanceRow.adjustments ?? 0) -
      Number(balanceRow.draws ?? 0);

    const latestMatchRow = latestMatchResult.rows[0] ?? null;
    const latestStockMatch = latestMatchRow
      ? {
          date: toDateString(latestMatchRow.date),
          qty: latestMatchRow.qty !== null ? Number(latestMatchRow.qty) : null,
          description: latestMatchRow.description ?? null,
        }
      : null;

    const totals = {
      soldQty: Number(summaryRow.soldQty ?? 0),
      purchasedQty: Number(summaryRow.purchasedQty ?? 0),
      revenue: Number(summaryRow.revenue ?? 0),
      cogs: Number(summaryRow.cogs ?? 0),
      margin: Number(summaryRow.revenue ?? 0) - Number(summaryRow.cogs ?? 0),
      lastSaleDate: toDateString(summaryRow.lastSaleDate),
      lastPurchaseDate: toDateString(summaryRow.lastPurchaseDate),
      currentStock,
    };

    return {
      product,
      totals,
      salesTrend,
      purchaseTrend,
      stockMovements,
      topCustomers,
      latestStockMatch,
    };
  } finally {
    client.release();
  }
}

export async function getProductsOverview(): Promise<ProductsOverview> {
  const pool = await getPool();
  const client = await pool.connect();

  const summaryQuery = `
    SELECT
      (SELECT COUNT(*) FROM "Products")::int AS total,
      (SELECT COUNT(*) FROM "Products" WHERE "isActive" = true)::int AS active,
      (SELECT COUNT(*) FROM "Products" WHERE "isActive" = false)::int AS inactive,
      (SELECT COUNT(DISTINCT "ProductCategoryId") FROM "Products")::int AS categories,
      (SELECT COUNT(DISTINCT "SupplierId") FROM "Products")::int AS suppliers,
      (
        SELECT COALESCE(SUM(dd.qty), 0)
        FROM "DeliveryDetails" dd
        WHERE dd."ProductId" IS NOT NULL
          AND dd."createdAt" >= (CURRENT_DATE - INTERVAL '30 days')
      )::numeric AS sold30d,
      (
        SELECT COALESCE(SUM(pd.qty), 0)
        FROM "PurchaseDetails" pd
        WHERE pd."ProductId" IS NOT NULL
          AND pd."createdAt" >= (CURRENT_DATE - INTERVAL '30 days')
      )::numeric AS purchased30d,
      (
        SELECT MAX(dd."createdAt")
        FROM "DeliveryDetails" dd
        WHERE dd."ProductId" IS NOT NULL
      ) AS "lastSaleDate",
      (
        SELECT MAX(pd."createdAt")
        FROM "PurchaseDetails" pd
        WHERE pd."ProductId" IS NOT NULL
      ) AS "lastPurchaseDate"
  `;

  const topCategoriesQuery = `
    SELECT
      COALESCE(pc."name", 'Uncategorized') AS label,
      COUNT(*)::int AS value
    FROM "Products" p
    LEFT JOIN "ProductCategories" pc ON p."ProductCategoryId" = pc.id
    GROUP BY pc."name"
    ORDER BY value DESC, label ASC
    LIMIT 5
  `;

  const topSuppliersQuery = `
    SELECT
      COALESCE(s."name", 'Unspecified') AS label,
      COUNT(*)::int AS value
    FROM "Products" p
    LEFT JOIN "Suppliers" s ON p."SupplierId" = s.id
    GROUP BY s."name"
    ORDER BY value DESC, label ASC
    LIMIT 5
  `;

  const topSellersQuery = `
    SELECT
      p."name" AS label,
      COALESCE(SUM(dd.qty), 0)::numeric AS value
    FROM "DeliveryDetails" dd
    JOIN "Products" p ON dd."ProductId" = p.id
    WHERE dd."createdAt" >= (CURRENT_DATE - INTERVAL '30 days')
    GROUP BY p."name"
    ORDER BY value DESC, label ASC
    LIMIT 5
  `;

  try {
    const [summaryResult, catResult, supResult, sellerResult] =
      await Promise.all([
        client.query(summaryQuery),
        client.query(topCategoriesQuery),
        client.query(topSuppliersQuery),
        client.query(topSellersQuery),
      ]);

    const summaryRow = summaryResult.rows[0] ?? {};
    const toNumber = (v: unknown) => Number(v ?? 0);

    const overview: ProductsOverview = {
      total: toNumber(summaryRow.total),
      active: toNumber(summaryRow.active),
      inactive: toNumber(summaryRow.inactive),
      categories: toNumber(summaryRow.categories),
      suppliers: toNumber(summaryRow.suppliers),
      purchased30d: Number(summaryRow.purchased30d ?? 0),
      sold30d: Number(summaryRow.sold30d ?? 0),
      lastPurchaseDate:
        summaryRow.lastPurchaseDate instanceof Date
          ? summaryRow.lastPurchaseDate.toISOString()
          : summaryRow.lastPurchaseDate ?? null,
      lastSaleDate:
        summaryRow.lastSaleDate instanceof Date
          ? summaryRow.lastSaleDate.toISOString()
          : summaryRow.lastSaleDate ?? null,
      topCategories: catResult.rows.map(
        (row): TopItem => ({
          label: row.label ?? "Uncategorized",
          value: Number(row.value ?? 0),
        })
      ),
      topSuppliers: supResult.rows.map(
        (row): TopItem => ({
          label: row.label ?? "Unspecified",
          value: Number(row.value ?? 0),
        })
      ),
      topSellers30d: sellerResult.rows.map(
        (row): TopItem => ({
          label: row.label ?? "Unknown",
          value: Number(row.value ?? 0),
        })
      ),
    };

    return overview;
  } finally {
    client.release();
  }
}
