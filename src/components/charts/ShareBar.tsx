import { formatPKR } from "@/lib/utils";

/** A single 100% bar split by segment, with a legend that carries labels + values. */
export function ShareBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-slate-100">
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.label}
                title={`${s.label}: ${formatPKR(s.value)} (${((s.value / total) * 100).toFixed(1)}%)`}
                style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                className="h-full first:rounded-l-full last:rounded-r-full"
              />
            ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="truncate text-ink-muted">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums text-ink">
              {total ? `${((s.value / total) * 100).toFixed(1)}%` : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
