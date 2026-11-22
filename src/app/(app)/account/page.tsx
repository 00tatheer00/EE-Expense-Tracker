import { CheckCircle2, LogOut, Mail, XCircle } from "lucide-react";
import { getProfiles, requireMember } from "@/lib/data";
import { emailConfigStatus } from "@/lib/email";
import { initials } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { PasswordForm } from "./PasswordForm";
import { EmailTest } from "./EmailTest";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account" };

function Check({ ok, label, value }: { ok: boolean; label: string; value?: string | null }) {
  return (
    <li className="flex items-center gap-2.5 py-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-red-500" />
      )}
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="ml-auto truncate text-right text-sm font-medium text-ink">{value ?? (ok ? "Set" : "Missing")}</span>
    </li>
  );
}

export default async function AccountPage() {
  const { profile } = await requireMember();
  const team = await getProfiles();
  const mail = emailConfigStatus();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Account" description="Your profile, email notifications and password." />

      <div className="space-y-5">
        <section className="card card-pad flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-900 text-lg font-semibold text-white">
            {initials(profile.full_name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-navy-900">{profile.full_name}</div>
            <div className="truncate text-sm text-ink-subtle">{profile.email}</div>
          </div>
        </section>

        <section id="email" className="card card-pad scroll-mt-20">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-emerald-600" />
            <div className="card-title">Email notifications</div>
          </div>
          <div className="card-sub">
            Every new expense is emailed to all {team.filter((t) => t.is_active).length} authorized users.
          </div>

          {mail.demo ? (
            <p className="mt-4 text-sm text-ink-subtle">Emails are previewed, not sent, in demo mode.</p>
          ) : (
            <>
              <ul className="mt-3 divide-y divide-line rounded-xl border border-line px-3.5">
                <Check ok={Boolean(mail.host)} label="Mail server" value={mail.host} />
                <Check ok={Boolean(mail.user)} label="Sending account" value={mail.user} />
                <Check ok={mail.hasPassword} label="App password" value={mail.hasPassword ? "Set (hidden)" : "Missing"} />
                <Check ok={Boolean(mail.from)} label="From" value={mail.from} />
              </ul>
              {!mail.configured && (
                <p className="mt-3 text-sm text-red-600">
                  Email settings are incomplete. Add the missing values in Vercel → Settings → Environment Variables, then
                  redeploy.
                </p>
              )}
              <EmailTest email={profile.email} />
            </>
          )}
        </section>

        <section className="card card-pad">
          <div className="card-title">Change password</div>
          <div className="card-sub">Use at least 8 characters.</div>
          <PasswordForm />
        </section>

        <section className="card overflow-hidden">
          <div className="px-5 pb-3 pt-5 sm:px-6">
            <div className="card-title">Authorized users</div>
            <div className="card-sub">Everyone here can manage all divisions and receives new-expense emails.</div>
          </div>
          <ul className="divide-y divide-line border-t border-line">
            {team.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                  {initials(u.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {u.full_name} {u.id === profile.id && <span className="text-xs text-ink-subtle">(you)</span>}
                  </div>
                  <div className="truncate text-xs text-ink-subtle">{u.email}</div>
                </div>
                <span
                  className={`badge ${u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-ink-subtle"}`}
                >
                  {u.is_active ? "Active" : "Disabled"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <form action="/auth/signout" method="post" className="lg:hidden">
          <button type="submit" className="btn-danger h-12 w-full">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
