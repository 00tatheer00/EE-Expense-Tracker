import type { NextRequest } from "next/server";
import { renderAppIcon } from "@/lib/app-icon";

export async function GET(request: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = size === "512" ? 512 : 192;
  const res = renderAppIcon(px, request.nextUrl.searchParams.has("maskable"));
  res.headers.set("Cache-Control", "public, max-age=604800, immutable");
  return res;
}
