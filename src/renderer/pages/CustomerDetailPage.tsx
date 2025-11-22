import { useEffect, useState } from "react";
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
              <div className="grid gap-4 md:grid-cols-2">
                <BarChart
                  title="Invoices"
                  data={state.data.invoiceTrend.map((d) => ({
                    label: d.label,
                    value: d.count,
                  }))}
                  color="var(--primary)"
                />
                <BarChart
                  title="Deliveries"
                  data={state.data.deliveryTrend.map((d) => ({
                    label: d.label,
                    value: d.count,
                  }))}
                  color="var(--chart-2)"
                />
              </div>
            </div>

            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Spend (last 6 months)
              </div>
              <LineChart data={state.data.spendTrend} />
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
              <BucketChart data={state.data.orderValueBuckets} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Category breakdown
              </div>
              <DonutChart data={state.data.categoryBreakdown} />
            </div>
            <div className="rounded-xl border bg-card/60 p-5 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Activity split
              </div>
              <StackedBars
                labels={state.data.invoiceTrend.map((d) => d.label)}
                series={[
                  { label: "Invoices", values: state.data.invoiceTrend.map((d) => d.count), color: "var(--primary)" },
                  { label: "Deliveries", values: state.data.deliveryTrend.map((d) => d.count), color: "var(--chart-2)" },
                ]}
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

function BarChart({
  title,
  data,
  color,
}: {
  title: string;
  data: { label: string; value: number }[];
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const height = 120;
  const barWidth = 100 / data.length;
  return (
    <div className="space-y-3 rounded-lg border bg-background/80 p-4">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <svg viewBox={`0 0 100 ${height}`} className="w-full">
        {data.map((item, idx) => {
          const barHeight = (item.value / max) * (height - 20);
          const x = idx * barWidth + barWidth * 0.1;
          const y = height - barHeight;
          return (
            <g key={item.label}>
              <rect
                x={x}
                y={y}
                width={barWidth * 0.8}
                height={barHeight}
                rx={2}
                fill={color}
              />
              <text
                x={x + barWidth * 0.4}
                y={height - 2}
                textAnchor="middle"
                fontSize="6"
                fill="currentColor"
              >
                {item.label.split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function BucketChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{item.label}</span>
            <span>{item.count}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-orange-500"
              style={{ width: `${Math.max((item.count / max) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: { label: string; amount: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.amount, 0) || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  const colors = [
    "var(--primary)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--accent)",
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 120 120" className="h-32 w-32">
        {data.length === 0 && (
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset="0"
          />
        )}
        {data.map((item, idx) => {
          const percent = Math.max(item.amount / total, 0);
          const dash = percent * circumference;
          const offset = circumference - cumulative;
          cumulative += dash;
          return (
            <circle
              key={item.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={colors[idx % colors.length]}
              strokeWidth="12"
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
            />
          );
        })}
      </svg>
      <div className="flex-1 space-y-2">
        {data.map((item, idx) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              <span>{item.label}</span>
            </div>
            <span>Rp {item.amount.toLocaleString()}</span>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-sm text-muted-foreground">No category data.</div>
        )}
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

function LineChart({ data }: { data: { label: string; amount: number }[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  const width = 120;
  const height = 80;
  const points = data.map((item, idx) => {
    const x = (idx / Math.max(data.length - 1, 1)) * width;
    const y = height - (item.amount / max) * (height - 10);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full">
      <polyline
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        points={points.join(" ")}
      />
      {data.map((item, idx) => {
        const x = (idx / Math.max(data.length - 1, 1)) * width;
        const y = height - (item.amount / max) * (height - 10);
        return <circle key={item.label} cx={x} cy={y} r={2.5} fill="var(--primary)" />;
      })}
      {data.map((item, idx) => {
        const x = (idx / Math.max(data.length - 1, 1)) * width;
        return (
          <text
            key={`${item.label}-label`}
            x={x}
            y={height}
            fontSize="6"
            textAnchor="middle"
            fill="currentColor"
          >
            {item.label.split(" ")[0]}
          </text>
        );
      })}
    </svg>
  );
}

function StackedBars({
  labels,
  series,
}: {
  labels: string[];
  series: { label: string; values: number[]; color: string }[];
}) {
  const max = Math.max(
    ...series.flatMap((s) => s.values),
    1
  );
  return (
    <div className="space-y-2">
      {labels.map((label, idx) => {
        return (
          <div key={label}>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{label}</span>
              <span className="flex items-center gap-2">
                {series.map((s) => (
                  <span key={s.label} className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.values[idx]}
                  </span>
                ))}
              </span>
            </div>
            <div className="mt-1 flex h-3 overflow-hidden rounded-full bg-muted">
              {series.map((s) => {
                const width = `${Math.max((s.values[idx] / max) * 100, 4)}%`;
                return (
                  <div
                    key={s.label}
                    style={{ width, backgroundColor: s.color }}
                    className="h-3"
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
