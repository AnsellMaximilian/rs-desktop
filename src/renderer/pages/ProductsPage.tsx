import React, { useEffect, useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import type {
  Product,
  ProductsOverview,
  ProductsSortKey,
} from "../../shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TableSortKey = Extract<
  ProductsSortKey,
  | "name"
  | "price"
  | "cost"
  | "category"
  | "supplier"
  | "createdAt"
  | "updatedAt"
  | "isActive"
>;

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };
type OverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ProductsOverview };

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function StatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card/60 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
      {helper && (
        <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
      )}
    </div>
  );
}

function TopList({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number }[];
}) {
  return (
    <div className="rounded-xl border bg-card/60 p-4 shadow-sm">
      <div className="text-sm font-semibold text-muted-foreground">
        {title}
      </div>
      <div className="mt-3 space-y-2">
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground">No data.</div>
        )}
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          >
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="text-muted-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SortButton({
  title,
  onClick,
  sorted,
}: {
  title: string;
  onClick: () => void;
  sorted: false | "asc" | "desc";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground"
      aria-label={`Sort by ${title}`}
    >
      <span>{title}</span>
      {sorted === "asc" && <ArrowUp className="h-3.5 w-3.5" />}
      {sorted === "desc" && <ArrowDown className="h-3.5 w-3.5" />}
      {!sorted && <ArrowUpDown className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fetchState, setFetchState] = useState<FetchState>({
    status: "loading",
  });
  const [overviewState, setOverviewState] = useState<OverviewState>({
    status: "loading",
  });

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <SortButton
            title="Product"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <div className="font-semibold text-foreground">
                {product.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {product.unit}
              </div>
            </div>
          );
        },
      },
      {
        id: "category",
        accessorKey: "categoryName",
        header: ({ column }) => (
          <SortButton
            title="Category"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.categoryName || "Uncategorized"}
          </span>
        ),
      },
      {
        id: "supplier",
        accessorKey: "supplierName",
        header: ({ column }) => (
          <SortButton
            title="Supplier"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.supplierName || "—"}
          </span>
        ),
      },
      {
        id: "price",
        accessorKey: "price",
        header: ({ column }) => (
          <SortButton
            title="Price"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col text-sm">
            <span className="font-semibold text-foreground">
              Rp {row.original.price.toLocaleString()}
            </span>
            {row.original.resellerPrice !== null && (
              <span className="text-xs text-muted-foreground">
                Reseller: Rp {row.original.resellerPrice.toLocaleString()}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "cost",
        accessorKey: "cost",
        header: ({ column }) => (
          <SortButton
            title="Cost"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            Rp {row.original.cost.toLocaleString()}
          </span>
        ),
      },
      {
        id: "isActive",
        accessorKey: "isActive",
        header: ({ column }) => (
          <SortButton
            title="Status"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => {
          const isActive = row.original.isActive;
          const label =
            isActive === false
              ? "Inactive"
              : isActive === true
              ? "Active"
              : "Unknown";
          const dotClass =
            isActive === false
              ? "bg-amber-500"
              : isActive === true
              ? "bg-emerald-500"
              : "bg-slate-400";
          return (
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <span className={`h-2 w-2 rounded-full ${dotClass}`} />
              {label}
            </span>
          );
        },
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <SortButton
            title="Updated"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.updatedAt)}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    manualSorting: true,
    enableSortingRemoval: false,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  const fetchData = async (options?: { signal?: AbortSignal; silent?: boolean }) => {
    if (!options?.silent) {
      setFetchState({ status: "loading" });
    }
    try {
      const activeSort = sorting[0];
      const sortBy: TableSortKey =
        (activeSort?.id as TableSortKey | undefined) ?? "updatedAt";

      const response = await window.api.products.list({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        search: debouncedSearch || undefined,
        sortBy,
        sortDir: activeSort?.desc ? "desc" : "asc",
      });

      if (options?.signal?.aborted) return;
      setData(response.data);
      setTotal(response.total);
      if (!options?.silent) {
        setFetchState({ status: "ready" });
      }
    } catch (err) {
      if (options?.signal?.aborted) return;
      const message =
        err instanceof Error ? err.message : "Failed to load products";
      setFetchState({ status: "error", message });
    }
  };

  const fetchOverview = async () => {
    setOverviewState({ status: "loading" });
    try {
      const data = await window.api.products.overview();
      setOverviewState({ status: "ready", data });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load overview";
      setOverviewState({ status: "error", message });
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData({ signal: controller.signal });
    fetchOverview();
    return () => controller.abort();
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting]);

  const pageCount = Math.max(
    1,
    Math.ceil((total || 0) / pagination.pageSize)
  );
  const from = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min(
    total,
    (pagination.pageIndex + 1) * pagination.pageSize
  );

  const isLoading = fetchState.status === "loading";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Products</h1>
        <p className="text-sm text-muted-foreground">
          Inventory, pricing, and supplier insights (read-only).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewState.status === "loading" &&
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 rounded-xl border bg-card/60 p-4 shadow-sm"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-6 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}

        {overviewState.status === "error" && (
          <div className="md:col-span-2 xl:col-span-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {overviewState.message}
            <div className="mt-2">
              <Button variant="ghost" size="sm" onClick={fetchOverview}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {overviewState.status === "ready" && (
          <>
            <StatCard
              label="Total products"
              value={overviewState.data.total}
              helper={`${overviewState.data.active} active / ${overviewState.data.inactive} inactive`}
              icon={<PackageCheck className="h-4 w-4" />}
            />
            <StatCard
              label="Categories"
              value={overviewState.data.categories}
              helper={`${overviewState.data.suppliers} suppliers`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              label="Sold in last 30d"
              value={overviewState.data.sold30d}
              helper={`Last sale: ${
                overviewState.data.lastSaleDate
                  ? formatDate(overviewState.data.lastSaleDate)
                  : "No sales"
              }`}
              icon={<ShoppingCart className="h-4 w-4" />}
            />
            <StatCard
              label="Purchased in last 30d"
              value={overviewState.data.purchased30d}
              helper={`Last purchase: ${
                overviewState.data.lastPurchaseDate
                  ? formatDate(overviewState.data.lastPurchaseDate)
                  : "No purchases"
              }`}
              icon={<ArrowUp className="h-4 w-4" />}
            />
            <TopList
              title="Top categories (count)"
              items={overviewState.data.topCategories}
            />
            <TopList
              title="Top suppliers (count)"
              items={overviewState.data.topSuppliers}
            />
            <TopList
              title="Top sellers last 30d (qty)"
              items={overviewState.data.topSellers30d}
            />
          </>
        )}
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[16rem]">
              <Input
                value={search}
                onChange={(e) => {
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  setSearch(e.target.value);
                }}
                placeholder="Search name, category, or supplier..."
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Rows</label>
              <select
                value={pagination.pageSize}
                onChange={(e) =>
                  setPagination({
                    pageIndex: 0,
                    pageSize: Number(e.target.value),
                  })
                }
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                fetchData();
                fetchOverview();
              }}
              className="ml-auto border border-border/60 bg-background/60 text-foreground"
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          <Table className="bg-background/70">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading products...
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && fetchState.status === "error" && (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      <span>{fetchState.message}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchData()}
                      >
                        Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                fetchState.status !== "error" &&
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading &&
                fetchState.status === "ready" &&
                table.getRowModel().rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        No products found.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {from}-{to}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">{total}</span>
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: Math.max(prev.pageIndex - 1, 0),
                  }))
                }
                disabled={pagination.pageIndex === 0 || isLoading}
              >
                Prev
              </Button>
              <span className="min-w-20 text-center">
                Page {pagination.pageIndex + 1} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: Math.min(prev.pageIndex + 1, pageCount - 1),
                  }))
                }
                disabled={
                  pagination.pageIndex + 1 >= pageCount ||
                  isLoading ||
                  total === 0
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
