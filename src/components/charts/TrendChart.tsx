"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { compactPKR, formatPKR } from "@/lib/utils";

export type Series = { key: string; name: string; color: string };

function ChartTooltip({ active, payload, label, series }: TooltipProps<number, string> & { series: Series[] }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + Number(p.value ?? 0), 0);
  return (
    <div className="min-w-[180px] rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs shadow-pop">
      <div className="mb-1.5 font-semibold text-navy-900">{label}</div>
      <div className="space-y-1">
        {series
          .slice()
          .reverse()
          .map((s) => {
            const p = payload.find((x) => x.dataKey === s.key);
            return (
              <div key={s.key} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-ink-muted">
                  <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-medium tabular-nums text-ink">{formatPKR(Number(p?.value ?? 0))}</span>
              </div>
            );
          })}
      </div>
      {series.length > 1 && (
        <div className="mt-1.5 flex justify-between border-t border-line pt-1.5 font-semibold text-navy-900">
          <span>Total</span>
          <span className="tabular-nums">{formatPKR(total)}</span>
        </div>
      )}
    </div>
  );
}

export function TrendChart({
  data,
  series,
  xKey = "label",
  height = 280,
}: {
  data: Record<string, string | number>[];
  series: Series[];
  xKey?: string;
  height?: number;
}) {
  return (
    <div>
      {series.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="#EEF1F6" />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={{ stroke: "#E6E9F0" }}
              tick={{ fill: "#64748B", fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              allowDecimals={false}
              // Empty or tiny data: keep a sensible scale instead of "Rs 1, Rs 2, Rs 3…"
              domain={[0, (max: number) => (max > 0 ? Math.max(max, 1000) : 10000)]}
              tick={{ fill: "#64748B", fontSize: 12 }}
              tickFormatter={(v: number) => (v === 0 ? "0" : compactPKR(v))}
            />
            <Tooltip
              cursor={{ fill: "rgba(11,26,58,0.04)" }}
              content={<ChartTooltip series={series} />}
            />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                stackId="total"
                fill={s.color}
                stroke="#FFFFFF"
                strokeWidth={series.length > 1 ? 2 : 0}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={44}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
