"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEMO, DEMO_USERS } from "@/lib/demo/config";
import { initials } from "@/lib/utils";

function DemoLogin({ next }: { next: string }) {
  return (
    <div>
      <span className="badge bg-accent-50 text-accent-600">Demo mode</span>
      <h2 className="mt-3 text-2xl font-semibold text-navy-900">Choose who you are</h2>
      <p className="mt-1.5 text-sm text-ink-subtle">
        This demo runs on sample data. Pick any of the three authorized users to sign in — no password needed.
      </p>
      <div className="mt-8 space-y-3">
        {DEMO_USERS.map((u, i) => (
          <form key={u.id} action="/auth/demo" method="post">
            <input type="hidden" name="user" value={u.id} />
            <input type="hidden" name="next" value={next} />
            <button
              type="submit"
              className="group flex w-full items-center gap-3 rounded-xl border border-line bg-white p-3.5 text-left transition hover:border-emerald-500 hover:shadow-card"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: ["#2B4FB8", "#0E9F6E", "#D9650B"][i] }}
              >
                {initials(u.full_name)}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-navy-900">{u.full_name}</span>
                <span className="block text-xs text-ink-subtle">{u.email}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
            </button>
          </form>
        ))}
      </div>
      <p className="mt-6 text-xs text-ink-subtle">
        Changes you make are kept in memory and reset when the server restarts.
      </p>
    </div>
  );
}

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  if (DEMO) return <DemoLogin next={next} />;
  return <RealLoginForm next={next} />;
}

function RealLoginForm({ next }: { next: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const reason = params.get("error");

  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    reason === "unauthorized"
      ? "This account is not on the authorized users list. Contact an administrator."
      : reason === "auth"
        ? "That link is invalid or has expired. Please try again."
        : null,
  );
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setError(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
        setLoading(false);
        return;
      }
      router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/account`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setInfo("If that email is registered, a reset link is on its way.");
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-navy-900">
        {mode === "signin" ? "Welcome back" : "Reset your password"}
      </h2>
      <p className="mt-1.5 text-sm text-ink-subtle">
        {mode === "signin"
          ? "Sign in to manage business expenses."
          : "We’ll email you a secure link to set a new password."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-9"
              placeholder="you@company.com"
            />
          </div>
        </div>

        {mode === "signin" && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="label mb-0">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setMode("reset");
                  setError(null);
                }}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-9"
                placeholder="••••••••"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
        )}
        {info && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
            {info}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary h-11 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "signin" ? "Sign in" : "Send reset link"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>

        {mode === "reset" && (
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setInfo(null);
              setError(null);
            }}
            className="btn-ghost w-full"
          >
            Back to sign in
          </button>
        )}
      </form>
    </div>
  );
}
