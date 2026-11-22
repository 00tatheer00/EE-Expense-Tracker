import Link from "next/link";
import { Paperclip } from "lucide-react";
import type { ExpenseWithRelations } from "@/lib/types";
import { formatDate, formatPKR, initials, relativeTime } from "@/lib/utils";

export function RecentExpenses({ expenses, showDivision = true }: { expenses: ExpenseWithRelations[]; showDivision?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {expenses.map((e) => (
        <li key={e.id}>
          <Link
            href={`/expenses/${e.id}`}
            className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 sm:px-6"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: e.division?.color ?? "#64748B" }}
              title={e.creator?.full_name}
            >
              {initials(e.creator?.full_name ?? "?")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-ink">{e.title}</span>
                {e.receipt_path && <Paperclip className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />}
              </div>
              <div className="mt-0.5 truncate text-xs text-ink-subtle">
                {showDivision && <>{e.division?.short_name} · </>}
                {e.category?.name} · {e.creator?.full_name?.split(" ")[0] ?? "Unknown"} ·{" "}
                {relativeTime(e.created_at)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold tabular-nums text-navy-900">{formatPKR(e.amount)}</div>
              <div className="text-[11px] text-ink-subtle">{formatDate(e.expense_date, { day: "2-digit", month: "short" })}</div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
