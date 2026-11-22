import Link from "next/link";
import { ChevronRight, Paperclip } from "lucide-react";
import type { ExpenseWithRelations } from "@/lib/types";
import { formatDate, formatPKR, todayPK } from "@/lib/utils";

function dayLabel(date: string) {
  const today = todayPK();
  const y = new Date(today + "T00:00:00");
  y.setDate(y.getDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);
  if (date === today) return "Today";
  if (date === yesterday) return "Yesterday";
  return formatDate(date, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/** App-style list for phones: grouped by day (when sorted by date), big tap targets. */
export function MobileExpenseList({ expenses, groupByDate }: { expenses: ExpenseWithRelations[]; groupByDate: boolean }) {
  const groups: { key: string; label: string; total: number; items: ExpenseWithRelations[] }[] = [];
  for (const e of expenses) {
    const key = groupByDate ? e.expense_date : "all";
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, label: groupByDate ? dayLabel(e.expense_date) : "", total: 0, items: [] };
      groups.push(g);
    }
    g.items.push(e);
    g.total += Number(e.amount);
  }

  return (
    <div className="md:hidden">
      {groups.map((g) => (
        <section key={g.key}>
          {groupByDate && (
            <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-10 flex items-center justify-between border-b border-line bg-slate-50/95 px-4 py-2 text-xs font-semibold text-ink-subtle backdrop-blur">
              <span>{g.label}</span>
              <span className="tabular-nums">{formatPKR(g.total)}</span>
            </div>
          )}
          <ul className="divide-y divide-line">
            {g.items.map((e) => (
              <li key={e.id}>
                <Link href={`/expenses/${e.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-slate-50">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold"
                    style={{ background: `${e.division?.color ?? "#64748B"}1A`, color: e.division?.color ?? "#64748B" }}
                    aria-hidden
                  >
                    {(e.category?.name ?? "?").charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[15px] font-medium text-ink">{e.title}</span>
                      {e.receipt_path && <Paperclip className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-subtle">
                      <span className="font-medium" style={{ color: e.division?.color }}>
                        {e.division?.short_name}
                      </span>{" "}
                      · {e.category?.name}
                      {!groupByDate && <> · {formatDate(e.expense_date, { day: "numeric", month: "short" })}</>}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[15px] font-semibold tabular-nums text-navy-900">{formatPKR(e.amount)}</span>
                    <span className="block text-[11px] text-ink-subtle">{e.creator?.full_name?.replace(/^sir\s+/i, "").split(" ")[0]}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
