import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Paperclip, Plus } from "lucide-react";
import { getCategories, getDivisions, getProfiles, requireMember } from "@/lib/data";
import { applyFilters, applySort, filtersToQuery, parseFilters } from "@/lib/filters";
import { PAGE_SIZE } from "@/lib/constants";
import { EXPENSE_SELECT, type ExpenseWithRelations } from "@/lib/types";
import { formatDate, formatPKR } from "@/lib/utils";
import { DivisionBadge, EmptyState, PageHeader } from "@/components/ui";
import { FilterBar } from "@/components/FilterBar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Expenses" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const page = Math.max(1, Number(sp.page) || 1);
  const { supabase } = await requireMember();

  const [divisions, categories, users] = await Promise.all([getDivisions(), getCategories(true), getProfiles()]);

  const listQuery = applySort(
    applyFilters(supabase.from("expenses").select(EXPENSE_SELECT, { count: "exact" }), filters),
    filters.sort,
  ).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const sumQuery = applyFilters(supabase.from("expenses").select("amount").limit(50000), filters);

  const [{ data, count, error }, { data: amounts }] = await Promise.all([listQuery, sumQuery]);
  if (error) throw error;

  const expenses = (data ?? []) as ExpenseWithRelations[];
  const total = (amounts ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalCount = count ?? 0;
  const pages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const qs = (p: number) => filtersToQuery(filters, { page: String(p) });

  return (
    <>
      <PageHeader
        title="Expenses"
        description="All expense records across the three divisions."
        actions={
          <>
            <a href={`/api/export?${filtersToQuery(filters)}`} className="btn-secondary">
              <Download className="h-4 w-4" /> Export CSV
            </a>
            <Link href="/expenses/new" className="btn-success">
              <Plus className="h-4 w-4" /> Add expense
            </Link>
          </>
        }
      />

      <FilterBar
        divisions={divisions.map((d) => ({ id: d.id, name: d.short_name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name, division_id: c.division_id }))}
        users={users.map((u) => ({ id: u.id, name: u.full_name }))}
      />

      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 px-1 text-sm">
        <span className="text-ink-subtle">
          <span className="font-semibold text-ink">{totalCount.toLocaleString()}</span> expenses
        </span>
        <span className="text-ink-subtle">
          Total: <span className="font-semibold tabular-nums text-navy-900">{formatPKR(total, true)}</span>
        </span>
      </div>

      <div className="card overflow-hidden">
        {expenses.length === 0 ? (
          <EmptyState
            title="No expenses found"
            description="Try changing the filters or add a new expense."
            action={{ href: "/expenses/new", label: "Add expense" }}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expense</th>
                    <th>Division</th>
                    <th>Category</th>
                    <th>Method</th>
                    <th>Added by</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="group hover:bg-slate-50/70">
                      <td className="whitespace-nowrap text-ink-muted">{formatDate(e.expense_date)}</td>
                      <td className="max-w-[280px]">
                        <Link href={`/expenses/${e.id}`} className="block">
                          <span className="flex items-center gap-1.5 font-medium text-ink group-hover:text-navy-600">
                            <span className="truncate">{e.title}</span>
                            {e.receipt_path && <Paperclip className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />}
                          </span>
                          <span className="block truncate text-xs text-ink-subtle">
                            {e.paid_to}
                            {e.purpose ? ` · ${e.purpose}` : ""}
                          </span>
                        </Link>
                      </td>
                      <td>
                        {e.division && <DivisionBadge name={e.division.short_name} color={e.division.color} />}
                      </td>
                      <td className="text-ink-muted">{e.category?.name}</td>
                      <td className="whitespace-nowrap text-ink-muted">{e.payment_method}</td>
                      <td className="whitespace-nowrap text-ink-muted">{e.creator?.full_name}</td>
                      <td className="whitespace-nowrap text-right font-semibold tabular-nums text-navy-900">
                        {formatPKR(e.amount, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y divide-line md:hidden">
              {expenses.map((e) => (
                <li key={e.id}>
                  <Link href={`/expenses/${e.id}`} className="block px-4 py-3.5 active:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
                          <span className="truncate">{e.title}</span>
                          {e.receipt_path && <Paperclip className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-ink-subtle">
                          {e.category?.name} · {e.paid_to}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-sm font-semibold tabular-nums text-navy-900">
                        {formatPKR(e.amount)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      {e.division && <DivisionBadge name={e.division.short_name} color={e.division.color} />}
                      <span className="text-[11px] text-ink-subtle">
                        {formatDate(e.expense_date)} · {e.creator?.full_name?.split(" ")[0]}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink-subtle">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={`/expenses?${qs(page - 1)}`} className="btn-secondary btn-sm">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            ) : (
              <span className="btn-secondary btn-sm pointer-events-none opacity-50">
                <ChevronLeft className="h-4 w-4" /> Previous
              </span>
            )}
            {page < pages ? (
              <Link href={`/expenses?${qs(page + 1)}`} className="btn-secondary btn-sm">
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="btn-secondary btn-sm pointer-events-none opacity-50">
                Next <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
