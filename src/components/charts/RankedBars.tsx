import { formatPKR } from "@/lib/utils";

export type RankedItem = { label: string; value: number; color?: string; sub?: string };

/** Accessible horizontal bar list — works great on mobile and in print. */
export function RankedBars({
  items,
  color = "#2B4FB8",
  limit = 8,
  showShare = true,
}: {
  items: RankedItem[];
  color?: string;
  limit?: number;
  showShare?: boolean;
}) {
  const sorted = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  if (rest.length) {
    top.push({ label: `Other (${rest.length})`, value: rest.reduce((s, r) => s + r.value, 0), color: "#94A3B8" });
  }
  const max = Math.max(...top.map((t) => t.value), 1);
  const total = sorted.reduce((s, t) => s + t.value, 0) || 1;

  return (
    <ul className="space-y-3.5">
      {top.map((item) => (
        <li key={item.label} title={`${item.label}: ${formatPKR(item.value, true)}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium text-ink">{item.label}</span>
              {item.sub && <span className="shrink-0 text-xs text-ink-subtle">{item.sub}</span>}
            </span>
            <span className="shrink-0 tabular-nums text-ink">
              <span className="font-semibold">{formatPKR(item.value)}</span>
              {showShare && (
                <span className="ml-2 inline-block w-10 text-right text-xs text-ink-subtle">
                  {((item.value / total) * 100).toFixed(0)}%
                </span>
              )}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max((item.value / max) * 100, 1.5)}%`, background: item.color ?? color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
