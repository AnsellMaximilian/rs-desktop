import React from "react";
import { useNavigate } from "react-router-dom";

export default function ErrorPage() {
  const navigate = useNavigate();
  return (
    <div className="flex grow flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-emerald-200">
        Oops, that page is missing
      </div>
      <h1 className="text-4xl font-semibold text-white">404</h1>
      <p className="max-w-md text-base text-slate-200/80">
        The page you were looking for doesn&apos;t exist. Let&apos;s head back to
        safer ground.
      </p>
      <button
        className="rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:shadow-emerald-500/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        onClick={() => navigate(-1)}
      >
        Go back
      </button>
    </div>
  );
}
