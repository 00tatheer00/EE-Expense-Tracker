import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { DEMO, DEMO_COOKIE, isDemoUser } from "@/lib/demo/config";

const PUBLIC_PATHS = ["/login", "/auth"];

function demoGate(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
  const signedIn = isDemoUser(request.cookies.get(DEMO_COOKIE)?.value);
  const url = request.nextUrl.clone();
  url.search = "";
  if (!signedIn && !isPublic) {
    url.pathname = "/login";
    if (path !== "/") url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (signedIn && path === "/login") {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next({ request });
}

function configError() {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Configuration required</title></head>
<body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#F7F8FB;color:#0F172A;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px">
<div style="max-width:520px;background:#fff;border:1px solid #E6E9F0;border-radius:16px;padding:28px">
<h1 style="font-size:20px;margin:0 0 8px;color:#0B1A3A">Supabase is not configured</h1>
<p style="font-size:14px;color:#475569;line-height:1.6;margin:0">The environment variables <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are missing from this deployment.
Add them in your hosting settings (Vercel → Project → Settings → Environment Variables) and <strong>redeploy</strong> — these values are built into the app, so a redeploy is required.</p>
</div></body></html>`;
  return new NextResponse(html, { status: 500, headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function updateSession(request: NextRequest) {
  if (DEMO) return demoGate(request);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey || !/^https:\/\//.test(supabaseUrl)) return configError();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // A temporary Supabase/network failure must not take the whole site down:
  // treat it as "signed out" so the user lands on the login page.
  let user = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch (err) {
    console.error("[middleware] auth check failed", err);
  }

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (path !== "/") url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
