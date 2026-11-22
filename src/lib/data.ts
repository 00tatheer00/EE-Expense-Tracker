import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Category, CategoryMonthlyRow, Division, MonthlyRow, Profile } from "@/lib/types";

/** Ensures the visitor is signed in AND on the authorized-users list. */
export const requireMember = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, is_active")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!profile || !profile.is_active) redirect("/auth/signout?reason=unauthorized");
  return { supabase, user, profile };
});

export const getDivisions = cache(async (): Promise<Division[]> => {
  const { supabase } = await requireMember();
  const { data, error } = await supabase.from("divisions").select("*").order("sort_order");
  if (error) throw error;
  return data as Division[];
});

export const getCategories = cache(async (includeInactive = false): Promise<Category[]> => {
  const { supabase } = await requireMember();
  let q = supabase.from("categories").select("id, division_id, name, is_active").order("name");
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data as Category[];
});

export const getProfiles = cache(async (): Promise<Profile[]> => {
  const { supabase } = await requireMember();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, is_active")
    .order("full_name");
  if (error) throw error;
  return data as Profile[];
});

export async function getMonthly(divisionId?: string): Promise<MonthlyRow[]> {
  const { supabase } = await requireMember();
  let q = supabase.from("expense_monthly").select("*").order("month");
  if (divisionId) q = q.eq("division_id", divisionId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, total: Number(r.total) })) as MonthlyRow[];
}

export async function getCategoryMonthly(opts: {
  from: string;
  to: string;
  divisionId?: string;
}): Promise<CategoryMonthlyRow[]> {
  const { supabase } = await requireMember();
  let q = supabase
    .from("expense_category_monthly")
    .select("*")
    .gte("month", opts.from)
    .lte("month", opts.to);
  if (opts.divisionId) q = q.eq("division_id", opts.divisionId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, total: Number(r.total) })) as CategoryMonthlyRow[];
}
