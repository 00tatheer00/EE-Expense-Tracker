import "server-only";
import { randomUUID } from "crypto";
import { buildStore, type DemoStore, type Row } from "./seed";
import { isDemoUser } from "./config";
import { todayPK } from "@/lib/utils";

/* In-memory store, kept on globalThis so it survives hot reloads (resets on server restart). */
const g = globalThis as unknown as { __eeDemoStore?: DemoStore };
export function getStore() {
  if (!g.__eeDemoStore) g.__eeDemoStore = buildStore(todayPK());
  return g.__eeDemoStore;
}

type Result = { data: unknown; error: { message: string; code?: string } | null; count?: number | null };

function decorateExpense(s: DemoStore, e: Row) {
  const d = s.divisions.find((x) => x.id === e.division_id);
  const c = s.categories.find((x) => x.id === e.category_id);
  const p = s.profiles.find((x) => x.id === e.created_by);
  return {
    ...e,
    division: d ? { id: d.id, slug: d.slug, name: d.name, short_name: d.short_name, color: d.color } : null,
    category: c ? { id: c.id, name: c.name } : null,
    creator: p ? { id: p.id, full_name: p.full_name } : null,
  };
}

function monthlyView(s: DemoStore, withCategory: boolean): Row[] {
  const map = new Map<string, Row>();
  for (const e of s.expenses) {
    const month = `${String(e.expense_date).slice(0, 7)}-01`;
    const key = `${e.division_id}|${withCategory ? e.category_id : ""}|${month}`;
    const cur =
      map.get(key) ??
      ({
        id: key,
        division_id: e.division_id,
        ...(withCategory ? { category_id: e.category_id } : {}),
        month,
        total: 0,
        count: 0,
      } as Row);
    cur.total = Number(cur.total) + Number(e.amount);
    cur.count = Number(cur.count) + 1;
    map.set(key, cur);
  }
  return [...map.values()];
}

class DemoQuery implements PromiseLike<Result> {
  private op: "select" | "insert" | "update" | "delete" = "select";
  private filters: ((r: Row) => boolean)[] = [];
  private orders: { col: string; asc: boolean }[] = [];
  private rangeFrom?: number;
  private rangeTo?: number;
  private lim?: number;
  private wantCount = false;
  private head = false;
  private payload: Row | Row[] | Record<string, unknown> | null = null;
  private singleMode: null | "single" | "maybe" = null;

