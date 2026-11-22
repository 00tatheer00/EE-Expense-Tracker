import Link from "next/link";
import { ArrowLeft, History, Trash2 } from "lucide-react";
import type { ActivityItem } from "@/lib/activity";
import { formatDate, formatDateTime, formatPKR, initials } from "@/lib/utils";
import { personColor } from "@/components/AddedBy";

function Row({ label, value }: { label: string; value: unknown }) {
  const v = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 text-sm last:border-b-0">
      <span className="text-ink-subtle">{label}</span>
      <span className="text-right font-medium text-ink">{v}</span>
    </div>
  );
}

/** Shown when someone opens an expense that has been deleted: who, when, and what it was. */
export function DeletedExpense({ item, snapshot }: { item: ActivityItem; snapshot: Record<string, unknown> }) {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/expenses" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" /> All expenses
      </Link>

      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="relative shrink-0">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: personColor(item.actorId) }}
            >
              {initials(item.actorName)}
            </span>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white ring-2 ring-red-50">
              <Trash2 className="h-3.5 w-3.5" />
            </span>
          </span>
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-700">This expense was deleted</div>
            <div className="mt-1 text-lg font-semibold text-navy-900">
              Deleted by {item.actorName}
            </div>
            <div className="text-sm text-ink-muted">{formatDateTime(item.at)}</div>
          </div>
        </div>
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="h-1" style={{ background: item.division?.color ?? "#94A3B8" }} />
        <div className="p-5 sm:p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-subtle">What was deleted</div>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-xl font-semibold text-ink line-through decoration-red-300">{item.title}</h1>
            <div className="text-2xl font-semibold tabular-nums text-red-600 line-through decoration-red-300">
              {formatPKR(item.amount, true)}
            </div>
          </div>
          <div className="mt-4">
            <Row label="Division" value={item.division?.name} />
            <Row label="Category" value={item.category} />
            <Row label="Expense date" value={item.expenseDate ? formatDate(item.expenseDate) : null} />
            <Row label="Paid to" value={snapshot.paid_to} />
            <Row label="Payment method" value={snapshot.payment_method} />
            <Row label="Where" value={snapshot.location} />
            <Row label="Event / purpose" value={snapshot.purpose} />
            <Row label="Originally added by" value={item.addedByName} />
            <Row label="Deleted by" value={item.actorName} />
          </div>
        </div>
      </div>

      <Link href="/activity?type=deleted" className="btn-secondary mt-5 w-full sm:w-auto">
        <History className="h-4 w-4" /> See all deleted expenses
      </Link>
    </div>
  );
}
