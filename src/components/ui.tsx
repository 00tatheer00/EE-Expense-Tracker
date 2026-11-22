import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
        <h1 className="text-[22px] font-semibold tracking-tight text-navy-900 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-subtle">{description}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function DivisionBadge({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span
      className={cn("badge whitespace-nowrap", className)}
      style={{ background: `${color}14`, color: "#0F172A" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {name}
    </span>
  );
}

export function Delta({ value, invert = true }: { value: number | null; invert?: boolean }) {
  if (value === null || !isFinite(value)) return <span className="text-xs text-ink-subtle">No prior data</span>;
  const up = value > 0;
  // For expenses, going up is "bad" (orange); going down is "good" (emerald).
  const bad = invert ? up : !up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        value === 0 ? "text-ink-subtle" : bad ? "text-accent-600" : "text-emerald-600",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: "navy" | "emerald" | "orange";
}) {
  const accents = {
    navy: "bg-navy-50 text-navy-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-accent-50 text-accent-600",
  };
  return (
    <div className="card min-w-0 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[12px] font-medium leading-snug text-ink-subtle sm:text-[13px]">{label}</div>
        {icon && (
          <div className={cn("hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:flex", accents[accent ?? "navy"])}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-1.5 truncate text-lg font-semibold tracking-tight text-navy-900 tabular-nums sm:mt-2 sm:text-2xl">{value}</div>
      {sub && <div className="mt-1 text-[11px] leading-snug text-ink-subtle sm:mt-1.5 sm:text-xs">{sub}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">
        <Inbox className="h-5 w-5" />
      </div>
      <div className="mt-4 text-sm font-semibold text-navy-900">{title}</div>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-subtle">{description}</p>}
      {action && (
        <Link href={action.href} className="btn-secondary btn-sm mt-5">
          {action.label}
        </Link>
      )}
    </div>
  );
}
