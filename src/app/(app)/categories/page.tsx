import { getCategories, getCategoryMonthly, getDivisions } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { CategoryManager } from "@/components/CategoryManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const [divisions, categories, usageRows] = await Promise.all([
    getDivisions(),
    getCategories(true),
    getCategoryMonthly({ from: "1900-01-01", to: "2999-12-01" }),
  ]);
  const usage: Record<string, number> = {};
  usageRows.forEach((r) => (usage[r.category_id] = (usage[r.category_id] ?? 0) + r.count));

  return (
    <>
      <PageHeader
        title="Categories"
        description="Each division has its own categories. Archived categories stay on past expenses but are hidden from new ones."
      />
      <CategoryManager divisions={divisions} categories={categories} usage={usage} />
    </>
  );
}
