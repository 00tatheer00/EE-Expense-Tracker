"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Check, Loader2, Pencil, Plus, X } from "lucide-react";
import { createCategory, renameCategory, setCategoryActive } from "@/app/actions/expenses";
import type { Category, Division } from "@/lib/types";
import { cn } from "@/lib/utils";

function CategoryRow({ c, usage }: { c: Category; usage: number }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(c.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <li className={cn("group px-4 py-2.5", !c.is_active && "bg-slate-50/60")}>
      {editing ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await renameCategory(c.id, name);
              if (!res.ok) setError(res.error);
              else {
                setError(null);
                setEditing(false);
              }
            });
          }}
        >
          <input className="input h-8 text-[13px]" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <button className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50" aria-label="Save" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="rounded-lg p-1.5 text-ink-subtle hover:bg-slate-100"
            onClick={() => {
              setEditing(false);
              setName(c.name);
              setError(null);
            }}
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <span className={cn("flex-1 truncate text-sm", c.is_active ? "text-ink" : "text-ink-subtle line-through")}>
            {c.name}
          </span>
          <span className="text-xs tabular-nums text-ink-subtle">{usage}</span>
          <div className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            <button
              className="rounded-lg p-1.5 text-ink-subtle hover:bg-slate-100 hover:text-navy-900"
              onClick={() => setEditing(true)}
              aria-label={`Rename ${c.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              className="rounded-lg p-1.5 text-ink-subtle hover:bg-slate-100 hover:text-navy-900"
              disabled={pending}
              onClick={() => start(async () => void (await setCategoryActive(c.id, !c.is_active)))}
              title={c.is_active ? "Archive (hide from new expenses)" : "Restore"}
              aria-label={c.is_active ? `Archive ${c.name}` : `Restore ${c.name}`}
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : c.is_active ? (
                <Archive className="h-3.5 w-3.5" />
              ) : (
                <ArchiveRestore className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
      {error && <p className="field-error">{error}</p>}
    </li>
  );
}

function AddCategory({ divisionId }: { divisionId: string }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="border-t border-line p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        start(async () => {
          const res = await createCategory({ division_id: divisionId, name });
          if (!res.ok) setError(res.error);
          else {
            setName("");
            setError(null);
          }
        });
      }}
    >
      <div className="flex gap-2">
        <input
          className="input h-9 text-[13px]"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />
        <button className="btn-primary btn-sm h-9 shrink-0" disabled={pending || !name.trim()}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </form>
  );
}

export function CategoryManager({
  divisions,
  categories,
  usage,
}: {
  divisions: Division[];
  categories: Category[];
  usage: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {divisions.map((d) => {
        const cats = categories
          .filter((c) => c.division_id === d.id)
          .sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name));
        return (
          <div key={d.id} className="card flex flex-col overflow-hidden">
            <div className="h-1" style={{ background: d.color }} />
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <div className="card-title">{d.short_name}</div>
                <div className="card-sub">{cats.filter((c) => c.is_active).length} active categories</div>
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Uses</span>
            </div>
            <ul className="flex-1 divide-y divide-line border-t border-line">
              {cats.map((c) => (
                <CategoryRow key={c.id} c={c} usage={usage[c.id] ?? 0} />
              ))}
            </ul>
            <AddCategory divisionId={d.id} />
          </div>
        );
      })}
    </div>
  );
}
