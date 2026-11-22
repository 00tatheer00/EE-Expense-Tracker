import { Suspense } from "react";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-900 p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight text-white">
            One place to track every rupee across all three businesses.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-navy-200">
            Independent records for each division, shared visibility for the team, and instant email
            alerts whenever a new expense is logged.
          </p>
          <div className="mt-10 space-y-3">
            {[
              { name: "Emerging Edge", color: "#2B4FB8", sub: "Company operations" },
              { name: "EEST", color: "#0E9F6E", sub: "School of Technology" },
              { name: "STYLONE", color: "#D9650B", sub: "E-commerce" },
            ].map((d) => (
              <div
                key={d.name}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-sm font-medium text-white">{d.name}</span>
                <span className="ml-auto text-xs text-navy-200">{d.sub}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-navy-200/70">Authorized personnel only.</p>
      </div>

      <div className="flex items-center justify-center bg-white px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
