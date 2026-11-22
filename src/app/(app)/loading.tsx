export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 h-8 w-64 rounded-lg bg-slate-200/70" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white shadow-card" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="h-80 rounded-2xl bg-white shadow-card xl:col-span-2" />
        <div className="h-80 rounded-2xl bg-white shadow-card" />
      </div>
    </div>
  );
}
