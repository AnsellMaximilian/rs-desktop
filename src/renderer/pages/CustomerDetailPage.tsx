import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Loader2,
  Phone,
  RefreshCw,
} from "lucide-react";
import type { CustomerDetail } from "../../shared/types";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";

type DetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CustomerDetail };

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

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-card/60 px-4 py-3 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numericId = Number(id);
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const activityData = useMemo(() => {
    if (state.status !== "ready") return [];
    const base = state.data.invoiceTrend.map((item) => ({
      label: item.label,
      invoices: item.count,
      deliveries: 0,
    }));
    const labelIndex = new Map(
      state.data.invoiceTrend.map((item, idx) => [item.label, idx])
    );

    state.data.deliveryTrend.forEach((item) => {
      const idx = labelIndex.get(item.label);
      if (idx !== undefined) {
        base[idx].deliveries = item.count;
      } else {
        base.push({
          label: item.label,
          invoices: 0,
          deliveries: item.count,
        });
      }
    });

    return base;
  }, [state]);

  const load = async () => {
    if (!Number.isInteger(numericId)) {
      setState({ status: "error", message: "Invalid customer id" });
      return;
    }
    setState({ status: "loading" });
    try {
      const data = await window.api.customers.detail(numericId);
      setState({ status: "ready", data });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load customer";
      setState({ status: "error", message });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
          to="/customers"
          className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
        >
          Customers
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
            Loading customer...
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
                  {state.data.customer.fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {state.data.customer.regionName && (
                    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                      {state.data.customer.regionName}
                    </span>
                  )}
                  {state.data.customer.isActive === false ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-amber-900">
                      Inactive
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-emerald-900">
                      Active
                    </span>
                  )}
                  {state.data.customer.rsMember && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/50 bg-blue-500/10 px-3 py-1 text-blue-900">
                      RS member
                    </span>
                  )}
                  {state.data.customer.receiveDrDiscount && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/50 bg-purple-500/10 px-3 py-1 text-purple-900">
                      Doctor discount
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Created {formatDate(state.data.customer.createdAt)}
                <br />
                Updated {formatDate(state.data.customer.updatedAt)}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow
                label="Phone"
                value={
                  state.data.customer.phone ? (
                    <span className="inline-flex items-center gap-2 text-foreground">
                      <Phone className="h-4 w-4" />
                      {state.data.customer.phone}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailRow
                label="Account"
                value={
                  state.data.customer.accountNumber
                    ? `${state.data.customer.accountNumber} (${state.data.customer.accountName ?? "Account"})`
                    : "—"
                }
              />
              <DetailRow
                label="Address"
                value={state.data.customer.address || "—"}
                multiline
              />
              <DetailRow
                label="Note"
                value={state.data.customer.note || "—"}
                multiline
              />
              <DetailRow
                label="Last activity"
                value={formatDate(state.data.lastActivityDate)}
              />
              <DetailRow
                label="Last invoice"
                value={formatDate(state.data.lastInvoiceDate)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Stat label="Invoices" value={state.data.invoiceCount} />
            <Stat label="Deliveries" value={state.data.deliveryCount} />
            <Stat label="Last invoice" value={formatDate(state.data.lastInvoiceDate)} />
            <Stat label="Last delivery" value={formatDate(state.data.lastDeliveryDate)} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Activity (last 6 months)
              </div>
              <ActivityChart data={activityData} />
            </div>

            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Spend (last 6 months)
              </div>
              <SpendChart data={state.data.spendTrend} />
              <div className="grid grid-cols-3 gap-2">
                <KpiCard
                  label="Recency (days)"
                  value={
                    state.data.rfm.recencyDays !== null
                      ? state.data.rfm.recencyDays
                      : "—"
                  }
                />
                <KpiCard label="Frequency" value={state.data.rfm.frequency} />
                <KpiCard
                  label="Monetary"
                  value={`Rp ${state.data.rfm.monetary.toLocaleString()}`}
                />
              </div>
            </div>

            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Order value distribution
              </div>
              <OrderValueChart data={state.data.orderValueBuckets} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Category breakdown
              </div>
              <CategoryDonutChart data={state.data.categoryBreakdown} />
            </div>
            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Activity split
              </div>
              <ActivitySplitChart
                invoices={state.data.invoiceCount}
                deliveries={state.data.deliveryCount}
              />
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
  multiline,
}: {
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-sm text-foreground ${
          multiline ? "whitespace-pre-wrap" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function ActivityChart({
  data,
}: {
  data: { label: string; invoices: number; deliveries: number }[];
}) {
  const chartConfig = {
    invoices: { label: "Invoices", color: "var(--chart-1)" },
    deliveries: { label: "Deliveries", color: "var(--chart-2)" },
  } as const;

  return (
    <ChartContainer
      className="aspect-auto h-64 w-full"
      config={chartConfig}
    >
      <BarChart data={data} margin={{ left: -12, right: 12, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
        <Bar
          dataKey="invoices"
          fill="var(--color-invoices)"
          radius={[6, 6, 0, 0]}
          maxBarSize={22}
        />
        <Bar
          dataKey="deliveries"
          fill="var(--color-deliveries)"
          radius={[6, 6, 0, 0]}
          maxBarSize={22}
        />
      </BarChart>
    </ChartContainer>
  );
}

function SpendChart({ data }: { data: { label: string; amount: number }[] }) {
  const chartConfig = {
    amount: { label: "Spend", color: "var(--chart-3)" },
  } as const;

  return (
    <ChartContainer
      className="aspect-auto h-60 w-full"
      config={chartConfig}
    >
      <ReLineChart data={data} margin={{ left: -12, right: 12, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
        <Line
          type="monotone"
          dataKey="amount"
          stroke="var(--color-amount)"
          strokeWidth={2.2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </ReLineChart>
    </ChartContainer>
  );
}

function OrderValueChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  const chartConfig = {
    orders: { label: "Orders", color: "var(--chart-4)" },
  } as const;

  if (!data.length) {
    return (
      <div className="rounded-lg border bg-background px-4 py-6 text-sm text-muted-foreground">
        No order value data.
      </div>
    );
  }

  return (
    <ChartContainer
      className="aspect-auto h-64 w-full"
      config={chartConfig}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 12, right: 12, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tickMargin={6}
        />
        <YAxis
          dataKey="label"
          type="category"
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="count"
          fill="var(--color-orders)"
          radius={[0, 6, 6, 0]}
          barSize={16}
        />
      </BarChart>
    </ChartContainer>
  );
}

function CategoryDonutChart({
  data,
}: {
  data: { label: string; amount: number }[];
}) {
  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  if (!data.length) {
    return (
      <div className="rounded-lg border bg-background px-4 py-6 text-sm text-muted-foreground">
        No category data.
      </div>
    );
  }

  const config = data.reduce<ChartConfig>((acc, slice) => {
    acc[slice.label] = { label: slice.label };
    return acc;
  }, {});

  return (
    <ChartContainer
      className="aspect-auto h-64 w-full"
      config={config}
    >
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="label"
          innerRadius={45}
          outerRadius={70}
          paddingAngle={3}
        >
          {data.map((entry, idx) => (
            <Cell
              key={entry.label}
              fill={colors[idx % colors.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelKey="label"
              nameKey="label"
              formatter={(value: number, name) => (
                <>
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    Rp {value.toLocaleString()}
                  </span>
                </>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent nameKey="label" />} />
      </PieChart>
    </ChartContainer>
  );
}

function ActivitySplitChart({
  invoices,
  deliveries,
}: {
  invoices: number;
  deliveries: number;
}) {
  const data = [
    { name: "Invoices", value: invoices, fill: "var(--chart-1)" },
    { name: "Deliveries", value: deliveries, fill: "var(--chart-2)" },
  ];

  const chartConfig = {
    Invoices: { label: "Invoices" },
    Deliveries: { label: "Deliveries" },
  } as const;

  return (
    <ChartContainer
      className="aspect-auto h-64 w-full"
      config={chartConfig}
    >
      <RadialBarChart
        data={data}
        innerRadius="30%"
        outerRadius="80%"
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, Math.max(invoices, deliveries, 1)]} tick={false} />
        <RadialBar
          dataKey="value"
          background
          cornerRadius={8}
          stackId="activity"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(value) => value}
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
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </RadialBarChart>
    </ChartContainer>
  );
}
