"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { PAYMENT_METHODS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Opt = { id: string; name: string };

export function FilterBar({
  divisions,
  categories,
  users,
  showSearch = true,
  showSort = true,
}: {
  divisions: Opt[];
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
  const [open, setOpen] = useState(() =>
    ["division", "category", "method", "user", "from", "to"].some((k) => params.get(k)),
  );

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
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
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

  const activeCount = ["division", "category", "method", "user", "from", "to"].filter((k) => params.get(k)).length;

  const selects = (
    <>
      <select
        className="input"
        value={division}
        onChange={(e) => update({ division: e.target.value || null, category: null })}
        aria-label="Division"
      >
        <option value="">All divisions</option>
        {divisions.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <select
        className="input"
        value={params.get("category") ?? ""}
        onChange={(e) => update({ category: e.target.value || null })}
        aria-label="Category"
      >
        <option value="">All categories</option>
        {visibleCats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {!division ? ` · ${divisions.find((d) => d.id === c.division_id)?.name ?? ""}` : ""}
          </option>
        ))}
      </select>
      <select
        className="input"
        value={params.get("method") ?? ""}
        onChange={(e) => update({ method: e.target.value || null })}
        aria-label="Payment method"
      >
        <option value="">All payment methods</option>
        {PAYMENT_METHODS.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
      <select
        className="input"
        value={params.get("user") ?? ""}
        onChange={(e) => update({ user: e.target.value || null })}
        aria-label="Added by"
      >
        <option value="">Added by anyone</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <input
          type="date"
          className="input min-w-0"
          value={params.get("from") ?? ""}
          onChange={(e) => update({ from: e.target.value || null })}
          aria-label="From date"
        />
        <span className="text-xs text-ink-subtle">to</span>
        <input
          type="date"
          className="input min-w-0"
          value={params.get("to") ?? ""}
          onChange={(e) => update({ to: e.target.value || null })}
          aria-label="To date"
        />
      </div>
    </>
  );

  return (
    <div className="card mb-4 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {showSearch && (
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search title, recipient, event, location, notes…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {pending && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-subtle" />
            )}
          </div>
        )}
        <div className="flex gap-2">
          {showSort && (
            <select
              className="input flex-1 sm:w-44"
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
            className={cn("btn-secondary shrink-0", open && "bg-navy-50")}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-emerald-500 px-1.5 text-[11px] font-semibold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-1 gap-3 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {selects}
        </div>
      )}

      {activeCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:underline"
            onClick={() => {
              setQ("");
              update({ division: null, category: null, method: null, user: null, from: null, to: null, q: null });
            }}
          >
            <X className="h-3.5 w-3.5" /> Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
