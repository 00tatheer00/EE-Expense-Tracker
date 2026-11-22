export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse">
      <div className="mb-4 h-4 w-28 rounded bg-slate-200/80" />
      <div className="card overflow-hidden">
        <div className="h-1 bg-slate-200" />
        <div className="space-y-4 p-5 sm:p-7">
          <div className="h-5 w-24 rounded-full bg-slate-200/80" />
          <div className="h-7 w-2/3 rounded-lg bg-slate-200/80" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200/80" />
            <div className="space-y-1.5">
              <div className="h-3 w-16 rounded bg-slate-200/80" />
              <div className="h-4 w-32 rounded bg-slate-200/80" />
            </div>
          </div>
          <div className="h-9 w-40 rounded-lg bg-slate-200/80" />
        </div>
        <div className="grid grid-cols-1 gap-5 border-t border-line p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-200/80" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-16 rounded bg-slate-200/80" />
                <div className="h-4 w-28 rounded bg-slate-200/80" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
