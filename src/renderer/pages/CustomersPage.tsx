export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-emerald-50">Customers</h1>
        <p className="text-sm text-emerald-100/70">
          Keep track of the people and businesses you work with.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 shadow-lg">
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-lg font-semibold text-white">No customers yet</div>
            <p className="text-sm text-emerald-100/70">
              Start by creating your first customer so you can attach quotes,
              invoices, and orders.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow transition hover:bg-emerald-400">
              Add customer
            </button>
            <button className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-emerald-100/80 transition hover:border-emerald-300/50 hover:text-white">
              Import CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
