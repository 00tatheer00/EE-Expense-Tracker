import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { getCategories, getDivisions, getProfiles, requireMember } from "@/lib/data";
import { applyFilters, filtersToQuery, parseFilters } from "@/lib/filters";
import { formatDate, formatPKR, MONTHS, todayPK } from "@/lib/utils";
import { DivisionBadge, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { FilterBar } from "@/components/FilterBar";
import { PrintButton } from "@/components/PrintButton";
import { RankedBars } from "@/components/charts/RankedBars";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

type Row = {
  id: string;
  title: string;
  amount: number;
  expense_date: string;
  division_id: string;
  category_id: string;
  payment_method: string;
  paid_to: string;
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  if (!sp.from && !sp.to) {
    const today = todayPK();
    const p = new URLSearchParams(sp as Record<string, string>);
    p.set("from", `${today.slice(0, 4)}-01-01`);
    p.set("to", today);
    redirect(`/reports?${p.toString()}`);
  }

  const filters = parseFilters(sp);
  const { supabase, profile } = await requireMember();
  const [divisions, categories, users] = await Promise.all([getDivisions(), getCategories(true), getProfiles()]);

  const { data, error } = await applyFilters(
    supabase
      .from("expenses")
      .select("id, title, amount, expense_date, division_id, category_id, payment_method, paid_to")
      .limit(50000),
    filters,
  );
  if (error) throw error;
  const rows = ((data ?? []) as Row[]).map((r) => ({ ...r, amount: Number(r.amount) }));

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const largest = rows.reduce<Row | null>((m, r) => (!m || r.amount > m.amount ? r : m), null);
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const shownDivisions = filters.division ? divisions.filter((d) => d.id === filters.division) : divisions;

  // Division summary
  const byDivision = shownDivisions.map((d) => {
    const rs = rows.filter((r) => r.division_id === d.id);
    const t = rs.reduce((s, r) => s + r.amount, 0);
    return { d, total: t, count: rs.length };
  });

  // Monthly matrix
  const monthKeys = [...new Set(rows.map((r) => r.expense_date.slice(0, 7)))].sort();
  const monthly = monthKeys.map((m) => {
    const cells = shownDivisions.map((d) =>
      rows.filter((r) => r.division_id === d.id && r.expense_date.startsWith(m)).reduce((s, r) => s + r.amount, 0),
    );
    return { m, cells, total: cells.reduce((a, b) => a + b, 0) };
  });

  // Category breakdown per division
  const catByDivision = shownDivisions.map((d) => {
    const map = new Map<string, { total: number; count: number }>();
    rows
      .filter((r) => r.division_id === d.id)
      .forEach((r) => {
        const c = map.get(r.category_id) ?? { total: 0, count: 0 };
        c.total += r.amount;
        c.count += 1;
        map.set(r.category_id, c);
      });
    const list = [...map.entries()]
      .map(([id, v]) => ({ name: catName.get(id) ?? "Unknown", ...v }))
      .sort((a, b) => b.total - a.total);
    return { d, list, total: list.reduce((s, x) => s + x.total, 0) };
  });

  // Payment methods
  const methods = new Map<string, number>();
  rows.forEach((r) => methods.set(r.payment_method, (methods.get(r.payment_method) ?? 0) + r.amount));

  const top = [...rows].sort((a, b) => b.amount - a.amount).slice(0, 10);
  const divById = new Map(divisions.map((d) => [d.id, d]));

  const period = `${filters.from ? formatDate(filters.from) : "Beginning"} – ${filters.to ? formatDate(filters.to) : "Today"}`;
  const scope = filters.division ? shownDivisions[0]?.name : "All divisions";

  return (
    <>
      <div className="print-only mb-6 border-b border-line pb-4">
        <div className="text-lg font-semibold text-navy-900">Emerging Edge — Financial Expense Report</div>
        <div className="text-sm text-ink-muted">
          {scope} · {period}
        </div>
        <div className="text-xs text-ink-subtle">
          Generated {new Date().toLocaleString("en-GB")} by {profile.full_name}
        </div>
      </div>

      <PageHeader
        title="Financial reports"
        description={`${scope} · ${period}`}
        actions={
          <>
            <a href={`/api/export?${filtersToQuery(filters)}`} className="btn-secondary">
              <Download className="h-4 w-4" /> Export CSV
            </a>
            <PrintButton />
          </>
        }
      />

      <div className="no-print">
        <FilterBar
          showSort={false}
          divisions={divisions.map((d) => ({ id: d.id, name: d.short_name }))}
          categories={categories.map((c) => ({ id: c.id, name: c.name, division_id: c.division_id }))}
          users={users.map((u) => ({ id: u.id, name: u.full_name }))}
        />
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState title="No expenses in this period" description="Adjust the date range or filters." />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Total spent" value={formatPKR(total)} accent="navy" />
            <StatCard label="Number of expenses" value={rows.length.toLocaleString()} />
            <StatCard label="Average expense" value={formatPKR(total / rows.length)} />
            <StatCard
              label="Largest expense"
              value={largest ? formatPKR(largest.amount) : "—"}
              sub={largest ? <span className="line-clamp-1">{largest.title}</span> : undefined}
            />
          </section>

          {/* Division summary */}
          <section className="card overflow-hidden">
            <div className="px-5 pb-3 pt-5 sm:px-6">
              <div className="card-title">Summary by division</div>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Division</th>
                    <th className="text-right">Expenses</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Average</th>
                    <th className="text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {byDivision.map(({ d, total: t, count }) => (
                    <tr key={d.id}>
                      <td>
                        <DivisionBadge name={d.short_name} color={d.color} />
                      </td>
                      <td className="text-right tabular-nums">{count}</td>
                      <td className="text-right font-semibold tabular-nums">{formatPKR(t, true)}</td>
                      <td className="text-right tabular-nums text-ink-muted">{count ? formatPKR(t / count) : "—"}</td>
                      <td className="text-right tabular-nums text-ink-muted">
                        {total ? ((t / total) * 100).toFixed(1) : "0.0"}%
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/70 font-semibold text-navy-900">
                    <td>Total</td>
                    <td className="text-right tabular-nums">{rows.length}</td>
                    <td className="text-right tabular-nums">{formatPKR(total, true)}</td>
                    <td className="text-right tabular-nums">{formatPKR(total / rows.length)}</td>
                    <td className="text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Monthly */}
          <section className="card overflow-hidden">
            <div className="px-5 pb-3 pt-5 sm:px-6">
              <div className="card-title">Monthly breakdown</div>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Month</th>
                    {shownDivisions.map((d) => (
                      <th key={d.id} className="text-right">
                        {d.short_name}
                      </th>
                    ))}
                    {shownDivisions.length > 1 && <th className="text-right">Total</th>}
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((r) => (
                    <tr key={r.m}>
                      <td className="whitespace-nowrap">
                        {MONTHS[Number(r.m.slice(5, 7)) - 1]} {r.m.slice(0, 4)}
                      </td>
                      {r.cells.map((c, i) => (
                        <td key={i} className="text-right tabular-nums text-ink-muted">
                          {c ? formatPKR(c) : "—"}
                        </td>
                      ))}
                      {shownDivisions.length > 1 && (
                        <td className="text-right font-semibold tabular-nums">{formatPKR(r.total)}</td>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-slate-50/70 font-semibold text-navy-900">
                    <td>Total</td>
                    {byDivision.map(({ d, total: t }) => (
                      <td key={d.id} className="text-right tabular-nums">
                        {formatPKR(t)}
                      </td>
                    ))}
                    {shownDivisions.length > 1 && <td className="text-right tabular-nums">{formatPKR(total)}</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Categories by division */}
          <section className={`grid grid-cols-1 gap-4 ${shownDivisions.length > 1 ? "xl:grid-cols-3" : ""}`}>
            {catByDivision.map(({ d, list, total: t }) => (
              <div key={d.id} className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 pb-3 pt-5">
                  <div>
                    <div className="card-title">{d.short_name} · categories</div>
                    <div className="card-sub">{formatPKR(t)} total</div>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                </div>
                {list.length ? (
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th className="text-right">#</th>
                        <th className="text-right">Total</th>
                        <th className="text-right">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((c) => (
                        <tr key={c.name}>
                          <td>{c.name}</td>
                          <td className="text-right tabular-nums text-ink-muted">{c.count}</td>
                          <td className="text-right font-medium tabular-nums">{formatPKR(c.total)}</td>
                          <td className="text-right tabular-nums text-ink-muted">{((c.total / t) * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-5 pb-6 text-sm text-ink-subtle">No expenses.</div>
                )}
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="card card-pad xl:col-span-2">
              <div className="card-title">Payment methods</div>
              <div className="mt-5">
                <RankedBars items={[...methods.entries()].map(([label, value]) => ({ label, value }))} />
              </div>
            </div>
            <div className="card overflow-hidden xl:col-span-3">
              <div className="px-5 pb-3 pt-5 sm:px-6">
                <div className="card-title">Largest expenses</div>
              </div>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Expense</th>
                      <th>Division</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((r) => {
                      const d = divById.get(r.division_id);
                      return (
                        <tr key={r.id}>
                          <td className="whitespace-nowrap text-ink-muted">{formatDate(r.expense_date)}</td>
                          <td className="max-w-[240px]">
                            <Link href={`/expenses/${r.id}`} className="block truncate font-medium hover:text-navy-600">
                              {r.title}
                            </Link>
                            <span className="block truncate text-xs text-ink-subtle">
                              {catName.get(r.category_id)} · {r.paid_to}
                            </span>
                          </td>
                          <td>{d && <DivisionBadge name={d.short_name} color={d.color} />}</td>
                          <td className="whitespace-nowrap text-right font-semibold tabular-nums">
                            {formatPKR(r.amount, true)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
