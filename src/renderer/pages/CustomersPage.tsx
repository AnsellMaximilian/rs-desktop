import { useEffect, useMemo, useState } from "react";
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
  RefreshCw,
  Search,
} from "lucide-react";
import type {
  Customer,
  CustomersOverview,
  CustomersSortKey,
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

type TableSortKey = Extract<CustomersSortKey, "fullName" | "phone" | "region" | "createdAt" | "updatedAt" | "isActive">;

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };
type OverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CustomersOverview };

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border bg-card/60 p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
      {helper && (
        <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const [data, setData] = useState<Customer[]>([]);
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

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        id: "fullName",
        accessorKey: "fullName",
        header: ({ column }) => (
          <SortButton
            title="Customer"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <div className="font-semibold text-foreground">
                {customer.fullName}
              </div>
              {customer.note && (
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {customer.note}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: ({ column }) => (
          <SortButton
            title="Phone"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.phone || "—"}
          </span>
        ),
      },
      {
        id: "region",
        accessorKey: "regionName",
        header: ({ column }) => (
          <SortButton
            title="Region"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.regionName || "—"}
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
            isActive === false ? "Inactive" : isActive === true ? "Active" : "Unknown";
          const dotClass =
            isActive === false
              ? "bg-amber-500"
              : isActive === true
              ? "bg-emerald-500"
              : "bg-slate-400";
          return (
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
            >
              <span className={`h-2 w-2 rounded-full ${dotClass}`} />
              {label}
            </span>
          );
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <SortButton
            title="Created"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
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

      const response = await window.api.customers.list({
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
        err instanceof Error ? err.message : "Failed to load customers";
      setFetchState({ status: "error", message });
    }
  };

  const fetchOverview = async () => {
    setOverviewState({ status: "loading" });
    try {
      const data = await window.api.customers.overview();
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
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Read-only view into Rumah Sehat customer records with search, sort,
          and paging.
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
              label="Total customers"
              value={overviewState.data.total}
              helper={`${overviewState.data.active} active / ${overviewState.data.inactive} inactive`}
            />
            <StatCard
              label="RS members"
              value={overviewState.data.rsMember}
              helper={`${overviewState.data.receiveDrDiscount} receive doctor discount`}
            />
            <StatCard
              label="Buying in last 30d"
              value={overviewState.data.withInvoices30d}
              helper="Unique customers with invoices"
            />
            <StatCard
              label="Last invoice"
              value={
                overviewState.data.lastInvoiceDate
                  ? formatDate(overviewState.data.lastInvoiceDate)
                  : "No invoices"
              }
              helper="Most recent invoice date"
            />
            <div className="md:col-span-2 xl:col-span-2 rounded-xl border bg-card/60 p-4 shadow-sm">
              <div className="text-sm font-semibold text-muted-foreground">
                Top regions
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {overviewState.data.topRegions.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No region data.
                  </div>
                )}
                {overviewState.data.topRegions.map((region) => (
                  <div
                    key={region.regionName}
                    className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1 text-sm"
                  >
                    <span className="font-semibold text-foreground">
                      {region.regionName}
                    </span>
                    <span className="text-muted-foreground">
                      {region.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
                placeholder="Search name, phone, address, or region..."
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
                      Loading customers...
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
                        No customers found.
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
                  pagination.pageIndex + 1 >= pageCount || isLoading || total === 0
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