  constructor(
    private table: string,
    private userId: string | null,
  ) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.head = true;
    return this;
  }
  insert(p: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = "insert";
    this.payload = p as Row;
    return this;
  }
  update(p: Record<string, unknown>) {
    this.op = "update";
    this.payload = p;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(col: string, val: unknown) {
    this.filters.push((r) => String(r[col]) === String(val));
    return this;
  }
  gte(col: string, val: string | number) {
    this.filters.push((r) => (r[col] as string | number) >= val);
    return this;
  }
  lte(col: string, val: string | number) {
    this.filters.push((r) => (r[col] as string | number) <= val);
    return this;
  }
  or(expr: string) {
    const parts = expr.split(",").map((p) => {
      const [col, , ...rest] = p.split(".");
      return { col, term: rest.join(".").replace(/%/g, "").toLowerCase() };
    });
    this.filters.push((r) => parts.some(({ col, term }) => String(r[col] ?? "").toLowerCase().includes(term)));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending ?? true });
    return this;
  }
  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }
  limit(n: number) {
    this.lim = n;
    return this;
  }
  single() {
    this.singleMode = "single";
    return this;
  }
  maybeSingle() {
    this.singleMode = "maybe";
    return this;
  }

  then<A = Result, B = never>(
    onfulfilled?: ((value: Result) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return Promise.resolve()
      .then(() => this.exec())
      .then(onfulfilled, onrejected);
  }

  private source(s: DemoStore): Row[] {
    if (this.table === "expense_monthly") return monthlyView(s, false);
    if (this.table === "expense_category_monthly") return monthlyView(s, true);
    const t = (s as unknown as Record<string, Row[]>)[this.table];
    if (!t) throw new Error(`Demo: unknown table ${this.table}`);
    return t;
  }

  private shape(s: DemoStore, rows: Row[]) {
    return this.table === "expenses" ? rows.map((r) => decorateExpense(s, r)) : rows.map((r) => ({ ...r }));
  }

  private finish(s: DemoStore, rows: Row[], count?: number): Result {
    const data = this.shape(s, rows);
    if (this.singleMode) {
      if (data.length === 0) {
        return this.singleMode === "maybe"
          ? { data: null, error: null }
          : { data: null, error: { message: "No rows found", code: "PGRST116" } };
      }
      return { data: data[0], error: null };
    }
    return { data: this.head ? null : data, error: null, count: this.wantCount ? (count ?? data.length) : null };
  }

  private audit(s: DemoStore, action: string, expenseId: string, oldData: Row | null, newData: Row | null) {
    s.expense_audit.push({
      id: String(++s.auditSeq),
      expense_id: expenseId,
      action,
      actor_id: this.userId,
      changed_at: new Date().toISOString(),
      old_data: oldData ? { ...oldData } : null,
      new_data: newData ? { ...newData } : null,
    });
  }

  private exec(): Result {
    const s = getStore();
    const src = this.source(s);
    const matches = (r: Row) => this.filters.every((f) => f(r));

    if (this.op === "select") {
      let rows = src.filter(matches);
      const count = rows.length;
      if (this.orders.length) {
        rows = [...rows].sort((a, b) => {
          for (const { col, asc } of this.orders) {
            const av = a[col] as string | number;
            const bv = b[col] as string | number;
            if (av === bv) continue;
            const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
            return asc ? cmp : -cmp;
          }
          return 0;
        });
      }
      if (this.rangeFrom !== undefined) rows = rows.slice(this.rangeFrom, (this.rangeTo ?? rows.length) + 1);
      if (this.lim !== undefined) rows = rows.slice(0, this.lim);
      return this.finish(s, rows, count);
    }

    if (this.op === "insert") {
      const input = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      const created: Row[] = [];
      for (const p of input) {
        if (this.table === "categories") {
          if (s.categories.some((c) => c.division_id === p.division_id && String(c.name).toLowerCase() === String(p.name).toLowerCase())) {
            return { data: null, error: { message: "duplicate key", code: "23505" } };
          }
          const row = { is_active: true, created_at: new Date().toISOString(), ...p, id: randomUUID() } as Row;
          s.categories.push(row);
          created.push(row);
        } else if (this.table === "expenses") {
          const cat = s.categories.find((c) => c.id === p.category_id);
          if (!cat || cat.division_id !== p.division_id) {
            return { data: null, error: { message: "Category does not belong to this division", code: "23503" } };
          }
          const now = new Date().toISOString();
          const row = {
            ...p,
            id: randomUUID(),
            currency: "PKR",
            amount: Number(p.amount),
            created_by: this.userId,
            updated_by: this.userId,
            created_at: now,
            updated_at: now,
          } as Row;
          s.expenses.push(row);
          this.audit(s, "created", row.id, null, row);
          created.push(row);
        } else {
          return { data: null, error: { message: `Demo: inserts into ${this.table} are not allowed` } };
        }
      }
      return this.finish(s, created);
    }

    if (this.op === "update") {
      const patch = this.payload as Record<string, unknown>;
      const rows = src.filter(matches);
      if (this.table === "categories" && typeof patch.name === "string") {
        for (const r of rows) {
          const dup = s.categories.some(
            (c) => c.id !== r.id && c.division_id === r.division_id && String(c.name).toLowerCase() === String(patch.name).toLowerCase(),
          );
          if (dup) return { data: null, error: { message: "duplicate key", code: "23505" } };
        }
      }
      if (this.table === "expenses" && patch.category_id) {
        const cat = s.categories.find((c) => c.id === patch.category_id);
        if (!cat || cat.division_id !== patch.division_id) {
          return { data: null, error: { message: "Category does not belong to this division", code: "23503" } };
        }
      }
      if (!["categories", "expenses"].includes(this.table)) {
        return { data: null, error: { message: `Demo: updates to ${this.table} are not allowed` } };
      }
      for (const r of rows) {
        const before = { ...r };
        Object.assign(r, patch);
        if (this.table === "expenses") {
          r.amount = Number(r.amount);
          r.updated_by = this.userId;
          r.updated_at = new Date().toISOString();
          this.audit(s, "updated", r.id, before, r);
        }
      }
      return this.finish(s, rows);
    }

    // delete
    if (this.table !== "expenses") return { data: null, error: { message: `Demo: deletes from ${this.table} are not allowed` } };
    const doomed = s.expenses.filter(matches);
    s.expenses = s.expenses.filter((r) => !matches(r));
    doomed.forEach((r) => this.audit(s, "deleted", r.id, r, null));
    return this.finish(s, doomed);
  }
}

