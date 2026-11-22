import { renderAppIcon } from "@/lib/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS adds its own rounded corners, so render a full-bleed square.
export default function AppleIcon() {
  return renderAppIcon(180, true);
}
