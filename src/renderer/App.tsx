import { useMemo, useState } from "react";

export default function App() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const recents = useMemo(
    () => [
      {
        name: "Design System",
        path: "C:/Projects/design-system",
        updated: "2d ago",
      },
      {
        name: "Storefront UI",
        path: "C:/Work/storefront",
        updated: "5d ago",
      },
      {
        name: "Personal Notes",
        path: "D:/Notes",
        updated: "1w ago",
      },
    ],
    []
  );

  const highlights = useMemo(
    () => [
      {
        title: "Workspace ready",
        text: "Tailwind-powered layout with zero shadcn dependencies.",
      },
      {
        title: "Fluid navigation",
        text: "Minimal shell focused on your project folders and quick actions.",
      },
      {
        title: "Electron-native",
        text: "Works inside your desktop shell with crisp theming.",
      },
    ],
    []
  );

  const pickFolder = async () => {
    const result = await api.files.pickFolder();
    if (result?.path) {
      setSelectedFolder(result.path);
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/40 p-6 shadow-2xl shadow-emerald-500/10">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200/90">
            Workspace
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Launch your next project faster
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-200/80">
            Quickly choose a folder to get started. This UI is pure Tailwind with
            a clean glassmorphic layer - no shadcn components required.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={pickFolder}
              className="rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-emerald-500/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 active:translate-y-0"
            >
              Choose project folder
            </button>
            <button className="rounded-lg border border-white/15 px-4 py-3 text-slate-100/90 transition duration-150 hover:border-emerald-200/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200">
              Browse templates
            </button>
            {selectedFolder ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-emerald-100">
                Selected: {selectedFolder}
              </span>
            ) : null}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100/90 shadow-sm"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">
                  {item.title}
                </div>
                <p className="mt-2 text-slate-200/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-200">
                Quick snapshot
              </p>
              <p className="text-sm text-slate-200/70">
                Your workspace at a glance
              </p>
            </div>
            <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
              Tailwind only
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-300/80">
                Active profile
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                Ansell Maximilian
              </p>
              <p className="text-sm text-slate-300/70">
                Signed in locally • electron workspace
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-transparent px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-emerald-50/80">
                  Recent days active
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">12</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-gradient-to-r from-sky-400/20 via-sky-300/10 to-transparent px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-sky-50/80">
                  Projects tracked
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">8</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-200">Recents</p>
            <p className="text-sm text-slate-200/75">
              Quick links to your latest workspaces
            </p>
          </div>
          <button className="text-sm font-semibold text-emerald-200 hover:text-emerald-100">
            Clear list
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {recents.map((item) => (
            <div
              key={item.path}
              className="group rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:-translate-y-0.5 hover:border-emerald-200/70 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-slate-300/75">{item.path}</p>
                </div>
                <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-[11px] font-semibold text-emerald-100">
                  {item.updated}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Ready to open
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
