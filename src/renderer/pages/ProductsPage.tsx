export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Products</h1>
        <p className="text-sm text-muted-foreground">
          Manage your catalog and keep inventory details up to date.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px] rounded-lg border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total SKUs
              </p>
              <p className="text-2xl font-semibold text-foreground">0</p>
            </div>
            <div className="flex-1 min-w-[180px] rounded-lg border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Low stock
              </p>
              <p className="text-2xl font-semibold text-foreground">0</p>
            </div>
          </div>

          <div>
            <div className="text-lg font-semibold text-card-foreground">
              No products yet
            </div>
            <p className="text-sm text-muted-foreground">
              Add your first product to start tracking stock and pricing.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
              Add product
            </button>
            <button className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground">
              Import catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
