/**
 * Demo mode: runs the whole app on in-memory sample data — no Supabase needed.
 * Safety: it is ignored in production builds unless explicitly allowed, so a stray
 * NEXT_PUBLIC_DEMO_MODE on the hosting platform can never open a password-free login.
 */
export const DEMO =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" &&
  (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ALLOW_DEMO_IN_PRODUCTION === "true");

export const DEMO_COOKIE = "ee_demo_user";

export const DEMO_USERS = [
  { id: "11111111-1111-4111-8111-111111111111", email: "tatheer@demo.local", full_name: "Tatheer Hussain" },
  { id: "22222222-2222-4222-8222-222222222222", email: "shaheen@demo.local", full_name: "Sir Shaheen" },
  { id: "33333333-3333-4333-8333-333333333333", email: "komal@demo.local", full_name: "Komal Bibi" },
] as const;

export function isDemoUser(id: string | undefined | null) {
  return !!id && DEMO_USERS.some((u) => u.id === id);
}
