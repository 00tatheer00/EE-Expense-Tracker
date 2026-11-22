"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/data";
import { PAYMENT_METHODS, RECEIPT_BUCKET } from "@/lib/constants";
import { sendExpenseNotification } from "@/lib/email";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const ExpenseSchema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(160),
  description: optionalText(2000),
  amount: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .positive("Amount must be greater than zero")
    .max(999_999_999_999, "Amount is too large"),
  division_id: z.string().uuid("Choose a business division"),
  category_id: z.string().uuid("Choose a category"),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  paid_to: z.string().trim().min(1, "Enter who was paid").max(160),
  location: optionalText(200),
  purpose: optionalText(200),
  payment_method: z.enum(PAYMENT_METHODS, { errorMap: () => ({ message: "Choose a payment method" }) }),
  notes: optionalText(2000),
  receipt_path: optionalText(500),
  receipt_name: optionalText(255),
});

export type ExpenseInput = z.input<typeof ExpenseSchema>;

export type ActionResult =
  | { ok: true; id: string; emailSent?: boolean; emailError?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function zodFail(err: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function createExpense(input: ExpenseInput): Promise<ActionResult> {
  const parsed = ExpenseSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const { supabase, profile } = await requireMember();

  const { data, error } = await supabase
    .from("expenses")
    .insert(parsed.data)
    .select("*, division:divisions(name, color), category:categories(name)")
    .single();

  if (error || !data) {
    console.error("[createExpense]", error);
    return { ok: false, error: error?.message ?? "Could not save the expense." };
  }

  // Notify every active authorized user.
  const { data: recipients } = await supabase
    .from("profiles")
    .select("email")
    .eq("is_active", true);

  const mail = await sendExpenseNotification(
    {
      id: data.id,
      title: data.title,
      description: data.description,
      amount: Number(data.amount),
      expense_date: data.expense_date,
      paid_to: data.paid_to,
      location: data.location,
      purpose: data.purpose,
      payment_method: data.payment_method,
      notes: data.notes,
      hasReceipt: Boolean(data.receipt_path),
      divisionName: data.division?.name ?? "—",
      divisionColor: data.division?.color ?? "#2B4FB8",
      categoryName: data.category?.name ?? "—",
      addedBy: profile.full_name,
    },
    (recipients ?? []).map((r) => r.email),
  );

  revalidateAll();
  return { ok: true, id: data.id, emailSent: mail.sent, emailError: mail.error };
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid expense." };
  const parsed = ExpenseSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const { supabase } = await requireMember();

  const { data: existing } = await supabase
    .from("expenses")
    .select("receipt_path")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Expense not found." };

  const { error } = await supabase.from("expenses").update(parsed.data).eq("id", id);
  if (error) {
    console.error("[updateExpense]", error);
    return { ok: false, error: error.message };
  }

  // Clean up a replaced or removed receipt file.
  if (existing.receipt_path && existing.receipt_path !== parsed.data.receipt_path) {
    await supabase.storage.from(RECEIPT_BUCKET).remove([existing.receipt_path]);
  }

  revalidateAll();
  return { ok: true, id };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid expense." };
  const { supabase } = await requireMember();

  const { data: existing } = await supabase
    .from("expenses")
    .select("receipt_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (existing?.receipt_path) {
    await supabase.storage.from(RECEIPT_BUCKET).remove([existing.receipt_path]);
  }

  revalidateAll();
  return { ok: true, id };
}

/** Removes an uploaded file that never got attached (e.g. save failed). */
export async function discardUpload(path: string) {
  const { supabase } = await requireMember();
  const { count } = await supabase
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("receipt_path", path);
  if (!count) await supabase.storage.from(RECEIPT_BUCKET).remove([path]);
}

// ---------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------
const CategorySchema = z.object({
  division_id: z.string().uuid(),
  name: z.string().trim().min(2, "Name is too short").max(80),
});

export async function createCategory(input: { division_id: string; name: string }) {
  const parsed = CategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const { supabase } = await requireMember();
  const { error } = await supabase.from("categories").insert(parsed.data);
  if (error) {
    return {
      ok: false as const,
      error: error.code === "23505" ? "That category already exists in this division." : error.message,
    };
  }
  revalidateAll();
  return { ok: true as const };
}

export async function renameCategory(id: string, name: string) {
  const parsed = z.string().trim().min(2).max(80).safeParse(name);
  if (!parsed.success) return { ok: false as const, error: "Name must be 2–80 characters." };
  const { supabase } = await requireMember();
  const { error } = await supabase.from("categories").update({ name: parsed.data }).eq("id", id);
  if (error) {
    return {
      ok: false as const,
      error: error.code === "23505" ? "That category already exists in this division." : error.message,
    };
  }
  revalidateAll();
  return { ok: true as const };
}

export async function setCategoryActive(id: string, isActive: boolean) {
  const { supabase } = await requireMember();
  const { error } = await supabase.from("categories").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidateAll();
  return { ok: true as const };
}
