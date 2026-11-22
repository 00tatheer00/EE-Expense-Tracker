export type Division = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  description: string | null;
  color: string;
  sort_order: number;
};

export type Category = {
  id: string;
  division_id: string;
  name: string;
  is_active: boolean;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
};

export type Expense = {
  id: string;
  division_id: string;
  category_id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  expense_date: string;
  paid_to: string;
  location: string | null;
  purpose: string | null;
  payment_method: string;
  notes: string | null;
  receipt_path: string | null;
  receipt_name: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ExpenseWithRelations = Expense & {
  division: Pick<Division, "id" | "slug" | "name" | "short_name" | "color"> | null;
  category: Pick<Category, "id" | "name"> | null;
  creator: Pick<Profile, "id" | "full_name"> | null;
};

export type MonthlyRow = { division_id: string; month: string; total: number; count: number };
export type CategoryMonthlyRow = MonthlyRow & { category_id: string };

export const EXPENSE_SELECT =
  "*, division:divisions(id, slug, name, short_name, color), category:categories(id, name), creator:profiles!expenses_created_by_fkey(id, full_name)";
