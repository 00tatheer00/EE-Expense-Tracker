import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyFilters, applySort, parseFilters } from "@/lib/filters";
import { EXPENSE_SELECT, type ExpenseWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

function csvCell(v: unknown) {
  if (v === null || v === undefined) return "";
  let s = String(v);
  // Neutralize spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.from("profiles").select("id").eq("id", user.id).eq("is_active", true).maybeSingle();
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = Object.fromEntries(request.nextUrl.searchParams.entries());
  const filters = parseFilters(sp);

  const { data, error } = await applySort(
    applyFilters(supabase.from("expenses").select(EXPENSE_SELECT).limit(50000), filters),
    filters.sort ?? "date_asc",
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as ExpenseWithRelations[];
  const header = [
    "Date",
    "Division",
    "Category",
    "Title",
    "Description",
    "Amount (PKR)",
    "Paid To",
    "Location",
    "Event / Purpose",
    "Payment Method",
    "Notes",
    "Receipt",
    "Added By",
    "Added At",
    "Expense ID",
  ];

  const lines = [header.join(",")];
  let total = 0;
  for (const e of rows) {
    total += Number(e.amount);
    lines.push(
      [
        e.expense_date,
        e.division?.name,
        e.category?.name,
        e.title,
        e.description,
        Number(e.amount).toFixed(2),
        e.paid_to,
        e.location,
        e.purpose,
        e.payment_method,
        e.notes,
        e.receipt_path ? "Yes" : "No",
        e.creator?.full_name,
        new Date(e.created_at).toISOString(),
        e.id,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  lines.push(["", "", "", "TOTAL", "", total.toFixed(2)].map(csvCell).join(","));

  const stamp = new Date().toISOString().slice(0, 10);
  const scope = filters.division ? rows[0]?.division?.short_name?.replace(/\W+/g, "-") ?? "division" : "all-divisions";
  const body = "﻿" + lines.join("\r\n"); // BOM so Excel reads UTF-8 correctly

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expenses-${scope}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
