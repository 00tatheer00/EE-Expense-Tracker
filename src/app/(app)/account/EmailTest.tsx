"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { sendTestEmailToMe } from "@/app/actions/expenses";

export function EmailTest({ email }: { email: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ sent: boolean; error?: string } | null>(null);

  return (
    <div className="mt-4">
      <button
        type="button"
        className="btn-success w-full sm:w-auto"
        disabled={pending}
        onClick={() => {
          setResult(null);
          start(async () => setResult(await sendTestEmailToMe()));
        }}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {pending ? "Sending…" : "Send me a test email"}
      </button>
      {result && (
        <div
          className={`mt-3 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
            result.sent ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {result.sent ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>
            {result.sent
              ? `Sent to ${email}. Check your inbox (and Spam) — it should arrive within a minute.`
              : result.error}
          </span>
        </div>
      )}
    </div>
  );
}
