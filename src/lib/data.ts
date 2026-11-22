import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Category, CategoryMonthlyRow, Division, MonthlyRow, Profile } from "@/lib/types";
import { DEMO } from "@/lib/demo/config";

type Supa = Awaited<ReturnType<typeof createClient>>;

/**
 * Reads the signed-in user's id without an extra round-trip to Supabase Auth.
 * The id comes from the access token itself (not the editable session JSON), and
 * the token is verified by the database on the profile query below — a forged or
 * expired token makes that query fail, so this is as safe as auth.getUser().
 */
async function currentUserId(supabase: Supa): Promise<string | null> {
  if (DEMO) {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Ensures the visitor is signed in AND on the authorized-users list. One DB round-trip. */
export const requireMember = cache(async () => {
  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, is_active")
    .eq("id", userId)
    .maybeSingle<Profile>();

  if (!profile || !profile.is_active) redirect("/auth/signout?reason=unauthorized");
  return { supabase, profile };
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
