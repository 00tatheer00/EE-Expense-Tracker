import "server-only";
import { getCategories, getDivisions, getProfiles, requireMember } from "@/lib/data";

export type ActivityAction = "created" | "updated" | "deleted";

export type ActivityItem = {
  id: string;
  expenseId: string;
  action: ActivityAction;
  at: string;
  actorId: string | null;
  actorName: string;
  title: string;
  amount: number;
  expenseDate: string | null;
  division: { name: string; color: string } | null;
  category: string | null;
  addedByName: string | null;
  /** For edits: which fields changed (human labels). */
  changes: string[];
  amountFrom?: number;
};

type AuditRow = {
  id: number | string;
  expense_id: string;
  action: ActivityAction;
  actor_id: string | null;
  changed_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
};

const FIELD_LABELS: Record<string, string> = {
  title: "title",
  amount: "amount",
  expense_date: "date",
  paid_to: "recipient",
  location: "location",
  purpose: "event/purpose",
  payment_method: "payment method",
  description: "description",
  notes: "notes",
  category_id: "category",
  division_id: "division",
};

async function mapRows(rows: AuditRow[]): Promise<ActivityItem[]> {
  const [profiles, divisions, categories] = await Promise.all([getProfiles(), getDivisions(), getCategories(true)]);
  const people = new Map(profiles.map((p) => [p.id, p.full_name]));
  const divs = new Map(divisions.map((d) => [d.id, d]));
  const cats = new Map(categories.map((c) => [c.id, c.name]));

  return rows.map((r) => {
    const snap = (r.action === "deleted" ? r.old_data : r.new_data) ?? r.old_data ?? {};
    const d = divs.get(String(snap.division_id ?? ""));
    const changes =
      r.action === "updated" && r.old_data && r.new_data
        ? Object.keys(FIELD_LABELS).filter((k) => JSON.stringify(r.old_data![k]) !== JSON.stringify(r.new_data![k]))
        : [];
    return {
      id: String(r.id),
      expenseId: r.expense_id,
      action: r.action,
      at: r.changed_at,
      actorId: r.actor_id,
      actorName: (r.actor_id && people.get(r.actor_id)) || "Unknown user",
      title: String(snap.title ?? "Untitled expense"),
      amount: Number(snap.amount ?? 0),
      expenseDate: (snap.expense_date as string) ?? null,
      division: d ? { name: d.short_name, color: d.color } : null,
      category: cats.get(String(snap.category_id ?? "")) ?? null,
      addedByName: people.get(String(snap.created_by ?? "")) ?? null,
      changes: changes.map((k) => FIELD_LABELS[k]),
      amountFrom: changes.includes("amount") ? Number(r.old_data?.amount ?? 0) : undefined,
    };
  });
}

export async function getActivity(opts: { action?: ActivityAction; limit?: number; since?: string } = {}) {
  const { supabase } = await requireMember();
  let q = supabase
    .from("expense_audit")
    .select("id, expense_id, action, actor_id, changed_at, old_data, new_data")
    .order("changed_at", { ascending: false })
    .limit(opts.limit ?? 100);
  if (opts.action) q = q.eq("action", opts.action);
  if (opts.since) q = q.gte("changed_at", opts.since);
  const { data, error } = await q;
  if (error) throw error;
  // Skip no-op edits (e.g. saving without changing anything).
  const items = await mapRows((data ?? []) as AuditRow[]);
  return items.filter((i) => i.action !== "updated" || i.changes.length > 0);
}

/** If an expense was deleted, returns who deleted it, when, and what it was. */
export async function getDeletion(expenseId: string) {
  const { supabase } = await requireMember();
  const { data } = await supabase
    .from("expense_audit")
    .select("id, expense_id, action, actor_id, changed_at, old_data, new_data")
    .eq("expense_id", expenseId)
    .eq("action", "deleted")
    .order("changed_at", { ascending: false })
    .limit(1);
  if (!data?.length) return null;
  const [item] = await mapRows(data as AuditRow[]);
  return { item, snapshot: (data[0] as AuditRow).old_data ?? {} };
}
