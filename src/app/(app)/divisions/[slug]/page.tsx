import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarRange, Download, Layers, Plus, Receipt } from "lucide-react";
import { getCategories, getCategoryMonthly, getDivisions, getMonthly, requireMember } from "@/lib/data";
import { availableYears, monthlySeries, summarize } from "@/lib/analytics";
import { EXPENSE_SELECT, type ExpenseWithRelations } from "@/lib/types";
import { formatPKR, pctChange, todayPK } from "@/lib/utils";
import { Delta, DivisionBadge, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { TrendChart } from "@/components/charts/TrendChart";
import { RankedBars } from "@/components/charts/RankedBars";
import { YearSelect } from "@/components/YearSelect";
import { RecentExpenses } from "@/components/RecentExpenses";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = (await getDivisions()).find((x) => x.slug === slug);
  return { title: d?.short_name ?? "Division" };
}

export default async function DivisionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase } = await requireMember();
  const divisions = await getDivisions();
  const division = divisions.find((d) => d.slug === slug);
  if (!division) notFound();

  const today = todayPK();
  const currentYear = Number(today.slice(0, 4));
  const year = Number(sp.year) || currentYear;

  const [categories, monthly, categoryRows, recentRes, yearRowsRes] = await Promise.all([
    getCategories(true),
    getMonthly(division.id),
    getCategoryMonthly({ from: `${year}-01-01`, to: `${year}-12-01`, divisionId: division.id }),
    supabase
      .from("expenses")
      .select(EXPENSE_SELECT)
      .eq("division_id", division.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("expenses")
      .select("amount, payment_method, paid_to")
      .eq("division_id", division.id)
      .gte("expense_date", `${year}-01-01`)
      .lte("expense_date", `${year}-12-31`)
      .limit(10000),
  ]);

  const recent = (recentRes.data ?? []) as ExpenseWithRelations[];
  const yearRows = (yearRowsRes.data ?? []) as { amount: number; payment_method: string; paid_to: string }[];

  const s = summarize(monthly, year, today);
  const series = [{ key: division.slug, name: division.short_name, color: division.color }];
  const monthlyData = monthlySeries(monthly, [division], year);
  const years = availableYears(monthly, currentYear);

  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const catTotals = new Map<string, number>();
  for (const r of categoryRows) catTotals.set(r.category_id, (catTotals.get(r.category_id) ?? 0) + r.total);

  const byMethod = new Map<string, number>();
  const byPayee = new Map<string, { label: string; value: number; n: number }>();
  for (const r of yearRows) {
    const amt = Number(r.amount);
    byMethod.set(r.payment_method, (byMethod.get(r.payment_method) ?? 0) + amt);
    const key = r.paid_to.trim().toLowerCase();
    const p = byPayee.get(key) ?? { label: r.paid_to.trim(), value: 0, n: 0 };
    p.value += amt;
    p.n += 1;
    byPayee.set(key, p);
  }

  return (
    <>
      <PageHeader
        eyebrow={<DivisionBadge name={division.short_name} color={division.color} />}
        title={division.name}
        description={division.description}
        actions={
          <>
            <YearSelect years={years} value={year} />
            <a
              href={`/api/export?division=${division.id}&from=${year}-01-01&to=${year}-12-31`}
              className="btn-secondary"
            >
              <Download className="h-4 w-4" /> Export
            </a>
            <Link href={`/expenses/new?division=${division.id}`} className="btn-success">
              <Plus className="h-4 w-4" /> Add expense
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              <Delta value={pctChange(s.thisMonth, s.lastMonth)} /> vs last month
            </span>
          }
          icon={<Receipt className="h-4 w-4" />}
          accent="orange"
        />
        <StatCard
          label={`Avg. per month (${year})`}
          value={formatPKR(s.avgMonthly)}
          sub={`${s.yearCount} expenses in ${year}`}
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="All time"
          value={formatPKR(s.allTime)}
          sub={`${s.allCount.toLocaleString()} expenses recorded`}
          icon={<Layers className="h-4 w-4" />}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card card-pad xl:col-span-2">
          <div className="mb-4">
            <div className="card-title">Monthly expenses · {year}</div>
            <div className="card-sub">{division.short_name} only</div>
          </div>
          <TrendChart data={monthlyData} series={series} />
        </div>
        <div className="card card-pad">
          <div className="card-title">By category</div>
          <div className="card-sub">{year} breakdown</div>
          <div className="mt-5">
            {catTotals.size ? (
              <RankedBars
                color={division.color}
                limit={10}
                items={[...catTotals.entries()].map(([id, v]) => ({ label: catName.get(id) ?? "Unknown", value: v }))}
              />
            ) : (
              <EmptyState title={`No expenses in ${year}`} />
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card card-pad">
          <div className="card-title">Top recipients</div>
          <div className="card-sub">Who received the most in {year}</div>
          <div className="mt-5">
            {byPayee.size ? (
              <RankedBars
                color={division.color}
                limit={6}
                items={[...byPayee.values()].map((p) => ({
                  label: p.label,
                  value: p.value,
                  sub: `${p.n}×`,
                }))}
              />
            ) : (
              <EmptyState title="Nothing yet" />
            )}
          </div>
        </div>
        <div className="card card-pad">
          <div className="card-title">Payment methods</div>
          <div className="card-sub">How {year} expenses were paid</div>
          <div className="mt-5">
            {byMethod.size ? (
              <RankedBars
                color={division.color}
                items={[...byMethod.entries()].map(([label, value]) => ({ label, value }))}
              />
            ) : (
              <EmptyState title="Nothing yet" />
            )}
          </div>
        </div>
      </section>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-3 pt-5 sm:px-6">
          <div>
            <div className="card-title">Recent {division.short_name} expenses</div>
            <div className="card-sub">Latest entries for this division</div>
          </div>
          <Link href={`/expenses?division=${division.id}`} className="btn-ghost btn-sm">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length ? (
          <RecentExpenses expenses={recent} showDivision={false} />
        ) : (
          <EmptyState
            title="No expenses yet"
            description={`Add the first ${division.short_name} expense.`}
            action={{ href: `/expenses/new?division=${division.id}`, label: "Add expense" }}
          />
        )}
      </section>
    </>
  );
}
