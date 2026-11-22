"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  FileSpreadsheet,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ReceiptText,
  Tags,
  UserCog,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { cn, initials } from "@/lib/utils";
import { DEMO } from "@/lib/demo/config";
import { LiveRefresh } from "@/components/LiveRefresh";

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

/* ------------------------------ Desktop sidebar ------------------------------ */

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

function Sidebar({
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

/* ------------------------------ Mobile chrome ------------------------------ */

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 pt-2 text-[11px] font-medium transition active:scale-95",
        active ? "text-navy-900" : "text-slate-400",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition", active && "bg-emerald-50")}>
        <Icon className={cn("h-[21px] w-[21px]", active && "text-emerald-600")} strokeWidth={active ? 2.3 : 2} />
      </span>
      {label}
    </Link>
  );
}

function MoreSheet({
  open,
  onClose,
  divisions,
  user,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  divisions: NavDivision[];
  user: { name: string; email: string };
  pathname: string;
}) {
  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <div
        className={cn("absolute inset-0 bg-navy-950/40 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="More options"
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-pop transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="sticky top-0 bg-white pb-2 pt-3">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-200" />
        </div>

        <Link href="/account" onClick={onClose} className="mx-4 flex items-center gap-3 rounded-2xl bg-navy-50 p-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold text-navy-900">{user.name}</div>
            <div className="truncate text-xs text-ink-subtle">{user.email}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-subtle" />
        </Link>

        <div className="mt-5 px-4">
          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Divisions</div>
          <div className="overflow-hidden rounded-2xl border border-line">
            {divisions.map((d) => (
              <Link
                key={d.slug}
                href={`/divisions/${d.slug}`}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0 active:bg-slate-50",
                  isActive(pathname, `/divisions/${d.slug}`) && "bg-slate-50",
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${d.color}1A` }}>
                  <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                </span>
                <span className="flex-1 text-[15px] font-medium text-ink">{d.name}</span>
                <ChevronRight className="h-4 w-4 text-ink-subtle" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-5 px-4">
          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Manage</div>
          <div className="overflow-hidden rounded-2xl border border-line">
            {MANAGE_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0 active:bg-slate-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="flex-1 text-[15px] font-medium text-ink">{label}</span>
                <ChevronRight className="h-4 w-4 text-ink-subtle" />
              </Link>
            ))}
          </div>
        </div>

        <form action="/auth/signout" method="post" className="mt-5 px-4">
          <button type="submit" className="btn-danger h-12 w-full rounded-2xl text-[15px]">
            <LogOut className="h-4 w-4" /> Sign out
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
  const [moreOpen, setMoreOpen] = useState(false);

  // Full-screen form pages have their own sticky Save bar instead of tabs.
  const isFormPage = pathname === "/expenses/new" || /^\/expenses\/[^/]+\/edit$/.test(pathname);
  const moreActive =
    pathname.startsWith("/divisions") || pathname.startsWith("/categories") || pathname.startsWith("/account");

  useEffect(() => setMoreOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = moreOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  return (
    <div className="min-h-screen">
      <LiveRefresh />
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-900 lg:block">
        <Sidebar pathname={pathname} divisions={divisions} user={user} />
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="text-[15px] font-semibold text-navy-900">EE Expenses</span>
          </Link>
          <Link
            href="/account"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white active:scale-95"
            aria-label="Account"
          >
            {initials(user.name)}
          </Link>
        </div>
      </header>

      <main
        className={cn(
          "lg:pl-64",
          isFormPage ? "pb-6" : "pb-[calc(env(safe-area-inset-bottom)+6rem)] lg:pb-0",
        )}
      >
        {DEMO && (
          <div className="no-print border-b border-accent-100 bg-accent-50 px-4 py-2 text-center text-xs text-accent-600 sm:px-6">
            <strong className="font-semibold">Demo mode</strong> — sample data only. Changes reset when the server
            restarts; emails are previewed, not sent.
          </div>
        )}
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>

      {/* Mobile bottom tab bar */}
      {!isFormPage && (
        <nav
          className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
          aria-label="Main"
        >
          <div className="mx-auto flex h-16 max-w-lg items-stretch px-1">
            <TabLink href="/" label="Home" icon={Home} active={isActive(pathname, "/")} />
            <TabLink href="/expenses" label="Expenses" icon={ReceiptText} active={isActive(pathname, "/expenses")} />
            <div className="flex flex-1 items-start justify-center">
              <Link
                href="/expenses/new"
                aria-label="Add expense"
                className="-mt-5 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_8px_20px_-6px_rgba(14,159,110,0.7)] ring-4 ring-white transition active:scale-90"
              >
                <Plus className="h-7 w-7" strokeWidth={2.5} />
              </Link>
            </div>
            <TabLink href="/reports" label="Reports" icon={FileSpreadsheet} active={isActive(pathname, "/reports")} />
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 pt-2 text-[11px] font-medium transition active:scale-95",
                moreActive ? "text-navy-900" : "text-slate-400",
              )}
            >
              <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", moreActive && "bg-emerald-50")}>
                <Menu className={cn("h-[21px] w-[21px]", moreActive && "text-emerald-600")} />
              </span>
              More
            </button>
          </div>
        </nav>
      )}

      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        divisions={divisions}
        user={user}
        pathname={pathname}
      />
    </div>
  );
}
