import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DEMO, DEMO_COOKIE } from "@/lib/demo/config";

function createRealClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component — middleware refreshes the session.
          }
        },
      },
    },
  );
}

export async function createClient() {
  const cookieStore = await cookies();
  if (DEMO) {
    const { createDemoServerClient } = await import("@/lib/demo/server-client");
    return createDemoServerClient(cookieStore.get(DEMO_COOKIE)?.value) as unknown as ReturnType<
      typeof createRealClient
    >;
  }
  return createRealClient(cookieStore);
}
