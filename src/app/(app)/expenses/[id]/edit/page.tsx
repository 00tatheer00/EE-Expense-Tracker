import { notFound } from "next/navigation";
import { getCategories, getDivisions, requireMember } from "@/lib/data";
import type { Expense } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { ExpenseForm } from "@/components/ExpenseForm";

export const metadata = { title: "Edit expense" };

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireMember();

  const [divisions, categories, { data: expense }] = await Promise.all([
    getDivisions(),
    getCategories(true),
    supabase.from("expenses").select("*").eq("id", id).maybeSingle<Expense>(),
  ]);
  if (!expense) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit expense" description={expense.title} />
      <ExpenseForm divisions={divisions} categories={categories} expense={expense} />
    </div>
  );
}
