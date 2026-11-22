"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ReceiptText,
  Tags,
  UserCog,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn, initials } from "@/lib/utils";
import { DEMO } from "@/lib/demo/config";

type NavDivision = { slug: string; name: string; color: string };

const MAIN_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/reports", label: "Reports", icon: FileSpreadsheet },
];
const MANAGE_NAV = [
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/account", label: "Account", icon: UserCog },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  dot,
}: {
  href: string;
  label: string;
  icon?: React.ElementType;
  active: boolean;
  dot?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition",
        active ? "bg-white/10 text-white" : "text-navy-200 hover:bg-white/5 hover:text-white",
      )}
    >
      {Icon ? (
        <Icon className={cn("h-[18px] w-[18px]", active ? "text-emerald-400" : "text-navy-200/80")} />
      ) : (
        <span className="flex h-[18px] w-[18px] items-center justify-center">
          <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
        </span>
      )}
      {label}
    </Link>
  );
}

function SidebarContent({
  pathname,
  divisions,
  user,
}: {
  pathname: string;
  divisions: NavDivision[];
  user: { name: string; email: string };
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-6">
        <Logo light />
      </div>

      <div className="px-3">
        <Link href="/expenses/new" className="btn-success w-full">
          <Plus className="h-4 w-4" /> Add expense
        </Link>
      </div>

      <nav className="mt-6 flex-1 space-y-6 overflow-y-auto px-3">
        <div className="space-y-1">
          {MAIN_NAV.map((n) => (
            <NavLink key={n.href} {...n} active={isActive(pathname, n.href)} />
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-navy-200/60">
            <BarChart3 className="h-3.5 w-3.5" /> Divisions
          </div>
          <div className="space-y-1">
            {divisions.map((d) => (
              <NavLink
                key={d.slug}
                href={`/divisions/${d.slug}`}
                label={d.name}
                dot={d.color}
                active={isActive(pathname, `/divisions/${d.slug}`)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-navy-200/60">Manage</div>
          <div className="space-y-1">
            {MANAGE_NAV.map((n) => (
              <NavLink key={n.href} {...n} active={isActive(pathname, n.href)} />
            ))}
          </div>
        </div>
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
          {initials(user.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">{user.name}</div>
          <div className="truncate text-xs text-navy-200">{user.email}</div>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title="Sign out"
            className="rounded-lg p-2 text-navy-200 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  user,
  divisions,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  divisions: NavDivision[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-900 lg:block">
        <SidebarContent pathname={pathname} divisions={divisions} user={user} />
      </aside>

      {/* Mobile header */}
      <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="-ml-2 rounded-lg p-2 text-navy-900" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <Logo />
        <Link href="/expenses/new" className="-mr-1 rounded-lg bg-emerald-500 p-2 text-white" aria-label="Add expense">
          <Plus className="h-4 w-4" />
        </Link>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-navy-900 shadow-pop">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-5 rounded-lg p-2 text-navy-200 hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent pathname={pathname} divisions={divisions} user={user} />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        {DEMO && (
          <div className="no-print border-b border-accent-100 bg-accent-50 px-4 py-2 text-center text-xs text-accent-600 sm:px-6">
            <strong className="font-semibold">Demo mode</strong> — sample data only. Changes reset when the server
            restarts; emails are previewed, not sent.
          </div>
        )}
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
