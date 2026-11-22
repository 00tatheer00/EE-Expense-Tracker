import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderExpenseEmail } from "@/lib/email";

/** Renders the notification email for an expense exactly as recipients see it. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: e } = await supabase
    .from("expenses")
    .select("*, division:divisions(name, color), category:categories(name), creator:profiles!expenses_created_by_fkey(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: recipients } = await supabase.from("profiles").select("full_name, email").eq("is_active", true);

  const { subject, html } = renderExpenseEmail({
    id: e.id,
    title: e.title,
    description: e.description,
    amount: Number(e.amount),
    expense_date: e.expense_date,
    paid_to: e.paid_to,
    location: e.location,
    purpose: e.purpose,
    payment_method: e.payment_method,
    notes: e.notes,
    hasReceipt: Boolean(e.receipt_path),
    divisionName: e.division?.name ?? "—",
    divisionColor: e.division?.color ?? "#2B4FB8",
    categoryName: e.category?.name ?? "—",
    addedBy: e.creator?.full_name ?? "—",
  });

  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const to = (recipients ?? []).map((r: { full_name: string; email: string }) => `${r.full_name} &lt;${esc(r.email)}&gt;`).join(", ");
  const header = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:24px auto 0;padding:14px 18px;background:#fff;border:1px solid #E6E9F0;border-radius:12px;font-size:13px;color:#334155;line-height:1.7">
    <div><strong>To:</strong> ${to}</div>
    <div><strong>Subject:</strong> ${esc(subject)}</div>
    <div style="margin-top:6px"><a href="/expenses/${esc(e.id)}" style="color:#0E9F6E;font-weight:600;text-decoration:none">← Back to expense</a></div>
  </div>`;

  return new NextResponse(html.replace(/<body([^>]*)>/, `<body$1>${header}`), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
