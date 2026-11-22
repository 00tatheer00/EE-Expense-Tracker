import { createBrowserClient } from "@supabase/ssr";
import { DEMO } from "@/lib/demo/config";
import { createDemoBrowserClient } from "@/lib/demo/browser-client";

function createRealClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export function createClient() {
  if (DEMO) return createDemoBrowserClient() as unknown as ReturnType<typeof createRealClient>;
  return createRealClient();
}
