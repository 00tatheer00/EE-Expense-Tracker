"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { PAYMENT_METHODS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Opt = { id: string; name: string };
type DivOpt = Opt & { color?: string };

const SHEET_KEYS = ["category", "method", "user", "from", "to"] as const;

export function FilterBar({
  divisions,
  categories,
  users,
  showSearch = true,
  showSort = true,
}: {
  divisions: DivOpt[];
  categories: (Opt & { division_id: string })[];
  users: Opt[];
  showSearch?: boolean;
  showSort?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);

  const division = params.get("division") ?? "";
  const visibleCats = useMemo(
    () => categories.filter((c) => !division || c.division_id === division),
    [categories, division],
  );

  function update(patch: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    p.delete("page");
    startTransition(() => router.push(`${pathname}?${p.toString()}`, { scroll: false }));
  }

  // Debounced search
  useEffect(() => {
    if (!showSearch) return;
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => update({ q: q.trim() || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const activeCount = SHEET_KEYS.filter((k) => params.get(k)).length;

  const fields = (
    <>
      <label className="block">
        <span className="label sm:sr-only">Category</span>
        <select
          className="input"
          value={params.get("category") ?? ""}
          onChange={(e) => update({ category: e.target.value || null })}
        >
          <option value="">All categories</option>
          {visibleCats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {!division ? ` · ${divisions.find((d) => d.id === c.division_id)?.name ?? ""}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label sm:sr-only">Payment method</span>
        <select
          className="input"
          value={params.get("method") ?? ""}
          onChange={(e) => update({ method: e.target.value || null })}
        >
          <option value="">All payment methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label sm:sr-only">Added by</span>
        <select
          className="input"
          value={params.get("user") ?? ""}
          onChange={(e) => update({ user: e.target.value || null })}
        >
          <option value="">Added by anyone</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1">
        <label className="block min-w-0">
          <span className="label sm:sr-only">From</span>
          <input
            type="date"
            className="input min-w-0"
            value={params.get("from") ?? ""}
            onChange={(e) => update({ from: e.target.value || null })}
            aria-label="From date"
          />
        </label>
        <label className="block min-w-0">
          <span className="label sm:sr-only">To</span>
          <input
            type="date"
            className="input min-w-0"
            value={params.get("to") ?? ""}
            onChange={(e) => update({ to: e.target.value || null })}
            aria-label="To date"
          />
        </label>
      </div>
      {showSort && (
        <label className="block sm:hidden">
          <span className="label">Sort by</span>
          <select className="input" value={params.get("sort") ?? ""} onChange={(e) => update({ sort: e.target.value || null })}>
            <option value="">Newest date first</option>
            <option value="date_asc">Oldest date first</option>
            <option value="amount_desc">Highest amount</option>
            <option value="amount_asc">Lowest amount</option>
            <option value="created_desc">Recently added</option>
          </select>
        </label>
      )}
    </>
  );

  return (
    <div className="mb-4">
      {/* Division chips — one tap to switch */}
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {[{ id: "", name: "All", color: undefined } as DivOpt, ...divisions].map((d) => {
          const active = division === d.id;
          return (
            <button
              key={d.id || "all"}
              type="button"
              onClick={() => update({ division: d.id || null, category: null })}
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition active:scale-95",
                active ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-ink-muted",
              )}
            >
              {d.color && <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />}
              {d.name}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        {showSearch && (
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10"
              type="search"
              enterKeyHint="search"
              placeholder="Search expenses…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {pending && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-subtle" />
            )}
          </div>
        )}
        {showSort && (
          <select
            className="input hidden w-48 sm:block"
            value={params.get("sort") ?? ""}
            onChange={(e) => update({ sort: e.target.value || null })}
            aria-label="Sort"
          >
            <option value="">Newest date first</option>
            <option value="date_asc">Oldest date first</option>
            <option value="amount_desc">Highest amount</option>
            <option value="amount_asc">Lowest amount</option>
            <option value="created_desc">Recently added</option>
          </select>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn("btn-secondary h-12 shrink-0 px-3.5 sm:h-10", open && "sm:bg-navy-50")}
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className={cn(!showSearch ? "inline" : "hidden sm:inline")}>Filters</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-emerald-500 px-1.5 text-[11px] font-semibold text-white">{activeCount}</span>
          )}
        </button>
      </div>

      {/* Desktop: inline panel */}
      {open && (
        <div className="card mt-3 hidden grid-cols-2 gap-3 p-4 sm:grid lg:grid-cols-4">{fields}</div>
      )}

      {/* Mobile: bottom sheet */}
      <div className={cn("fixed inset-0 z-50 sm:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          className={cn("absolute inset-0 bg-navy-950/40 transition-opacity", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-pop transition-transform duration-300",
            open ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between bg-white pb-3 pt-3">
            <span className="text-base font-semibold text-navy-900">Filters</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-ink-subtle active:bg-slate-100" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">{fields}</div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn-secondary h-12"
              onClick={() => {
                setQ("");
                update({ category: null, method: null, user: null, from: null, to: null, q: null });
              }}
            >
              Reset
            </button>
            <button type="button" className="btn-primary h-12" onClick={() => setOpen(false)}>
              Show results
            </button>
          </div>
        </div>
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:underline"
          onClick={() => {
            setQ("");
            update({ division: null, category: null, method: null, user: null, from: null, to: null, q: null });
          }}
        >
          <X className="h-3.5 w-3.5" /> Clear all filters
        </button>
      )}
    </div>
  );
}
