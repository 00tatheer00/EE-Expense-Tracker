import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-9 w-9", className)} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0B1A3A" />
      <path d="M18 20h22v6H25v4h13v6H25v4h15v6H18z" fill="#fff" />
      <circle cx="47" cy="44" r="4" fill="#0E9F6E" />
      <circle cx="47" cy="20" r="3" fill="#D9650B" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className={light ? "ring-1 ring-white/10 rounded-[10px]" : undefined} />
      <div className="leading-tight">
        <div className={cn("text-[15px] font-semibold", light ? "text-white" : "text-navy-900")}>
          Emerging Edge
        </div>
        <div className={cn("text-[11px] font-medium", light ? "text-navy-200" : "text-ink-subtle")}>
          Expense Management
        </div>
      </div>
    </div>
  );
}
