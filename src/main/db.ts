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

  const purchaseQuery = `
    SELECT COUNT(*)::int AS count, MAX("createdAt") AS "lastDate"
    FROM "PurchaseDetails"
    WHERE "CustomerId" = $1
  `;

  try {
    const [customerResult, invoiceResult, deliveryResult, purchaseResult] =
      await Promise.all([
        client.query(customerQuery, [id]),
        client.query(invoiceQuery, [id]),
        client.query(deliveryQuery, [id]),
        client.query(purchaseQuery, [id]),
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
    const pur = purchaseResult.rows[0] ?? {};

    const lastInvoiceDate =
      inv.lastDate instanceof Date ? inv.lastDate.toISOString() : inv.lastDate ?? null;
    const lastDeliveryDate =
      del.lastDate instanceof Date ? del.lastDate.toISOString() : del.lastDate ?? null;
    const lastPurchaseDate =
      pur.lastDate instanceof Date ? pur.lastDate.toISOString() : pur.lastDate ?? null;

    const lastActivityDate = [lastInvoiceDate, lastDeliveryDate, lastPurchaseDate]
      .filter(Boolean)
      .map((d) => new Date(d as string).getTime())
      .reduce<number | null>((max, ts) => {
        if (Number.isNaN(ts)) return max;
        return max === null ? ts : Math.max(max, ts);
      }, null);

    return {
      customer,
      invoiceCount: Number(inv.count ?? 0),
      deliveryCount: Number(del.count ?? 0),
      purchaseCount: Number(pur.count ?? 0),
      lastInvoiceDate,
      lastDeliveryDate,
      lastPurchaseDate,
      lastActivityDate: lastActivityDate ? new Date(lastActivityDate).toISOString() : null,
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
