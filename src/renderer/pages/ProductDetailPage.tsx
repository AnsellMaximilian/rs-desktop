import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  ArrowLeftRight,
  Home,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBasket,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import type {
  ProductDetail,
  StockMovement,
  TopItem,
} from "../../shared/types";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

type DetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ProductDetail };

function formatDate(value: string | null) {
  if (!value) return "—";
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

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString()}`;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numericId = Number(id);
  const [state, setState] = useState<DetailState>({ status: "loading" });

  const load = async () => {
    if (!Number.isInteger(numericId)) {
      setState({ status: "error", message: "Invalid product id" });
      return;
    }
    setState({ status: "loading" });
    try {
      const data = await window.api.products.detail(numericId);
      setState({ status: "ready", data });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load product";
      setState({ status: "error", message });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const marginPercent = useMemo(() => {
    if (state.status !== "ready") return null;
    if (state.data.totals.revenue === 0) return null;
    return (
      (state.data.totals.margin / Math.max(state.data.totals.revenue, 1)) *
      100
    );
  }, [state]);

  const stockTotals = useMemo(() => {
    if (state.status !== "ready") return { inbound: 0, outbound: 0 };
    return state.data.stockMovements.reduce(
      (acc, move) => {
        if (move.qty >= 0) acc.inbound += move.qty;
        else acc.outbound += Math.abs(move.qty);
        return acc;
      },
      { inbound: 0, outbound: 0 }
    );
  }, [state]);

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
        <ArrowRight className="h-3 w-3" />
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
        >
          Products
        </Link>
        {Number.isInteger(numericId) && (
          <>
            <ArrowRight className="h-3 w-3" />
            <span className="text-foreground">#{numericId}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={load}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {state.status === "loading" && (
        <div className="rounded-xl border bg-card/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading product...
          </div>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {state.status === "ready" && (
        <div className="space-y-5">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-foreground">
                  {state.data.product.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                    {state.data.product.unit}
                  </span>
                  {state.data.product.categoryName && (
                    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                      {state.data.product.categoryName}
                    </span>
                  )}
                  {state.data.product.supplierName && (
                    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                      {state.data.product.supplierName}
                    </span>
                  )}
                  {state.data.product.isActive === false ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-amber-900">
                      Inactive
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-emerald-900">
                      Active
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Created {formatDate(state.data.product.createdAt)}
                <br />
                Updated {formatDate(state.data.product.updatedAt)}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow
                label="Keep stock since"
                value={formatDate(state.data.product.keepStockSince)}
              />
              <DetailRow
                label="Restock number"
                value={state.data.product.restockNumber ?? "—"}
              />
              <DetailRow
                label="Price"
                value={formatCurrency(state.data.product.price)}
              />
              <DetailRow
                label="Reseller price"
                value={
                  state.data.product.resellerPrice !== null
                    ? formatCurrency(state.data.product.resellerPrice)
                    : "—"
                }
              />
              <DetailRow
                label="Cost"
                value={formatCurrency(state.data.product.cost)}
              />
              <DetailRow
                label="Supplier"
                value={state.data.product.supplierName || "—"}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Revenue"
              value={formatCurrency(state.data.totals.revenue)}
              helper={`Margin ${formatCurrency(state.data.totals.margin)}${marginPercent !== null ? ` (${marginPercent.toFixed(1)}%)` : ""}`}
            />
            <StatCard
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Units sold"
              value={state.data.totals.soldQty.toLocaleString()}
              helper={`Last sale ${formatDate(state.data.totals.lastSaleDate)}`}
            />
            <StatCard
              icon={<ShoppingBasket className="h-4 w-4" />}
              label="Units purchased"
              value={state.data.totals.purchasedQty.toLocaleString()}
              helper={`Last purchase ${formatDate(state.data.totals.lastPurchaseDate)}`}
            />
            <StatCard
              icon={<Package className="h-4 w-4" />}
              label="Stock movement (recent)"
              value={`${stockTotals.inbound.toLocaleString()} in / ${stockTotals.outbound.toLocaleString()} out`}
              helper="Last 20 moves"
            />
            <StatCard
              icon={<BarChart3 className="h-4 w-4" />}
              label="Current stock"
              value={state.data.totals.currentStock.toLocaleString()}
              helper={
                state.data.product.keepStockSince
                  ? `Since ${formatDate(state.data.product.keepStockSince)}`
                  : "All time"
              }
            />
            <StatCard
              icon={<ArrowLeftRight className="h-4 w-4" />}
              label="Latest stock match"
              value={
                state.data.latestStockMatch?.qty !== null &&
                state.data.latestStockMatch?.qty !== undefined
                  ? state.data.latestStockMatch.qty.toLocaleString()
                  : "—"
              }
              helper={
                state.data.latestStockMatch?.date
                  ? `On ${formatDate(state.data.latestStockMatch.date)}`
                  : "No match recorded"
              }
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Sales trend (last 6 months)
              </div>
              <SalesChart data={state.data.salesTrend} />
            </div>

            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Qty trend (weekly, last 6 months)
              </div>
              <QtyChart data={state.data.qtyTrend} />
            </div>

            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Revenue vs overall cost (last 6 months)
              </div>
              <RevenueCostChart data={state.data.salesTrend} />
            </div>

            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Top customers
              </div>
              <TopList items={state.data.topCustomers} />
            </div>
          </div>

          <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-muted-foreground">
                Stock history (latest 20)
              </div>
              <div className="text-xs text-muted-foreground">
                Positive = inbound, negative = outbound
              </div>
            </div>
            <StockMovementsTable movements={state.data.stockMovements} />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
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

function TopList({ items }: { items: TopItem[] }) {
  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <div className="rounded-lg border bg-background px-4 py-6 text-sm text-muted-foreground">
          No customer activity yet.
        </div>
      )}
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
        >
          <span className="font-medium text-foreground">{item.label}</span>
          <span className="text-muted-foreground">
            {item.value.toLocaleString()} units
          </span>
        </div>
      ))}
    </div>
  );
}

function SalesChart({
  data,
}: {
  data: { label: string; revenue: number; overallCost: number }[];
}) {
  const chartConfig = {
    revenue: { label: "Revenue (Rp)", color: "var(--chart-1)" },
  } as const;

  return (
    <ChartContainer className="aspect-auto h-64 w-full" config={chartConfig}>
      <LineChart data={data} margin={{ left: -12, right: 12, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tickMargin={6}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value: number, name) => (
                <>
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatCurrency(value)}
                  </span>
                </>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="revenue"
          stroke="var(--color-revenue)"
          strokeWidth={2.2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          type="monotone"
        />
      </LineChart>
    </ChartContainer>
  );
}

function QtyChart({
  data,
}: {
  data: { label: string; qty: number; month: string }[];
}) {
  const chartConfig = {
    qty: { label: "Qty", color: "var(--chart-3)" },
  } as const;

  return (
    <ChartContainer className="aspect-auto h-64 w-full" config={chartConfig}>
      <LineChart data={data} margin={{ left: -12, right: 12, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tickMargin={6}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value, payload) => {
                const month = payload?.[0]?.payload?.month;
                return month ? `${value} · ${month}` : value;
              }}
              formatter={(value: number, name) => (
                <>
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {value.toLocaleString()}
                  </span>
                </>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="qty"
          stroke="var(--color-qty)"
          strokeWidth={2.2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          type="monotone"
        />
      </LineChart>
    </ChartContainer>
  );
}

function RevenueCostChart({
  data,
}: {
  data: { label: string; revenue: number; overallCost: number }[];
}) {
  const chartConfig = {
    revenue: { label: "Revenue (Rp)", color: "var(--chart-5)" },
    overallCost: { label: "Overall cost (Rp)", color: "var(--chart-2)" },
  } as const;

  return (
    <ChartContainer className="aspect-auto h-64 w-full" config={chartConfig}>
      <BarChart data={data} margin={{ left: -12, right: 12, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tickMargin={6}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value: number, name) => (
                <>
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatCurrency(value)}
                  </span>
                </>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="revenue"
          fill="var(--color-revenue)"
          radius={[6, 6, 0, 0]}
          maxBarSize={22}
        />
        <Bar
          dataKey="overallCost"
          fill="var(--color-overallCost)"
          radius={[6, 6, 0, 0]}
          maxBarSize={22}
        />
      </BarChart>
    </ChartContainer>
  );
}

function StockMovementsTable({ movements }: { movements: StockMovement[] }) {
  if (movements.length === 0) {
    return (
      <div className="rounded-lg border bg-background px-4 py-6 text-sm text-muted-foreground">
        No stock activity recorded yet.
      </div>
    );
  }

  const iconForKind = (kind: StockMovement["kind"]) => {
    switch (kind) {
      case "delivery":
        return <ArrowRight className="h-3.5 w-3.5 text-destructive" />;
      case "purchase":
        return <ArrowLeft className="h-3.5 w-3.5 text-emerald-600" />;
      case "adjustment":
        return <BarChart3 className="h-3.5 w-3.5 text-blue-500" />;
      case "match":
        return <ArrowLeftRight className="h-3.5 w-3.5 text-amber-600" />;
      case "draw":
        return <ArrowRight className="h-3.5 w-3.5 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="grid grid-cols-5 gap-3 bg-muted/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <div>Date</div>
        <div>Type</div>
        <div>Reference</div>
        <div className="text-right">Qty</div>
        <div>Description</div>
      </div>
      <div className="divide-y divide-border/70">
        {movements.map((move) => (
          <div
            key={`${move.kind}-${move.date}-${move.ref ?? "noref"}`}
            className="grid grid-cols-5 gap-3 px-4 py-2 text-sm"
          >
            <div className="text-muted-foreground">
              {formatDate(move.date)}
            </div>
            <div className="flex items-center gap-2 capitalize text-foreground">
              {iconForKind(move.kind)}
              {move.kind}
            </div>
            <div className="text-foreground">{move.ref || "—"}</div>
            <div
              className={`text-right font-mono tabular-nums ${move.qty < 0 ? "text-destructive" : "text-emerald-700 dark:text-emerald-400"}`}
            >
              {move.qty.toLocaleString()}
            </div>
            <div className="text-muted-foreground">
              {move.description || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
