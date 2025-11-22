import { useEffect, useState } from "react";

type PingState =
  | { status: "loading" }
  | { status: "ok"; database: string | null; now: string }
  | { status: "error"; message: string };

export default function HomePage() {
  const [state, setState] = useState<PingState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const result = await window.api.database.ping();
        if (cancelled) return;
        setState({ status: "ok", database: result.database, now: result.now });
      } catch (err) {
        console.error("[Home] Database ping failed", err);
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to reach database";
        setState({ status: "error", message });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Home</h1>
        <p className="text-sm text-muted-foreground">
          Quick check of your connection and environment.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-card-foreground">
          Database connection
        </h2>
        <p className="text-sm text-muted-foreground">
          We ping the database once to verify connectivity.
        </p>

        <div className="mt-4 rounded-lg border bg-background/60 p-4">
          {state.status === "loading" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Checking connection...
            </div>
          )}

          {state.status === "ok" && (
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-green-600">
                Connected successfully
              </div>
              <div className="text-muted-foreground">
                Database: {state.database ?? "unknown"}
              </div>
              <div className="text-muted-foreground">Time: {state.now}</div>
            </div>
          )}

          {state.status === "error" && (
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-red-600">
                Connection failed
              </div>
              <div className="text-muted-foreground">{state.message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
