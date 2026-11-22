import { cn, initials } from "@/lib/utils";

const PALETTE = ["#2B4FB8", "#0E9F6E", "#D9650B", "#7C3AED", "#0891B2"];

/** Stable colour per person so everyone recognises who added what at a glance. */
export function personColor(id: string | null | undefined) {
  if (!id) return "#64748B";
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function displayName(full: string | null | undefined) {
  return full ?? "Unknown";
}

export function AddedBy({
  id,
  name,
  size = "sm",
  showLabel = false,
  className,
}: {
  id?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
  className?: string;
}) {
  const dims = { xs: "h-5 w-5 text-[9px]", sm: "h-6 w-6 text-[10px]", md: "h-9 w-9 text-xs" }[size];
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <span
        className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", dims)}
        style={{ background: personColor(id) }}
        aria-hidden
      >
        {initials(name ?? "?")}
      </span>
      <span className="truncate">
        {showLabel && <span className="text-ink-subtle">Added by </span>}
        <span className="font-medium text-ink">{displayName(name)}</span>
      </span>
    </span>
  );
}
