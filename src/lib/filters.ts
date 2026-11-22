export type ExpenseFilters = {
  q?: string;
  division?: string;
  category?: string;
  method?: string;
  user?: string;
  from?: string;
  to?: string;
  sort?: string;
};

const UUID = /^[0-9a-f-]{36}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseFilters(sp: Record<string, string | string[] | undefined>): ExpenseFilters {
  const get = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const f: ExpenseFilters = {};
  const q = get("q");
  if (q) f.q = q.slice(0, 100);
  const division = get("division");
  if (division && UUID.test(division)) f.division = division;
  const category = get("category");
  if (category && UUID.test(category)) f.category = category;
  const user = get("user");
  if (user && UUID.test(user)) f.user = user;
  const method = get("method");
  if (method) f.method = method;
  const from = get("from");
  if (from && DATE.test(from)) f.from = from;
  const to = get("to");
  if (to && DATE.test(to)) f.to = to;
  const sort = get("sort");
  if (sort) f.sort = sort;
  return f;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function applyFilters<Q extends { eq: any; gte: any; lte: any; or: any }>(query: Q, f: ExpenseFilters): Q {
  let q: any = query;
  if (f.division) q = q.eq("division_id", f.division);
  if (f.category) q = q.eq("category_id", f.category);
  if (f.method) q = q.eq("payment_method", f.method);
  if (f.user) q = q.eq("created_by", f.user);
  if (f.from) q = q.gte("expense_date", f.from);
  if (f.to) q = q.lte("expense_date", f.to);
  if (f.q) {
    // Strip characters that have meaning in PostgREST filter syntax.
    const term = f.q.replace(/[%,()*\\:."]/g, " ").replace(/\s+/g, " ").trim();
    if (term) {
      const like = `%${term}%`;
      q = q.or(
        ["title", "paid_to", "purpose", "location", "description", "notes"]
          .map((c) => `${c}.ilike.${like}`)
          .join(","),
      );
    }
  }
  return q as Q;
}

export function applySort<Q extends { order: any }>(query: Q, sort?: string): Q {
  let q: any = query;
  switch (sort) {
    case "date_asc":
      q = q.order("expense_date", { ascending: true }).order("created_at", { ascending: true });
      break;
    case "amount_desc":
      q = q.order("amount", { ascending: false });
      break;
    case "amount_asc":
      q = q.order("amount", { ascending: true });
      break;
    case "created_desc":
      q = q.order("created_at", { ascending: false });
      break;
    default:
      q = q.order("expense_date", { ascending: false }).order("created_at", { ascending: false });
  }
  return q as Q;
}

export function filtersToQuery(f: ExpenseFilters, extra?: Record<string, string>) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => v && p.set(k, v));
  if (extra) Object.entries(extra).forEach(([k, v]) => p.set(k, v));
  return p.toString();
}
