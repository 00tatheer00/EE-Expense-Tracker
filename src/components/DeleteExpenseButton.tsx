"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteExpense } from "@/app/actions/expenses";

export function DeleteExpenseButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button type="button" className="btn-danger" onClick={() => setConfirming(true)}>
        <Trash2 className="h-4 w-4" /> Delete
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/40 p-4 backdrop-blur-[2px] sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-pop">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Trash2 className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-navy-900">Delete this expense?</h3>
        <p className="mt-1 text-sm text-ink-subtle">
          “{title}” and its receipt will be removed. The deletion is recorded in the audit log.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex gap-2">
          <button className="btn-secondary flex-1" onClick={() => setConfirming(false)} disabled={pending}>
            Cancel
          </button>
          <button
            className="btn flex-1 bg-red-600 text-white hover:bg-red-700"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await deleteExpense(id);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                router.replace("/expenses");
                router.refresh();
              })
            }
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Delete
          </button>
        </div>
      </div>
    </div>
  );
}
