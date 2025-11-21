import { Outlet, useLoaderData } from "react-router-dom";

export default function MainLayout() {
  const { name } = useLoaderData() as { name: string };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute -left-32 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />

      <header className="relative z-10 border-b border-white/10 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/30">
              RS
            </div>
            <div>
              <p className="text-sm text-emerald-200/90">Desktop Workspace</p>
              <p className="text-lg font-semibold leading-none text-white">
                Rapid Starter
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200/90">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {name}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
