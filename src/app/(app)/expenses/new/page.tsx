import { getCategories, getDivisions } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ExpenseForm } from "@/components/ExpenseForm";

export const metadata = { title: "Add expense" };

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ division?: string }>;
}) {
  const sp = await searchParams;
  const [divisions, categories] = await Promise.all([getDivisions(), getCategories()]);
  const defaultDivisionId = divisions.find((d) => d.id === sp.division || d.slug === sp.division)?.id;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add expense" description="Record a new expense for one of the business divisions." />
      <ExpenseForm divisions={divisions} categories={categories} defaultDivisionId={defaultDivisionId} />
    </div>
  );
}
