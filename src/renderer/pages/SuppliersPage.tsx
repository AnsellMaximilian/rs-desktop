import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpDown,
  Home,
  Loader2,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";
import type {
  Supplier,
  SuppliersSortKey,
  SuppliersOverview,
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

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

type OverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: SuppliersOverview };

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

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString()}`;
}

export default function SuppliersPage() {
  const [data, setData] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<{ id: SuppliersSortKey; desc: boolean }[]>([
    { id: "revenue", desc: true },
  ]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fetchState, setFetchState] = useState<FetchState>({
    status: "loading",
  });
  const [overviewState, setOverviewState] = useState<OverviewState>({
    status: "loading",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const fetchData = async () => {
    setFetchState({ status: "loading" });
    try {
      const activeSort = sorting[0];
      const sortBy = activeSort?.id ?? "revenue";
      const sortDir = activeSort?.desc ? "desc" : "asc";

      const res = await window.api.suppliers.list({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        search: debouncedSearch || undefined,
        sortBy,
        sortDir,
      });

      setData(res.data);
      setTotal(res.total);
      setFetchState({ status: "ready" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load suppliers";
      setFetchState({ status: "error", message });
    }
  };

  const fetchOverview = async () => {
    setOverviewState({ status: "loading" });
    try {
      const res = await window.api.suppliers.overview();
      setOverviewState({ status: "ready", data: res });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load overview";
      setOverviewState({ status: "error", message });
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting]);

  useEffect(() => {
    fetchOverview();
  }, []);

  const pageCount = Math.max(1, Math.ceil((total || 0) / pagination.pageSize));
  const from = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min(total, (pagination.pageIndex + 1) * pagination.pageSize);
  const isLoading = fetchState.status === "loading";

  const setSort = (key: SuppliersSortKey) => {
    setSorting((prev) => {
      const current = prev[0];
      if (current?.id === key) {
        return [{ id: key, desc: !current.desc }];
      }
      return [{ id: key, desc: key === "revenue" || key === "soldQty" }];
    });
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/home"
          className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Suppliers
          </h1>
          <p className="text-sm text-muted-foreground">
            Delivery performance by supplier.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className="pl-9"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
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
              label="Suppliers"
              value={overviewState.data.total.toLocaleString()}
              helper={`Products: ${overviewState.data.products.toLocaleString()}`}
            />
            <StatCard
              label="Units sold"
              value={overviewState.data.soldQty.toLocaleString()}
              helper={`Last sale: ${
                overviewState.data.lastSaleDate
                  ? new Date(overviewState.data.lastSaleDate).toLocaleDateString()
                  : "—"
              }`}
            />
            <StatCard
              label="Revenue"
              value={formatCurrency(overviewState.data.revenue)}
              helper="Across all supplier products"
            />
          </>
        )}
      </div>

      {fetchState.status === "error" && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {fetchState.message}
        </div>
      )}

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
                placeholder="Search suppliers..."
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
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <Table className="bg-background/70">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">
                  <SortButton
                    title="Supplier"
                    sorted={sorting[0]?.id === "name" ? (sorting[0].desc ? "desc" : "asc") : false}
                    onClick={() => setSort("name")}
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton
                    title="Products"
                    sorted={
                      sorting[0]?.id === "productCount"
                        ? sorting[0].desc
                          ? "desc"
                          : "asc"
                        : false
                    }
                    onClick={() => setSort("productCount")}
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton
                    title="Units sold"
                    sorted={
                      sorting[0]?.id === "soldQty"
                        ? sorting[0].desc
                          ? "desc"
                          : "asc"
                        : false
                    }
                    onClick={() => setSort("soldQty")}
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton
                    title="Revenue"
                    sorted={
                      sorting[0]?.id === "revenue"
                        ? sorting[0].desc
                          ? "desc"
                          : "asc"
                        : false
                    }
                    onClick={() => setSort("revenue")}
                  />
                </TableHead>
                <TableHead>Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading suppliers...
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                data.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => navigate(`/suppliers/${supplier.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {supplier.productCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {supplier.soldQty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground">
                      {formatCurrency(supplier.revenue)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {supplier.accountName || supplier.accountNumber || "—"}
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No suppliers found.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-3.5 w-3.5" />
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
