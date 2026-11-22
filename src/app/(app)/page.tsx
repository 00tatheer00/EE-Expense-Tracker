import Link from "next/link";
import { ArrowRight, CalendarRange, Layers, Plus, Receipt, Wallet } from "lucide-react";
import { getCategories, getCategoryMonthly, getDivisions, getMonthly, requireMember } from "@/lib/data";
import { availableYears, divisionTotals, monthlySeries, summarize, yearlySeries } from "@/lib/analytics";
import { EXPENSE_SELECT, type ExpenseWithRelations } from "@/lib/types";
import { formatPKR, pctChange, todayPK } from "@/lib/utils";
import { Delta, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { TrendChart } from "@/components/charts/TrendChart";
import { RankedBars } from "@/components/charts/RankedBars";
import { ShareBar } from "@/components/charts/ShareBar";
import { YearSelect } from "@/components/YearSelect";
import { RecentExpenses } from "@/components/RecentExpenses";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { supabase, profile } = await requireMember();
  const sp = await searchParams;
  const today = todayPK();
  const currentYear = Number(today.slice(0, 4));
  const year = Number(sp.year) || currentYear;

  const [divisions, categories, monthly, categoryRows, recentRes] = await Promise.all([
    getDivisions(),
    getCategories(true),
    getMonthly(),
    getCategoryMonthly({ from: `${year}-01-01`, to: `${year}-12-01` }),
    supabase.from("expenses").select(EXPENSE_SELECT).order("created_at", { ascending: false }).limit(8),
  ]);
  const recent = (recentRes.data ?? []) as ExpenseWithRelations[];

  const s = summarize(monthly, year, today);
  const perDivision = divisionTotals(monthly, divisions, year, today);
  const series = divisions.map((d) => ({ key: d.slug, name: d.short_name, color: d.color }));
  const monthlyData = monthlySeries(monthly, divisions, year);
  const yearlyData = yearlySeries(monthly, divisions);
  const years = availableYears(monthly, currentYear);

  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const divById = new Map(divisions.map((d) => [d.id, d]));
  const catTotals = new Map<string, { label: string; value: number; color: string; sub: string }>();
  for (const r of categoryRows) {
    const d = divById.get(r.division_id);
    const key = r.category_id;
    const cur = catTotals.get(key) ?? {
      label: catName.get(r.category_id) ?? "Unknown",
      value: 0,
      color: d?.color ?? "#64748B",
      sub: d?.short_name ?? "",
    };
    cur.value += r.total;
    catTotals.set(key, cur);
  }

  const firstName = profile.full_name.replace(/^sir\s+/i, "").split(" ")[0];
  const hasData = s.allCount > 0;

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Combined overview of Emerging Edge, EEST and STYLONE."
        actions={
          <>
            <YearSelect years={years} value={year} />
            <Link href={`/reports?from=${year}-01-01&to=${year}-12-31`} className="btn-secondary">
              Reports
            </Link>
            <Link href="/expenses/new" className="btn-success">
              <Plus className="h-4 w-4" /> Add expense
            </Link>
          </>
        }
      />

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total combined (all time)"
          value={formatPKR(s.allTime)}
          sub={`${s.allCount.toLocaleString()} expenses recorded`}
          icon={<Wallet className="h-4 w-4" />}
          accent="navy"
        />
        <StatCard
          label={`${year} total`}
          value={formatPKR(s.yearTotal)}
          sub={
            <span className="flex items-center gap-1.5">
              <Delta value={pctChange(s.yearTotal, s.prevYearToDate)} /> vs same period {year - 1}
            </span>
          }
          icon={<CalendarRange className="h-4 w-4" />}
          accent="emerald"
        />
        <StatCard
          label="This month"
          value={formatPKR(s.thisMonth)}
          sub={
            <span className="flex items-center gap-1.5">
              <Delta value={pctChange(s.thisMonth, s.lastMonth)} /> vs last month ({formatPKR(s.lastMonth)})
            </span>
          }
          icon={<Receipt className="h-4 w-4" />}
          accent="orange"
        />
        <StatCard
          label={`Avg. per month (${year})`}
          value={formatPKR(s.avgMonthly)}
          sub={`${s.yearCount.toLocaleString()} expenses in ${year}`}
          icon={<Layers className="h-4 w-4" />}
          accent="navy"
        />
      </section>

      {/* Division summaries */}
      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {perDivision.map(({ division: d, yearTotal, yearCount, thisMonth, allTime }) => (
          <Link
            key={d.id}
            href={`/divisions/${d.slug}?year=${year}`}
            className="card group relative overflow-hidden p-5 transition hover:shadow-pop sm:p-6"
          >
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: d.color }} />
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-navy-900">{d.short_name}</div>
                <div className="mt-0.5 text-xs text-ink-subtle">{d.description}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-navy-900" />
            </div>
            <div className="mt-4 text-[26px] font-semibold tracking-tight tabular-nums text-navy-900">
              {formatPKR(yearTotal)}
            </div>
            <div className="text-xs text-ink-subtle">
              {year} · {yearCount} expenses
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-xs">
              <div>
                <div className="text-ink-subtle">This month</div>
                <div className="mt-0.5 font-semibold tabular-nums text-ink">{formatPKR(thisMonth)}</div>
              </div>
              <div>
                <div className="text-ink-subtle">All time</div>
                <div className="mt-0.5 font-semibold tabular-nums text-ink">{formatPKR(allTime)}</div>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* Trend + comparison */}
      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card card-pad xl:col-span-2">
          <div className="mb-4">
            <div className="card-title">Monthly expenses · {year}</div>
            <div className="card-sub">Stacked by business division</div>
          </div>
          <TrendChart data={monthlyData} series={series} />
        </div>

        <div className="card card-pad">
          <div className="card-title">Division comparison</div>
          <div className="card-sub">Share of {year} spending</div>
          <div className="mt-5">
            <ShareBar
              segments={perDivision.map((p) => ({
                label: p.division.short_name,
                value: p.yearTotal,
                color: p.division.color,
              }))}
            />
          </div>
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-ink-subtle">
                <th className="pb-2 font-semibold">Division</th>
                <th className="pb-2 text-right font-semibold">{year}</th>
                <th className="pb-2 text-right font-semibold">Avg / exp.</th>
              </tr>
            </thead>
            <tbody>
              {perDivision.map((p) => (
                <tr key={p.division.id} className="border-t border-line">
                  <td className="py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: p.division.color }} />
                      {p.division.short_name}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-medium tabular-nums">{formatPKR(p.yearTotal)}</td>
                  <td className="py-2.5 text-right tabular-nums text-ink-muted">
                    {p.yearCount ? formatPKR(p.yearTotal / p.yearCount) : "—"}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-line font-semibold text-navy-900">
                <td className="py-2.5">Combined</td>
                <td className="py-2.5 text-right tabular-nums">{formatPKR(s.yearTotal)}</td>
                <td className="py-2.5 text-right tabular-nums">
                  {s.yearCount ? formatPKR(s.yearTotal / s.yearCount) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Categories + yearly */}
      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card card-pad">
          <div className="card-title">Top categories · {year}</div>
          <div className="card-sub">Across all divisions, colored by division</div>
          <div className="mt-5">
            {catTotals.size ? (
              <RankedBars items={[...catTotals.values()]} limit={8} />
            ) : (
              <EmptyState title="No expenses this year" />
            )}
          </div>
        </div>
        <div className="card card-pad">
          <div className="mb-4">
            <div className="card-title">Yearly expenses</div>
            <div className="card-sub">All years on record, by division</div>
          </div>
          {yearlyData.length ? (
            <TrendChart data={yearlyData} series={series} height={260} />
          ) : (
            <EmptyState title="No data yet" />
          )}
        </div>
      </section>

      {/* Recent activity */}
      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-3 pt-5 sm:px-6">
          <div>
            <div className="card-title">Recent activity</div>
            <div className="card-sub">Latest expenses added by the team</div>
          </div>
          <Link href="/expenses" className="btn-ghost btn-sm">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {hasData ? (
          <RecentExpenses expenses={recent} />
        ) : (
          <EmptyState
            title="No expenses yet"
            description="Add the first expense to start building your reports."
            action={{ href: "/expenses/new", label: "Add expense" }}
          />
        )}
      </section>
    </>
  );
}
