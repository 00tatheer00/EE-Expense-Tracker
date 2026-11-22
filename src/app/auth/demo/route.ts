import { NextResponse, type NextRequest } from "next/server";
import { DEMO, DEMO_COOKIE, isDemoUser } from "@/lib/demo/config";

/** Demo sign-in: sets a cookie identifying which sample user you are. */
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (!DEMO) return NextResponse.redirect(`${origin}/login`, { status: 303 });

  const form = await request.formData();
  const user = String(form.get("user") ?? "");
  const nextParam = String(form.get("next") ?? "/");
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (!isDemoUser(user)) return NextResponse.redirect(`${origin}/login`, { status: 303 });

  const res = NextResponse.redirect(`${origin}${next}`, { status: 303 });
  res.cookies.set(DEMO_COOKIE, user, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
