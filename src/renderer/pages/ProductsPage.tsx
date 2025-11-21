export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-emerald-50">Products</h1>
        <p className="text-sm text-emerald-100/70">
          Manage your catalog and keep inventory details up to date.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px] rounded-lg border border-white/10 bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-100/70">
                Total SKUs
              </p>
              <p className="text-2xl font-semibold text-white">0</p>
            </div>
            <div className="flex-1 min-w-[180px] rounded-lg border border-white/10 bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-100/70">
                Low stock
              </p>
              <p className="text-2xl font-semibold text-white">0</p>
            </div>
          </div>

          <div>
            <div className="text-lg font-semibold text-white">No products yet</div>
            <p className="text-sm text-emerald-100/70">
              Add your first product to start tracking stock and pricing.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow transition hover:bg-emerald-400">
              Add product
            </button>
            <button className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-emerald-100/80 transition hover:border-emerald-300/50 hover:text-white">
              Import catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
