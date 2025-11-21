export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Keep track of the people and businesses you work with.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-lg font-semibold text-card-foreground">
              No customers yet
            </div>
            <p className="text-sm text-muted-foreground">
              Start by creating your first customer so you can attach quotes,
              invoices, and orders.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
              Add customer
            </button>
            <button className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground">
              Import CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