/** Sample receipt image rendered from the expense it belongs to. */
function receiptDataUri(path: string) {
  const s = getStore();
  const e = s.expenses.find((x) => x.receipt_path === path);
  const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const amount = e ? `Rs ${Number(e.amount).toLocaleString("en-PK")}` : "Rs —";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="560" viewBox="0 0 420 560">
<rect width="420" height="560" fill="#F1F4F9"/>
<rect x="40" y="24" width="340" height="512" rx="6" fill="#fff" stroke="#E2E8F0"/>
<text x="210" y="80" font-family="Courier New,monospace" font-size="20" font-weight="bold" text-anchor="middle" fill="#0B1A3A">${esc(e?.paid_to ?? "Vendor")}</text>
<text x="210" y="104" font-family="Courier New,monospace" font-size="12" text-anchor="middle" fill="#64748B">${esc(e?.location ?? "")}</text>
<line x1="64" y1="128" x2="356" y2="128" stroke="#CBD5E1" stroke-dasharray="4 4"/>
<text x="64" y="160" font-family="Courier New,monospace" font-size="13" fill="#334155">INVOICE / RECEIPT</text>
<text x="64" y="184" font-family="Courier New,monospace" font-size="13" fill="#334155">Date: ${esc(e?.expense_date ?? "")}</text>
<text x="64" y="232" font-family="Courier New,monospace" font-size="13" fill="#0F172A">${esc(String(e?.title ?? "Item").slice(0, 34))}</text>
<text x="356" y="256" font-family="Courier New,monospace" font-size="13" text-anchor="end" fill="#0F172A">${esc(amount)}</text>
<line x1="64" y1="300" x2="356" y2="300" stroke="#CBD5E1" stroke-dasharray="4 4"/>
<text x="64" y="336" font-family="Courier New,monospace" font-size="16" font-weight="bold" fill="#0B1A3A">TOTAL</text>
<text x="356" y="336" font-family="Courier New,monospace" font-size="16" font-weight="bold" text-anchor="end" fill="#0B1A3A">${esc(amount)}</text>
<text x="64" y="370" font-family="Courier New,monospace" font-size="12" fill="#64748B">Paid via ${esc(e?.payment_method ?? "")}</text>
<text x="210" y="480" font-family="Courier New,monospace" font-size="12" text-anchor="middle" fill="#94A3B8">*** SAMPLE RECEIPT (DEMO) ***</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createDemoServerClient(userId: string | undefined) {
  const uid = isDemoUser(userId) ? userId! : null;
  const s = getStore();
  return {
    from: (table: string) => new DemoQuery(table, uid),
    auth: {
      async getUser() {
        const p = uid ? s.profiles.find((x) => x.id === uid) : null;
        return { data: { user: p ? { id: p.id, email: p.email } : null }, error: null };
      },
      async signOut() {
        return { error: null };
      },
      async exchangeCodeForSession() {
        return { data: {}, error: null };
      },
    },
    storage: {
      from: () => ({
        async createSignedUrl(path: string) {
          return { data: { signedUrl: receiptDataUri(path) }, error: null };
        },
        async remove() {
          return { data: [], error: null };
        },
        async upload() {
          return { data: {}, error: null };
        },
      }),
    },
  };
}
