import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Loader2,
  RefreshCw,
  Truck,
} from "lucide-react";
import type {
  SupplierDetail,
  SupplierTopProductPoint,
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
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

type DetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: SupplierDetail };

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString()}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numericId = Number(id);
  const [state, setState] = useState<DetailState>({ status: "loading" });

  const load = async () => {
    if (!Number.isInteger(numericId)) {
      setState({ status: "error", message: "Invalid supplier id" });
      return;
    }

    setState({ status: "loading" });
    try {
      const data = await window.api.suppliers.detail(numericId);
      setState({ status: "ready", data });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load supplier";
      setState({ status: "error", message });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const topProductChart = useMemo(() => {
    if (state.status !== "ready") return { data: [], config: {} };
    const points = state.data.topProductTrends;
    if (points.length === 0) return { data: [], config: {} };

    const palette = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
      "var(--chart-6)",
      "var(--chart-7)",
      "var(--chart-8)",
      "var(--chart-9)",
      "var(--chart-10)",
    ];

    const products = Array.from(
      new Map(
        points.map((p) => [p.productId, p.productName || `Product ${p.productId}`])
      ).entries()
    );

    const labels = Array.from(
      new Set([
        ...state.data.qtyTrend.map((p) => p.label),
        ...points.map((p) => p.label),
      ])
    );

    const rows = new Map<string, Record<string, unknown>>();
    for (const label of labels) {
      rows.set(label, { label });
    }

    for (const point of points) {
      const key = `product-${point.productId}`;
      const row = rows.get(point.label) || { label: point.label };
      row[key] = Number(point.qty ?? 0);
      rows.set(point.label, row);
    }

    const data = labels.map((label) => rows.get(label) as Record<string, unknown>);

    const config = products.reduce<Record<string, { label: string; color: string }>>(
      (acc, [productId, productName], idx) => {
        acc[`product-${productId}`] = {
          label: productName,
          color: palette[idx % palette.length],
        };
        return acc;
      },
      {}
    );

    return { data, config };
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
          to="/suppliers"
          className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
        >
          Suppliers
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
            Loading supplier...
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
                <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  Supplier
                </div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {state.data.supplier.name}
                </h1>
                <div className="text-sm text-muted-foreground">
                  {state.data.supplier.accountName ||
                    state.data.supplier.accountNumber ||
                    "No account info"}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Last sale {formatDate(state.data.totals.lastSaleDate)}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow
                label="Revenue"
                value={formatCurrency(state.data.totals.revenue)}
              />
              <DetailRow
                label="Units sold"
                value={state.data.totals.soldQty.toLocaleString()}
              />
              <DetailRow
                label="Products"
                value={state.data.supplier.productCount.toLocaleString()}
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Total qty trend (weekly)
              </div>
              <QtyTrendChart data={state.data.qtyTrend} />
            </div>

            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4 xl:col-span-2">
              <div className="text-sm font-semibold text-muted-foreground">
                Top product qty (weekly, stacked top 10)
              </div>
              <TopProductsChart
                data={topProductChart.data}
                config={topProductChart.config}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
            <div className="text-sm font-semibold text-muted-foreground">
              Top products by qty
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {state.data.topProducts.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <span className="text-foreground">{item.label}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
              {state.data.topProducts.length === 0 && (
                <div className="rounded-lg border bg-background px-4 py-6 text-sm text-muted-foreground">
                  No product deliveries yet.
                </div>
              )}
            </div>
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

function QtyTrendChart({
  data,
}: {
  data: { label: string; qty: number }[];
}) {
  const chartConfig = {
    qty: { label: "Qty", color: "var(--chart-4)" },
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

function TopProductsChart({
  data,
  config,
}: {
  data: Record<string, unknown>[];
  config: Record<string, { label: string; color: string }>;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-background px-4 py-6 text-sm text-muted-foreground">
        No deliveries yet.
      </div>
    );
  }

  return (
    <ChartContainer className="aspect-auto h-64 w-full" config={config}>
      <AreaChart data={data} margin={{ left: -12, right: 12, bottom: 8 }}>
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
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {Object.keys(config).map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="monotone"
            stackId="qty"
            stroke={`var(--color-${key})`}
            fill={`var(--color-${key})`}
            fillOpacity={0.25}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
