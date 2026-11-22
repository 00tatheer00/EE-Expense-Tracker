import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEMO, DEMO_COOKIE } from "@/lib/demo/config";

async function signOut(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL("/login", request.nextUrl.origin);
  if (request.nextUrl.searchParams.get("reason") === "unauthorized") {
    url.searchParams.set("error", "unauthorized");
  }
  const res = NextResponse.redirect(url, { status: 303 });
  if (DEMO) res.cookies.delete(DEMO_COOKIE);
  return res;
}

export const GET = signOut;
export const POST = signOut;
