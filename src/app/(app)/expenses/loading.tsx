export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-5 h-7 w-40 rounded-lg bg-slate-200/80 sm:mb-8" />
      <div className="mb-3 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-full bg-slate-200/80" />
        ))}
      </div>
      <div className="mb-4 h-12 rounded-xl bg-slate-200/80 sm:h-10" />
      <div className="card divide-y divide-line">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-10 w-10 rounded-2xl bg-slate-200/80" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-1/2 rounded bg-slate-200/80" />
              <div className="h-3 w-1/3 rounded bg-slate-200/80" />
            </div>
            <div className="h-4 w-20 rounded bg-slate-200/80" />
          </div>
        ))}
      </div>
    </div>
  );
}
