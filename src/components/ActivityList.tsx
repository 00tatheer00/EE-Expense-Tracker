import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { ActivityItem } from "@/lib/activity";
import { formatDate, formatDateTime, formatPKR, initials, relativeTime } from "@/lib/utils";
import { personColor } from "@/components/AddedBy";
import { cn } from "@/lib/utils";

const META = {
  created: { verb: "added", icon: Plus, chip: "bg-emerald-50 text-emerald-700", label: "Added" },
  updated: { verb: "edited", icon: Pencil, chip: "bg-navy-50 text-navy-600", label: "Edited" },
  deleted: { verb: "deleted", icon: Trash2, chip: "bg-red-50 text-red-700", label: "Deleted" },
} as const;

export function ActivityList({ items, compact = false }: { items: ActivityItem[]; compact?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((a) => {
        const m = META[a.action];
        const Icon = m.icon;
        return (
          <li key={a.id}>
            <Link
              href={`/expenses/${a.expenseId}`}
              className={cn(
                "flex items-start gap-3 px-4 py-3.5 transition hover:bg-slate-50 active:bg-slate-50 sm:px-6",
                a.action === "deleted" && "bg-red-50/30",
              )}
            >
              <span className="relative mt-0.5 shrink-0">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ background: personColor(a.actorId) }}
                >
                  {initials(a.actorName)}
                </span>
                <span
                  className={cn(
                    "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white",
                    m.chip,
                  )}
                >
                  <Icon className="h-3 w-3" />
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-snug text-ink">
                  <span className="font-semibold">{a.actorName}</span>{" "}
                  <span className={cn(a.action === "deleted" && "font-semibold text-red-600")}>{m.verb}</span>{" "}
                  <span className={cn("font-medium", a.action === "deleted" && "line-through decoration-red-300")}>
                    {a.title}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-subtle">
                  {a.division && (
                    <span className="font-medium" style={{ color: a.division.color }}>
                      {a.division.name}
                    </span>
                  )}
                  {a.category && <> · {a.category}</>}
                  {a.action === "updated" && a.changes.length > 0 && <> · changed {a.changes.join(", ")}</>}
                  {a.action === "deleted" && a.addedByName && <> · originally added by {a.addedByName}</>}
                  {!compact && a.expenseDate && <> · expense date {formatDate(a.expenseDate)}</>}
                </span>
                <span className="mt-0.5 block text-[11px] text-ink-subtle" title={formatDateTime(a.at)}>
                  {compact ? relativeTime(a.at) : formatDateTime(a.at)}
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span
                  className={cn(
                    "block text-sm font-semibold tabular-nums",
                    a.action === "deleted" ? "text-red-600 line-through decoration-red-300" : "text-navy-900",
                  )}
                >
                  {formatPKR(a.amount)}
                </span>
                {a.amountFrom !== undefined && (
                  <span className="block text-[11px] tabular-nums text-ink-subtle line-through">{formatPKR(a.amountFrom)}</span>
                )}
                <span className={cn("badge mt-1 px-2 text-[10px]", m.chip)}>{m.label}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
