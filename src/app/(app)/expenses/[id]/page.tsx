import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  History,
  Mail,
  MapPin,
  Pencil,
  Tag,
  Target,
  UserRound,
} from "lucide-react";
import { getProfiles, requireMember } from "@/lib/data";
import { getDeletion } from "@/lib/activity";
import { DeletedExpense } from "@/components/DeletedExpense";
import { EXPENSE_SELECT, type ExpenseWithRelations } from "@/lib/types";
import { formatDate, formatDateTime, formatPKR, initials } from "@/lib/utils";
import { personColor } from "@/components/AddedBy";
import { DivisionBadge } from "@/components/ui";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Expense" };

type AuditRow = {
  id: number;
  action: "created" | "updated" | "deleted";
  actor_id: string | null;
  changed_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
};

const FIELD_LABELS: Record<string, string> = {
  title: "title",
  description: "description",
  amount: "amount",
  expense_date: "date",
  paid_to: "recipient",
  location: "location",
  purpose: "event/purpose",
  payment_method: "payment method",
  notes: "notes",
  category_id: "category",
  division_id: "division",
};

function changedFields(a: AuditRow) {
  if (a.action !== "updated" || !a.old_data || !a.new_data) return [];
  return Object.keys(FIELD_LABELS).filter(
    (k) => JSON.stringify(a.old_data![k]) !== JSON.stringify(a.new_data![k]),
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-ink-subtle">{label}</div>
        <div className="mt-0.5 break-words text-sm font-medium text-ink">
          {value || <span className="font-normal text-slate-400">—</span>}
        </div>
      </div>
    </div>
  );
}

export default async function ExpenseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string; email?: string; reason?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireMember();

  const [{ data }, { data: audit }, profiles] = await Promise.all([
    supabase.from("expenses").select(EXPENSE_SELECT).eq("id", id).maybeSingle(),
    supabase
      .from("expense_audit")
      .select("id, action, actor_id, changed_at, old_data, new_data")
      .eq("expense_id", id)
      .order("changed_at", { ascending: false })
      .limit(50),
    getProfiles(),
  ]);
  const e = data as ExpenseWithRelations | null;
  if (!e) {
    const deletion = await getDeletion(id);
    if (!deletion) notFound();
    return <DeletedExpense item={deletion.item} snapshot={deletion.snapshot} />;
  }

  const names = new Map(profiles.map((p) => [p.id, p.full_name]));


  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/expenses" className="no-print mb-4 inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" /> All expenses
      </Link>

      {sp.created && sp.email === "demo" && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            Expense saved. In the live system an email now goes to all three authorized users (demo mode doesn’t send it).
          </span>
          <a href={`/email-preview/${e.id}`} className="btn-success btn-sm shrink-0">
            <Mail className="h-3.5 w-3.5" /> Preview the email
          </a>
        </div>
      )}
      {sp.created && sp.email !== "demo" && (
        <div
          className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            sp.email === "sent"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-accent-100 bg-accent-50 text-accent-600"
          }`}
        >
          {sp.email === "sent" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>
            Expense saved.{" "}
            {sp.email === "sent"
              ? "An email notification has been sent to all authorized users."
              : "The expense is saved, but the email notification could not be sent."}
            {sp.email !== "sent" && sp.reason && (
              <span className="mt-1 block text-xs opacity-90">Reason: {sp.reason.slice(0, 300)}</span>
            )}
            {sp.email !== "sent" && (
              <Link href="/account#email" className="mt-1 block text-xs font-semibold underline">
                Check email settings →
              </Link>
            )}
          </span>
        </div>
      )}
      {sp.updated && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Changes saved.
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="h-1" style={{ background: e.division?.color }} />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div className="min-w-0">
            {e.division && <DivisionBadge name={e.division.name} color={e.division.color} />}
            <h1 className="mt-3 text-xl font-semibold text-navy-900 sm:text-2xl">{e.title}</h1>
            <div className="mt-3 inline-flex items-center gap-3 rounded-2xl border border-line bg-slate-50 py-2 pl-2 pr-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: personColor(e.creator?.id) }}
              >
                {initials(e.creator?.full_name ?? "?")}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Added by</span>
                <span className="block truncate text-[15px] font-semibold text-navy-900">
                  {e.creator?.full_name ?? "Unknown"}
                </span>
                <span className="block text-xs text-ink-subtle">{formatDateTime(e.created_at)}</span>
              </span>
            </div>
            {e.updated_at !== e.created_at && e.updated_by && e.updated_by !== e.created_by && (
              <div className="mt-2 text-xs text-ink-subtle">
                Last edited by <span className="font-medium text-ink">{names.get(e.updated_by) ?? "someone"}</span> ·{" "}
                {formatDateTime(e.updated_at)}
              </div>
            )}
          </div>
          <div className="sm:text-right">
            <div className="text-3xl font-semibold tracking-tight tabular-nums text-navy-900">
              {formatPKR(e.amount, true)}
            </div>
            <div className="no-print mt-3 flex gap-2 sm:justify-end">
              <Link href={`/expenses/${e.id}/edit`} className="btn-secondary">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <DeleteExpenseButton id={e.id} title={e.title} />
            </div>
            <a
              href={`/email-preview/${e.id}`}
              className="no-print mt-2 inline-flex items-center gap-1 text-xs font-medium text-ink-subtle hover:text-emerald-600"
            >
              <Mail className="h-3.5 w-3.5" /> View notification email
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 border-t border-line p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
          <Detail icon={CalendarDays} label="Date" value={formatDate(e.expense_date, { weekday: "short", day: "2-digit", month: "long", year: "numeric" })} />
          <Detail icon={Tag} label="Category" value={e.category?.name} />
          <Detail icon={UserRound} label="Paid to" value={e.paid_to} />
          <Detail icon={CreditCard} label="Payment method" value={e.payment_method} />
          <Detail icon={MapPin} label="Where" value={e.location} />
          <Detail icon={Target} label="Event / purpose" value={e.purpose} />
        </div>

        {(e.description || e.notes) && (
          <div className="grid grid-cols-1 gap-5 border-t border-line p-5 sm:p-7 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Description</div>
              <p className="mt-2 whitespace-pre-line text-sm text-ink">{e.description || "—"}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Additional notes</div>
              <p className="mt-2 whitespace-pre-line text-sm text-ink">{e.notes || "—"}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="card card-pad">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-ink-subtle" />
            <div className="card-title">History</div>
          </div>
          <ol className="mt-4 space-y-4">
            {((audit ?? []) as AuditRow[]).map((a) => {
              const fields = changedFields(a);
              return (
                <li key={a.id} className="relative pl-5">
                  <span
                    className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${
                      a.action === "created" ? "bg-emerald-500" : "bg-navy-500"
                    }`}
                  />
                  <div className="text-sm text-ink">
                    <span className="font-medium">{(a.actor_id && names.get(a.actor_id)) || "System"}</span>{" "}
                    {a.action === "created" ? "created this expense" : "updated"}
                    {fields.length > 0 && <> {fields.map((f) => FIELD_LABELS[f]).join(", ")}</>}
                  </div>
                  {a.action === "updated" && fields.includes("amount") && (
                    <div className="text-xs text-ink-subtle">
                      Amount: {formatPKR(Number(a.old_data?.amount))} → {formatPKR(Number(a.new_data?.amount))}
                    </div>
                  )}
                  <div className="text-xs text-ink-subtle">{formatDateTime(a.changed_at)}</div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
