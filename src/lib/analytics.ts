import type { Division, MonthlyRow } from "@/lib/types";
import { MONTHS } from "@/lib/utils";

export function yearOf(month: string) {
  return Number(month.slice(0, 4));
}
export function monthIdx(month: string) {
  return Number(month.slice(5, 7)) - 1;
}

export function summarize(rows: MonthlyRow[], year: number, today: string) {
  const curYear = Number(today.slice(0, 4));
  const curMonth = Number(today.slice(5, 7)) - 1;
  const prevMonthYear = curMonth === 0 ? curYear - 1 : curYear;
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;

  let allTime = 0,
    allCount = 0,
    yearTotal = 0,
    yearCount = 0,
    prevYearTotal = 0,
    prevYearToDate = 0,
    thisMonth = 0,
    lastMonth = 0;

  for (const r of rows) {
    const y = yearOf(r.month);
    const m = monthIdx(r.month);
    allTime += r.total;
    allCount += r.count;
    if (y === year) {
      yearTotal += r.total;
      yearCount += r.count;
    }
    if (y === year - 1) {
      prevYearTotal += r.total;
      // Same-period comparison when viewing the current year.
      if (year !== curYear || m <= curMonth) prevYearToDate += r.total;
    }
    if (y === curYear && m === curMonth) thisMonth += r.total;
    if (y === prevMonthYear && m === prevMonth) lastMonth += r.total;
  }

  const monthsElapsed = year === curYear ? curMonth + 1 : 12;
  return {
    allTime,
    allCount,
    yearTotal,
    yearCount,
    prevYearTotal,
    prevYearToDate,
    thisMonth,
    lastMonth,
    avgMonthly: yearTotal / monthsElapsed,
  };
}

/** 12 rows (Jan–Dec) with a key per division slug. */
export function monthlySeries(rows: MonthlyRow[], divisions: Division[], year: number) {
  const byId = new Map(divisions.map((d) => [d.id, d.slug]));
  const data = MONTHS.map((label) => {
    const o: Record<string, string | number> = { label };
    for (const d of divisions) o[d.slug] = 0;
    return o;
  });
  for (const r of rows) {
    if (yearOf(r.month) !== year) continue;
    const slug = byId.get(r.division_id);
    if (!slug) continue;
    data[monthIdx(r.month)][slug] = Number(data[monthIdx(r.month)][slug]) + r.total;
  }
  return data;
}

/** One row per year that has data, keyed by division slug. */
export function yearlySeries(rows: MonthlyRow[], divisions: Division[]) {
  const byId = new Map(divisions.map((d) => [d.id, d.slug]));
  const years = new Map<number, Record<string, string | number>>();
  for (const r of rows) {
    const y = yearOf(r.month);
    if (!years.has(y)) {
      const o: Record<string, string | number> = { label: String(y) };
      for (const d of divisions) o[d.slug] = 0;
      years.set(y, o);
    }
    const slug = byId.get(r.division_id);
    if (slug) years.get(y)![slug] = Number(years.get(y)![slug]) + r.total;
  }
  return [...years.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

export function availableYears(rows: MonthlyRow[], current: number) {
  const s = new Set<number>([current]);
  rows.forEach((r) => s.add(yearOf(r.month)));
  return [...s].sort((a, b) => b - a);
}

export function divisionTotals(rows: MonthlyRow[], divisions: Division[], year: number, today: string) {
  const curYear = Number(today.slice(0, 4));
  const curMonth = Number(today.slice(5, 7)) - 1;
  return divisions.map((d) => {
    let yearTotal = 0,
      yearCount = 0,
      thisMonth = 0,
      allTime = 0;
    for (const r of rows) {
      if (r.division_id !== d.id) continue;
      allTime += r.total;
      if (yearOf(r.month) === year) {
        yearTotal += r.total;
        yearCount += r.count;
      }
      if (yearOf(r.month) === curYear && monthIdx(r.month) === curMonth) thisMonth += r.total;
    }
    return { division: d, yearTotal, yearCount, thisMonth, allTime };
  });
}
