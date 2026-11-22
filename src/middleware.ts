import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets, icons and the web-app manifest (they must load without signing in).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|app-icon|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)",
  ],
};
